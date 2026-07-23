import { isOwned } from "./collection.js";
import { formatNumberRanges } from "./export.js";
import { stripAccents } from "./parser.js";

function normalizeChecklistLine(line) {
  return stripAccents(line)
    .toLowerCase()
    .replace(/[^a-z0-9,\s-]+/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findSectionAtStart(tokens, albumIndex) {
  for (const candidate of albumIndex.sectionAliases) {
    if (candidate.tokens.length === 0 || candidate.tokens.length > tokens.length) continue;

    const direct = candidate.tokens.every((token, index) => tokens[index] === token);
    if (direct) return { section: candidate.section, length: candidate.tokens.length };

    if (candidate.tokens.length > 1 && tokens[0] === candidate.compact) return { section: candidate.section, length: 1 };
  }

  return null;
}

function parseNumbers(text) {
  return text.split(/[\s,]+/).filter(Boolean).filter((token) => /^\d+$/.test(token)).map((token) => Number(token));
}

export function parseChecklistInput(input, albumIndex) {
  const items = [];
  const warnings = [];
  const lines = String(input).split(/\r?\n/);

  for (const rawLine of lines) {
    const line = normalizeChecklistLine(rawLine);
    if (!line) continue;

    const tokens = line.split(/\s+/).filter(Boolean);
    const sectionMatch = findSectionAtStart(tokens, albumIndex);
    if (!sectionMatch) {
      warnings.push({ status: "unknown-section", raw: rawLine, message: `Nao foi possivel identificar a secao em "${rawLine.trim()}".` });
      continue;
    }

    const numberText = tokens.slice(sectionMatch.length).join(" ");
    const numbers = parseNumbers(numberText);
    if (numbers.length === 0) {
      warnings.push({ status: "missing-number", raw: rawLine, section: sectionMatch.section, message: `Nenhum numero foi identificado em "${rawLine.trim()}".` });
      continue;
    }

    for (const number of numbers) {
      const sticker = albumIndex.stickersBySectionAndNumber.get(`${sectionMatch.section.id}:${number}`);
      if (!sticker) {
        warnings.push({
          status: "missing-sticker",
          raw: rawLine,
          section: sectionMatch.section,
          number,
          message: `${sectionMatch.section.name} ${number} nao existe neste album.`
        });
        continue;
      }

      items.push({ section: sectionMatch.section, number, sticker, raw: rawLine });
    }
  }

  return { items, warnings };
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
