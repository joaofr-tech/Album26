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

export function formatMissingStickersMessage(albumIndex, collection) {
  const groups = missingStickerGroups(albumIndex, collection);
  const total = groups.reduce((sum, group) => sum + group.numbers.length, 0);

  if (total === 0) return `Album completo - ${albumIndex.album.name}`;

  return [
    `Figurinhas faltantes - ${albumIndex.album.name}`,
    "",
    ...groups.map((group) => `${group.section.name}: ${group.numbers.join(", ")}`),
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