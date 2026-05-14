/**
 * Naive compatibility check between transport type and waste type.
 *
 * Logic is heuristic — looks for keywords in transport.type/name and waste_type.name.
 * Not blocking: if incompatible, UI shows a yellow warning, but operator can still save.
 *
 * Replace this with a real mapping table later when policy is finalised.
 */

const RU_KG_KEYWORDS = {
  // Transport categories
  tanker: ["ассенизатор", "ассенизаторская", "вакуум", "цистерна"],
  truck: ["мусоровоз", "самосвал", "грузовик", "грузовая"],
  tractor: ["трактор", "бульдозер", "погрузчик"],
  porter: ["портер", "porter"],

  // Waste categories
  liquid: ["суюк", "жидк", "канализаци", "септик", "ассенизац"],
  solid: ["катуу", "твёрд", "тиричилик", "бытов", "тбо"],
  construction: ["курулуш", "строит", "стройм"],
};

function matchesAny(text: string, keywords: string[]): boolean {
  const t = text.toLowerCase();
  return keywords.some((kw) => t.includes(kw));
}

export type TransportClass = "tanker" | "truck" | "tractor" | "porter" | "unknown";
export type WasteClass = "liquid" | "solid" | "construction" | "unknown";

export function classifyTransport(transport: { type?: string | null; name?: string | null }): TransportClass {
  const blob = `${transport.type || ""} ${transport.name || ""}`.toLowerCase();
  if (matchesAny(blob, RU_KG_KEYWORDS.tanker)) return "tanker";
  if (matchesAny(blob, RU_KG_KEYWORDS.tractor)) return "tractor";
  if (matchesAny(blob, RU_KG_KEYWORDS.porter)) return "porter";
  if (matchesAny(blob, RU_KG_KEYWORDS.truck)) return "truck";
  return "unknown";
}

export function classifyWaste(wasteType: { name?: string | null }): WasteClass {
  const t = (wasteType.name || "").toLowerCase();
  if (matchesAny(t, RU_KG_KEYWORDS.liquid)) return "liquid";
  if (matchesAny(t, RU_KG_KEYWORDS.construction)) return "construction";
  if (matchesAny(t, RU_KG_KEYWORDS.solid)) return "solid";
  return "unknown";
}

/**
 * Returns a warning message if transport / waste combo looks wrong.
 * Returns null if compatible (or one side unknown — don't warn on uncertainty).
 */
export function getCompatibilityWarning(
  transport: { type?: string | null; name?: string | null } | null,
  wasteType: { name?: string | null } | null
): string | null {
  if (!transport || !wasteType) return null;
  const tc = classifyTransport(transport);
  const wc = classifyWaste(wasteType);
  if (tc === "unknown" || wc === "unknown") return null;

  // Tanker only for liquid
  if (tc === "tanker" && wc !== "liquid") {
    return "Ассенизатор обычно используется для жидких отходов";
  }
  // Liquid waste only by tanker
  if (wc === "liquid" && tc !== "tanker") {
    return "Жидкие отходы обычно вывозит ассенизатор";
  }
  // Tractor — heavy/construction
  if (tc === "tractor" && wc === "solid") {
    return "Трактор обычно для крупного или строительного мусора";
  }
  // Porter — light loads, not construction
  if (tc === "porter" && wc === "construction") {
    return "Портер не подходит для строительного мусора — нужен мусоровоз или трактор";
  }
  return null;
}
