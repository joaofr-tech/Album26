import { allStickerRows } from "./collection.js";

export function stickerGroupsByOwnership(albumIndex, collection, owned) {
  const groupsBySection = new Map();

  for (const row of allStickerRows(albumIndex, collection)) {
    if (row.owned !== owned) continue;
    if (!groupsBySection.has(row.section.id)) groupsBySection.set(row.section.id, { section: row.section, numbers: [] });
    groupsBySection.get(row.section.id).numbers.push(row.sticker.number);
  }

  return [...groupsBySection.values()];
}

export function missingStickerGroups(albumIndex, collection) {
  return stickerGroupsByOwnership(albumIndex, collection, false);
}

export function ownedStickerGroups(albumIndex, collection) {
  return stickerGroupsByOwnership(albumIndex, collection, true);
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

export function formatExplicitNumbers(numbers) {
  return [...numbers].sort((left, right) => left - right).join(", ");
}

export function sectionExportCode(section) {
  if (section.exportCode) return section.exportCode;
  if (section.id === "coca-cola") return "COCA-COLA";

  const aliases = [section.name, section.id, ...(section.aliases || [])];
  const preferred = aliases.find((alias) => /^[A-Z0-9]{2,4}$/.test(alias));
  if (preferred) return preferred;

  return section.id.toUpperCase();
}

export function formatStickerGroupsMessage(groups, emptyMessage) {
  if (groups.length === 0) return emptyMessage;
  return groups.map((group) => `${sectionExportCode(group.section)} : ${formatExplicitNumbers(group.numbers)}`).join("\n");
}

export function formatMissingStickersMessage(albumIndex, collection) {
  return formatStickerGroupsMessage(missingStickerGroups(albumIndex, collection), `Album completo - ${albumIndex.album.name}`);
}

export function formatOwnedStickersMessage(albumIndex, collection) {
  return formatStickerGroupsMessage(ownedStickerGroups(albumIndex, collection), `Nenhuma figurinha possuida - ${albumIndex.album.name}`);
}

export function buildWhatsAppShareUrl(message) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function stickerShare(groups, message) {
  return {
    groups,
    total: groups.reduce((sum, group) => sum + group.numbers.length, 0),
    message,
    url: buildWhatsAppShareUrl(message)
  };
}

export function missingStickersShare(albumIndex, collection) {
  const groups = missingStickerGroups(albumIndex, collection);
  return stickerShare(groups, formatStickerGroupsMessage(groups, `Album completo - ${albumIndex.album.name}`));
}

export function ownedStickersShare(albumIndex, collection) {
  const groups = ownedStickerGroups(albumIndex, collection);
  return stickerShare(groups, formatStickerGroupsMessage(groups, `Nenhuma figurinha possuida - ${albumIndex.album.name}`));
}

function formatRange(start, end) {
  return start === end ? String(start) : `${start}-${end}`;
}