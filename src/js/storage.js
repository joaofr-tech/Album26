import { createEmptyCollection, migrateLegacyCollection, STORAGE_KEY, validateCollectionShape } from "./collection.js";

export function loadCollection(albumIndex) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyCollection(albumIndex.album.id);
    const parsed = JSON.parse(raw);
    if (validateCollectionShape(parsed, albumIndex).ok) return parsed;
    const migrated = migrateLegacyCollection(parsed, albumIndex);
    if (migrated) {
      saveCollection(migrated);
      return migrated;
    }
  } catch {
    // Start clean if local data cannot be read.
  }
  return createEmptyCollection(albumIndex.album.id);
}

export function saveCollection(collection) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}
