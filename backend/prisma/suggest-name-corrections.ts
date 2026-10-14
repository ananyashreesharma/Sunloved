/**
 * Suggest name corrections for Ingredients + Products using OpenAI,
 * with a cache file so you don't pay twice.
 *
 * Safe-by-default:
 * - Default mode is dry-run (no DB writes).
 * - Writes suggestions to prisma/data/name-corrections.jsonl
 * - Optional --apply-high applies only low-risk updates:
 *   - Product.name (never touches Product.id)
 *   - Ingredient.displayName + Ingredient.aliases (never renames inciName)
 *
 * Usage (from backend/):
 *   npx ts-node prisma/suggest-name-corrections.ts --kind=ingredients --limit=50
 *   npx ts-node prisma/suggest-name-corrections.ts --kind=products --limit=50
 *   npx ts-node prisma/suggest-name-corrections.ts --kind=both --limit=50
 *   npx ts-node prisma/suggest-name-corrections.ts --kind=ingredients --apply-high --limit=20
 *
 * Env:
 *   OPENAI_API_KEY (required to call OpenAI)
 *   OPENAI_MODEL   (optional, default: gpt-4o-mini)
 *   OPENAI_TIER    (optional; tier>=1 uses faster delays)
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

type Kind = "ingredients" | "products" | "both";

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      out[k] = v ?? true;
    }
  }
  return out;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function jsonlAppend(filePath: string, obj: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(obj) + "\n");
}

function loadJsonlIds(filePath: string): Set<string> {
  const seen = new Set<string>();
  if (!fs.existsSync(filePath)) return seen;
  const txt = fs.readFileSync(filePath, "utf8");
  for (const line of txt.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      const j = JSON.parse(t);
      if (typeof j?.key === "string") seen.add(j.key);
    } catch {
      // ignore malformed lines
    }
  }
  return seen;
}

function looksSuspiciousIngredientName(n: string): boolean {
  const s = n.trim();
  if (!s) return true;
  if (s.length > 90) return true;
  if (/&[a-z]+;|&#\d+;/.test(s)) return true;
  if (/[0-9#*]\uFE0F?\u20E3/.test(s)) return true; // keycap emoji
  // contains obvious marketing punctuation
  if (/[!?]{1,}/.test(s)) return true;
  // lowercase multiword phrase like "acne marks"
  if (/^[a-z]/.test(s) && s.includes(" ")) return true;
  // very long all-caps blobs
  const letters = (s.match(/[A-Za-z]/g) ?? []).length;
  const upper = (s.match(/[A-Z]/g) ?? []).length;
  const words = s.split(/\s+/).filter(Boolean).length;
  if (letters >= 12 && upper / Math.max(letters, 1) > 0.85 && words >= 4) return true;
  // common "non-INCI" fragments that slipped through
  if (/\b(directions|apply|avoid contact|for best results|massage|rinse off)\b/i.test(s)) return true;
  return false;
}

function looksSuspiciousProductName(n: string): boolean {
  const s = n.trim();
  if (!s) return true;
  if (s.length > 140) return true;
  if (/&[a-z]+;|&#\d+;/.test(s)) return true;
  if (/[0-9#*]\uFE0F?\u20E3/.test(s)) return true;
  // too many separators typical of scraped payloads
  if ((s.match(/[|•·•]/g) ?? []).length >= 3) return true;
  // includes obvious instruction text
  if (/\b(directions|apply|avoid contact|for best results|massage|rinse off)\b/i.test(s)) return true;
  return false;
}

async function openAiSuggestJSON(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 260,
      messages: [
        {
          role: "system",
          content:
            'Return ONLY valid JSON. You are a cosmetics + catalog normalization expert. No markdown, no extra text.',
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t.slice(0, 500)}`);
  }

  const json = (await res.json()) as any;
  const content = String(json?.choices?.[0]?.message?.content ?? "").trim();
  const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

function ingredientPrompt(inciName: string) {
  return `Clean/standardize this cosmetic ingredient reference entry.

Input: "${inciName}"

Return ONLY this JSON:
{
  "is_ingredient": true,
  "canonical_inci_name": "string (INCI standard)",
  "aliases": ["string", "..."],
  "note": "optional short note",
  "confidence": "high|medium|low"
}

Rules:
- If this is marketing text, usage instructions, skin concerns, or claims, set is_ingredient=false.
- If input is a common name (e.g. Badam Oil), convert to the correct INCI (e.g. Prunus Amygdalus Dulcis Oil).
- Keep it short; do not include % concentrations or instructions.
`;
}

function productPrompt(productName: string, brandName?: string | null) {
  const b = brandName ? `Brand: "${brandName}"\n` : "";
  return `Clean/standardize this product name for an e-commerce catalog.

${b}Input: "${productName}"

Return ONLY this JSON:
{
  "clean_name": "string",
  "note": "optional short note",
  "confidence": "high|medium|low"
}

Rules:
- Remove usage instructions, marketing sentences, emojis, and obvious scraped junk.
- Keep the core product name (do not invent a new product).
- Keep size like "30 ml" only if it's already present and clearly part of name; otherwise omit.
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const kind = (String(args.kind ?? "ingredients") as Kind) || "ingredients";
  const limit = args.limit ? parseInt(String(args.limit), 10) : 50;
  const applyHigh = args["apply-high"] === true;

  const outPath = path.join(__dirname, "data", "name-corrections.jsonl");
  const seen = loadJsonlIds(outPath);

  const prisma = new PrismaClient();

  const tier = parseInt(process.env.OPENAI_TIER ?? "0", 10);
  // Free tier is very low RPM for many models; use a conservative delay.
  const delayMs = tier >= 1 ? 800 : 22000;

  console.log(
    `Suggesting corrections kind=${kind} limit=${limit} applyHigh=${applyHigh} model=${process.env.OPENAI_MODEL ?? "gpt-4o-mini"}`,
  );

  if (!process.env.OPENAI_API_KEY) {
    console.log("OPENAI_API_KEY not set. This script needs it to call OpenAI.");
    await prisma.$disconnect();
    process.exit(1);
  }

  let processed = 0;
  let applied = 0;

  if (kind === "ingredients" || kind === "both") {
    // Focus on not-yet-enriched or suspicious-looking ingredient names
    const rows = await prisma.ingredient.findMany({
      select: {
        id: true,
        inciName: true,
        displayName: true,
        aliases: true,
        shortDescription: true,
        zone: true,
        safetyRating: true,
        lastReviewedAt: true,
      },
      orderBy: { inciName: "asc" },
      take: 5000, // filter client-side
    });

    for (const r of rows) {
      if (processed >= limit) break;
      const suspicious =
        looksSuspiciousIngredientName(r.inciName) ||
        (!r.shortDescription && !r.zone && !r.safetyRating && !r.lastReviewedAt);
      if (!suspicious) continue;

      const key = `ingredient:${r.id}`;
      if (seen.has(key)) continue;

      const prompt = ingredientPrompt(r.inciName);
      const suggestion = await openAiSuggestJSON(prompt);

      jsonlAppend(outPath, {
        key,
        kind: "ingredient",
        ingredientId: r.id,
        input: { inciName: r.inciName },
        suggestion,
        createdAt: new Date().toISOString(),
      });
      seen.add(key);
      processed++;

      if (applyHigh && suggestion?.is_ingredient === true && suggestion?.confidence === "high") {
        const aliases = Array.isArray(suggestion.aliases) ? suggestion.aliases : [];
        const merged = Array.from(new Set([...(r.aliases ?? []), ...aliases]))
          .map((x) => String(x).trim())
          .filter((x) => x.length >= 2 && x.length <= 80);

        // Do NOT rename inciName automatically (can break joins). Use displayName + aliases.
        const nextDisplay =
          typeof suggestion.canonical_inci_name === "string" &&
          suggestion.canonical_inci_name.trim() &&
          suggestion.canonical_inci_name.trim() !== r.inciName.trim()
            ? suggestion.canonical_inci_name.trim()
            : r.displayName;

        await prisma.ingredient.update({
          where: { id: r.id },
          data: {
            ...(nextDisplay ? { displayName: nextDisplay } : {}),
            ...(merged.length ? { aliases: merged } : {}),
          },
        });
        applied++;
      }

      await sleep(delayMs);
    }
  }

  if (kind === "products" || kind === "both") {
    const rows = await prisma.product.findMany({
      select: { id: true, name: true, brand: { select: { name: true } } },
      orderBy: { name: "asc" },
      take: 5000,
    });

    for (const r of rows) {
      if (processed >= limit) break;
      if (!looksSuspiciousProductName(r.name)) continue;

      const key = `product:${r.id}`;
      if (seen.has(key)) continue;

      const prompt = productPrompt(r.name, r.brand?.name);
      const suggestion = await openAiSuggestJSON(prompt);

      jsonlAppend(outPath, {
        key,
        kind: "product",
        productId: r.id,
        input: { name: r.name, brand: r.brand?.name ?? null },
        suggestion,
        createdAt: new Date().toISOString(),
      });
      seen.add(key);
      processed++;

      if (applyHigh && suggestion?.confidence === "high" && typeof suggestion?.clean_name === "string") {
        const clean = suggestion.clean_name.trim();
        if (clean && clean !== r.name.trim()) {
          await prisma.product.update({ where: { id: r.id }, data: { name: clean } });
          applied++;
        }
      }

      await sleep(delayMs);
    }
  }

  console.log(`Done. suggestions_written=${processed} applied=${applied}`);
  console.log(`Saved suggestions to: ${outPath}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

