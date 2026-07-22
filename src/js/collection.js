export const COLLECTION_VERSION = 2;
export const STORAGE_KEY = "sticker-album-collection-v1";

export function createEmptyCollection(albumId) {
  return { version: COLLECTION_VERSION, albumId, ownedStickerIds: [], updatedAt: new Date().toISOString() };
}

export function isOwned(collection, stickerId) {
  return collection.ownedStickerIds.includes(stickerId);
}

export function setOwned(collection, stickerId, owned) {
  const next = new Set(collection.ownedStickerIds);
  if (owned) next.add(stickerId);
  else next.delete(stickerId);
  return { ...collection, ownedStickerIds: [...next], updatedAt: new Date().toISOString() };
}

export function toggleOwned(collection, stickerId) {
  return setOwned(collection, stickerId, !isOwned(collection, stickerId));
}

export function applyParsedCommands(collection, parsedCommands) {
  let next = collection;
  let changed = false;
  const results = [];
  for (const command of parsedCommands) {
    if (command.status !== "valid") {
      results.push(command);
    } else if (isOwned(next, command.sticker.id)) {
      results.push({ ...command, status: "already-owned", message: command.section.name + " " + command.number + " ja esta registrada" });
    } else {
      next = setOwned(next, command.sticker.id, true);
      changed = true;
      results.push({ ...command, status: "added", message: command.section.name + " " + command.number + " adicionada" });
    }
  }
  return { collection: next, changed, results };
}

export function allStickerRows(albumIndex, collection) {
  return albumIndex.album.sections.flatMap((section) => section.stickers.map((sticker) => ({ sticker, section, owned: isOwned(collection, sticker.id) })));
}

export function progressForAlbum(albumIndex, collection) {
  const rows = allStickerRows(albumIndex, collection);
  const owned = rows.filter((row) => row.owned).length;
  return { owned, total: rows.length, percent: rows.length === 0 ? 0 : (owned / rows.length) * 100 };
}

export function progressBySection(albumIndex, collection) {
  return albumIndex.album.sections.map((section) => {
    const owned = section.stickers.filter((sticker) => isOwned(collection, sticker.id)).length;
    const total = section.stickers.length;
    return { section, owned, total, percent: total === 0 ? 0 : (owned / total) * 100 };
  });
}

export function validateCollectionShape(value, albumIndex) {
  if (!value || typeof value !== "object") return { ok: false, error: "Colecao invalida." };
  if (value.version !== COLLECTION_VERSION || value.albumId !== albumIndex.album.id) return { ok: false, error: "Colecao incompativel." };
  if (!Array.isArray(value.ownedStickerIds)) return { ok: false, error: "Figurinhas possuidas invalidas." };
  if (new Set(value.ownedStickerIds).size !== value.ownedStickerIds.length) return { ok: false, error: "Figurinhas possuidas duplicadas." };
  if (!value.ownedStickerIds.every((id) => typeof id === "string" && albumIndex.stickersById.has(id))) return { ok: false, error: "Figurinha desconhecida." };
  return { ok: true };
}

export function migrateLegacyCollection(value, albumIndex) {
  if (!value || value.version !== 1 || value.albumId !== albumIndex.album.id || !value.quantities) return null;
  const ownedStickerIds = Object.entries(value.quantities)
    .filter(([id, quantity]) => albumIndex.stickersById.has(id) && Number(quantity) > 0)
    .map(([id]) => id);
  return { version: COLLECTION_VERSION, albumId: albumIndex.album.id, ownedStickerIds, updatedAt: new Date().toISOString() };
}
