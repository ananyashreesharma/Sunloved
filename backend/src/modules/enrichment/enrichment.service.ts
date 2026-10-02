import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../../prisma/prisma.service';

export interface IngredientEnrichment {
  shortDescription: string | null;
  zone: 'red' | 'yellow' | 'green' | null;
  function: string | null;
}

const MODEL = 'gpt-5-nano';

@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Looks up (or generates via LLM) a short description + red/yellow/green safety zone for an
   * ingredient nobody's seen before. Results are cached in AiCache by ingredient name so the same
   * unknown ingredient submitted by multiple contributions only costs one API call.
   * Never throws — enrichment failures degrade to a null-zone ingredient rather than blocking a contribution.
   */
  async enrichIngredient(name: string): Promise<IngredientEnrichment> {
    const cacheKey = `ingredient:${name.trim().toLowerCase()}`;

    const cached = await this.prisma.aiCache.findUnique({ where: { cacheKey } });
    if (cached) {
      await this.prisma.aiCache.update({
        where: { cacheKey },
        data: { hitCount: { increment: 1 } },
      });
      return this.parseResponse(cached.response);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.warn(`OPENAI_API_KEY not set — skipping enrichment for "${name}"`);
      return { shortDescription: null, zone: null, function: null };
    }

    const prompt = `You are a cosmetic ingredient safety reference. For the skincare/cosmetic ingredient "${name}", respond with ONLY a JSON object (no markdown, no extra text) in this exact shape: {"shortDescription": "<5 words max, plain language>", "zone": "red" | "yellow" | "green", "function": "<short function like Humectant, Emollient, Preservative, or null>"}. "red" = known irritant/harmful/banned in some regions, "yellow" = caution/controversial/comedogenic, "green" = generally well-tolerated. If you don't recognize this as a real ingredient, respond with {"shortDescription": null, "zone": null, "function": null}.`;

    let raw: string;
    try {
      const client = new OpenAI({ apiKey });
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
      });
      raw = completion.choices[0]?.message?.content ?? '';
    } catch (err) {
      this.logger.error(`Enrichment API call failed for "${name}": ${err}`);
      return { shortDescription: null, zone: null, function: null };
    }

    const parsed = this.parseResponse(raw);

    await this.prisma.aiCache.create({
      data: { cacheKey, prompt, response: raw, model: MODEL },
    });

    return parsed;
  }

  private parseResponse(raw: string): IngredientEnrichment {
    try {
      const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      const obj = JSON.parse(cleaned);
      const zone = obj.zone === 'red' || obj.zone === 'yellow' || obj.zone === 'green' ? obj.zone : null;
      return {
        shortDescription: typeof obj.shortDescription === 'string' ? obj.shortDescription : null,
        zone,
        function: typeof obj.function === 'string' ? obj.function : null,
      };
    } catch (err) {
      this.logger.warn(`Could not parse enrichment response: ${raw}`);
      return { shortDescription: null, zone: null, function: null };
    }
  }
}
