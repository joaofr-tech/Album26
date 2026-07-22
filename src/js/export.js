import { allStickerRows } from "./collection.js";

export function missingStickerGroups(albumIndex, collection) {
  const groupsBySection = new Map();

  for (const row of allStickerRows(albumIndex, collection)) {
    if (row.owned) continue;
    if (!groupsBySection.has(row.section.id)) groupsBySection.set(row.section.id, { section: row.section, numbers: [] });
    groupsBySection.get(row.section.id).numbers.push(row.sticker.number);
  }

  return [...groupsBySection.values()];
}

export function formatNumberRanges(numbers) {
  const sorted = [...numbers].sort((left, right) => left - right);
  const ranges = [];
  let start = null;
  let previous = null;

  for (const number of sorted) {
    if (start === null) {
      start = number;
      previous = number;
    } else if (number === previous + 1) {
      previous = number;
    } else {
      ranges.push(formatRange(start, previous));
      start = number;
      previous = number;
    }
  }

  if (start !== null) ranges.push(formatRange(start, previous));
  return ranges.join(", ");
}

export function formatMissingStickersMessage(albumIndex, collection) {
  const groups = missingStickerGroups(albumIndex, collection);
  const total = groups.reduce((sum, group) => sum + group.numbers.length, 0);

  if (total === 0) return `Album completo - ${albumIndex.album.name}`;

  return [
    `Figurinhas faltantes - ${albumIndex.album.name}`,
    "",
    ...groups.map((group) => `${group.section.name}: ${formatNumberRanges(group.numbers)}`),
    "",
    `Total: ${total} faltantes`
  ].join("\n");
}

export function buildWhatsAppShareUrl(message) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function missingStickersShare(albumIndex, collection) {
  const groups = missingStickerGroups(albumIndex, collection);
  const total = groups.reduce((sum, group) => sum + group.numbers.length, 0);
  const message = formatMissingStickersMessage(albumIndex, collection);

  return {
    groups,
    total,
    message,
    url: buildWhatsAppShareUrl(message)
  };
}

function formatRange(start, end) {
  return start === end ? String(start) : `${start}-${end}`;
}
