import { COLLECTION_VERSION, validateCollectionShape } from "./collection.js";

export function createBackup(collection) {
  return {
    version: COLLECTION_VERSION,
    albumId: collection.albumId,
    exportedAt: new Date().toISOString(),
    stickers: { ...collection.quantities }
  };
}

export function backupFileName(date = new Date()) {
  return `backup-figurinhas-${date.toISOString().slice(0, 10)}.json`;
}

export function backupToCollection(backup) {
  return {
    version: backup.version,
    albumId: backup.albumId,
    quantities: { ...backup.stickers },
    updatedAt: new Date().toISOString()
  };
}

export function validateBackup(backup, albumIndex) {
  if (!backup || typeof backup !== "object") {
    return { ok: false, error: "Arquivo de backup malformado." };
  }

  const collectionLike = {
    version: backup.version,
    albumId: backup.albumId,
    quantities: backup.stickers
  };

  return validateCollectionShape(collectionLike, albumIndex);
}

export function downloadJson(data, fileName) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
