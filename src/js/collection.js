export const COLLECTION_VERSION = 1;
export const STORAGE_KEY = "sticker-album-collection-v1";

export function createEmptyCollection(albumId) {
  return {
    version: COLLECTION_VERSION,
    albumId,
    quantities: {},
    updatedAt: new Date().toISOString()
  };
}

export function quantityOf(collection, stickerId) {
  return Math.max(0, Number(collection.quantities[stickerId] || 0));
}

export function setQuantity(collection, stickerId, quantity) {
  const nextQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
  const quantities = { ...collection.quantities };

  if (nextQuantity === 0) {
    delete quantities[stickerId];
  } else {
    quantities[stickerId] = nextQuantity;
  }

  return {
    ...collection,
    quantities,
    updatedAt: new Date().toISOString()
  };
}

export function applyParsedCommands(collection, parsedCommands) {
  let next = collection;
  const changes = [];
  const results = [];

  for (const command of parsedCommands) {
    if (command.status !== "valid") {
      results.push(command);
      continue;
    }

    const previousQuantity = quantityOf(next, command.sticker.id);
    const newQuantity = previousQuantity + 1;
    next = setQuantity(next, command.sticker.id, newQuantity);
    changes.push({ stickerId: command.sticker.id, previousQuantity, newQuantity });
    results.push({
      ...command,
      status: previousQuantity > 0 ? "duplicate-added" : "added",
      previousQuantity,
      newQuantity,
      message:
        previousQuantity > 0
          ? `${command.section.name} ${command.number} agora possui ${newQuantity} unidades`
          : `${command.section.name} ${command.number} adicionada`
    });
  }

  const operation =
    changes.length > 0
      ? {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          createdAt: new Date().toISOString(),
          changes
        }
      : null;

  return { collection: next, operation, results };
}

export function undoOperation(collection, operation) {
  if (!operation) {
    return collection;
  }

  return operation.changes.reduce(
    (current, change) => setQuantity(current, change.stickerId, change.previousQuantity),
    collection
  );
}

export function allStickerRows(albumIndex, collection) {
  return albumIndex.album.sections.flatMap((section) =>
    section.stickers.map((sticker) => {
      const quantity = quantityOf(collection, sticker.id);
      return {
        sticker,
        section,
        quantity,
        duplicates: Math.max(quantity - 1, 0)
      };
    })
  );
}

export function progressForAlbum(albumIndex, collection) {
  const rows = allStickerRows(albumIndex, collection);
  const owned = rows.filter((row) => row.quantity > 0).length;
  const duplicates = rows.reduce((total, row) => total + row.duplicates, 0);
  const total = rows.length;

  return {
    owned,
    total,
    percent: total === 0 ? 0 : (owned / total) * 100,
    duplicates
  };
}

export function progressBySection(albumIndex, collection) {
  return albumIndex.album.sections.map((section) => {
    const rows = section.stickers.map((sticker) => quantityOf(collection, sticker.id));
    const owned = rows.filter((quantity) => quantity > 0).length;
    const total = rows.length;

    return {
      section,
      owned,
      total,
      percent: total === 0 ? 0 : (owned / total) * 100
    };
  });
}

export function validateCollectionShape(value, albumIndex) {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Arquivo sem objeto de dados." };
  }

  if (value.version !== COLLECTION_VERSION) {
    return { ok: false, error: "Versao de backup incompativel." };
  }

  if (value.albumId !== albumIndex.album.id) {
    return { ok: false, error: "Backup pertence a outro album." };
  }

  if (!value.quantities || typeof value.quantities !== "object" || Array.isArray(value.quantities)) {
    return { ok: false, error: "Quantidades ausentes ou invalidas." };
  }

  for (const [stickerId, quantity] of Object.entries(value.quantities)) {
    if (!albumIndex.stickersById.has(stickerId)) {
      return { ok: false, error: `Figurinha desconhecida no backup: ${stickerId}.` };
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return { ok: false, error: `Quantidade invalida para ${stickerId}.` };
    }
  }

  return { ok: true };
}
