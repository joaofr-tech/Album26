import { isOwned } from "./collection.js";
import { formatNumberRanges } from "./export.js";
import { parseStructuredStickerList } from "./structured-list.js";

export function parseChecklistInput(input, albumIndex) {
  return parseStructuredStickerList(input, albumIndex);
}

export function matchNeededStickers(albumIndex, collection, input) {
  const parsed = parseChecklistInput(input, albumIndex);
  const groupsBySection = new Map();
  const seen = new Set();

  for (const item of parsed.items) {
    if (isOwned(collection, item.sticker.id) || seen.has(item.sticker.id)) continue;
    seen.add(item.sticker.id);

    if (!groupsBySection.has(item.section.id)) groupsBySection.set(item.section.id, { section: item.section, numbers: [] });
    groupsBySection.get(item.section.id).numbers.push(item.number);
  }

  const groups = [...groupsBySection.values()].map((group) => ({
    ...group,
    numbers: [...group.numbers].sort((left, right) => left - right)
  }));
  const total = groups.reduce((sum, group) => sum + group.numbers.length, 0);

  return { groups, total, warnings: parsed.warnings };
}

export function formatNeededStickersResult(result) {
  const lines = result.total === 0
    ? ["Nenhuma figurinha necessaria desta lista."]
    : ["Figurinhas da lista que faltam:", "", ...result.groups.map((group) => `${group.section.name}: ${formatNumberRanges(group.numbers)}`)];

  if (result.warnings.length > 0) {
    lines.push("", "Avisos:", ...result.warnings.map((warning) => warning.message));
  }

  return lines.join("\n");
}

export function neededStickersResultRows(result) {
  const rows = [];

  if (result.total === 0) {
    rows.push({ status: "manual", message: "Nenhuma figurinha necessaria desta lista." });
  } else {
    rows.push({ status: "manual", message: `${result.total} figurinhas desta lista ainda faltam.` });
    for (const group of result.groups) {
      rows.push({ status: "manual", message: `${group.section.name}: ${formatNumberRanges(group.numbers)}` });
    }
  }

  for (const warning of result.warnings) rows.push({ status: "error", message: warning.message });
  return rows;
}