// Splitting a pasted label into ingredients, the way labels are actually printed around the world.
// Mirrored in backend/src/modules/ingredients/label-parser.ts (the server re-reads what apps send);
// keep the two in step.
//
// Handles: "Ingredients:" / "Active ingredient:" / "Inactive ingredients:" / "May contain:" headings
// (in several languages), commas, semicolons, new lines, bullets, the Arabic comma (،), and full
// stops between ingredients, but never splits a chemical name like "1,2-Hexanediol" or a number
// like "0.5%". Strips concentrations ("Avobenzone 3%") and footnote marks ("Aloe*").

const HEADINGS =
  /\b(active ingredients?|inactive ingredients?|other ingredients?|ingredients?|ingr[eé]dients?|ingredientes|inhaltsstoffe|composition|inci|contains|may contain|peut contenir|puede contener|pode conter)\s*:/gi

export function splitLabel(raw: string): string[] {
  let text = raw
    // Invisible characters copied from websites (zero-width spaces, BOM) split names wrongly.
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/\r/g, "\n")
    // "[+/- CI 77891]" and "+/-:" introduce colourants that may be present: keep them as ingredients.
    .replace(/\[\s*\+\/-\s*:?/g, ",")
    .replace(/\+\/-\s*:?/g, ",")
    .replace(/[\[\]]/g, ",")
    .replace(HEADINGS, ",")
  // Full stop between ingredients ("Salicylic Acid 2%. Water", "Pentylene Glycol. 1,2-Hexanediol"),
  // but not inside numbers ("0.5%") or after abbreviations ("Flower Ext. Water", "Red No. 40").
  text = text.replace(/(?<!\b(?:ext|extr|no|nr|vit|sp|spp|var|approx|min|max))\.(?=\s+\S)/gi, ",")
  return (
    splitTopLevel(text)
      // A piece starting with a footnote mark is the legend ("*organic"), not an ingredient.
      .filter((s) => !/^\s*[*°†‡¹²³]/.test(s))
      .map((s) =>
        s
          // Concentrations: "3%", "(3%)", "2.0 %", "0,5%", "w/w".
          .replace(/\(?\s*\d+(?:[.,]\d+)?\s*%\s*(?:w\/w|w\/v)?\s*\)?/gi, " ")
          // Footnote marks: "Aloe*", "Rosehip Oil**", "Shea Butter°".
          .replace(/[*°†‡¹²³]+/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/^[.\-–—:]+|[.\-–—:]+$/g, "")
          .trim(),
      )
      .filter((s) => s.length > 0 && /[\p{L}\d]/u.test(s))
  )
}

/**
 * Splits on separators outside parentheses only, so "Iron Oxides (CI 77491, CI 77492)" stays one
 * entry. An unclosed "(" never swallows the rest of the label: its piece is split normally.
 */
function splitTopLevel(text: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = 0
  let openedAt = -1
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === "(") {
      if (depth === 0) openedAt = i
      depth++
    } else if (ch === ")" && depth > 0) {
      depth--
    } else if (depth === 0 && isSeparatorAt(text, i)) {
      out.push(text.slice(start, i))
      start = i + 1
    }
    if (depth > 0 && i === text.length - 1) {
      // Unbalanced: re-split from the unclosed bracket as if it weren't there.
      out.push(...splitTopLevel(text.slice(start, openedAt) + " " + text.slice(openedAt + 1)))
      return out
    }
  }
  out.push(text.slice(start))
  return out
}

/** Separators; a comma between two digits belongs to a chemical name (1,2-Hexanediol). */
function isSeparatorAt(text: string, i: number): boolean {
  const ch = text[i]
  if (ch === ",") return !(/\d/.test(text[i - 1] ?? "") && /\d/.test(text[i + 1] ?? ""))
  return /[;\n•·|،؛]/.test(ch)
}

/**
 * Reading direction of a label as printed: right-to-left when most of its ingredient names are in
 * Arabic or Hebrew script, else left-to-right (INCI names are Latin even in RTL apps).
 */
export function labelDirection(names: string[]): "rtl" | "ltr" {
  const rtl = names.filter((n) => /[֐-ࣿ]/.test(n)).length
  return rtl > names.length / 2 ? "rtl" : "ltr"
}
