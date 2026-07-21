import { createEmptyCollection, STORAGE_KEY, validateCollectionShape } from "./collection.js";

export function loadCollection(albumIndex) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyCollection(albumIndex.album.id);
    }

    const parsed = JSON.parse(raw);
    const validation = validateCollectionShape(parsed, albumIndex);
    if (!validation.ok) {
      return createEmptyCollection(albumIndex.album.id);
    }

    return parsed;
  } catch {
    return createEmptyCollection(albumIndex.album.id);
  }
}

export function saveCollection(collection) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

export function clearCollection() {
  localStorage.removeItem(STORAGE_KEY);
}
