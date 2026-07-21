import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createBackup, backupToCollection, validateBackup } from "../src/js/backup.js";
import {
  applyParsedCommands,
  createEmptyCollection,
  progressForAlbum,
  quantityOf,
  undoOperation
} from "../src/js/collection.js";
import { buildAlbumIndex, parseStickerCommands } from "../src/js/parser.js";

const album = JSON.parse(await readFile(new URL("../src/data/album.json", import.meta.url), "utf8"));
const albumIndex = buildAlbumIndex(album);

function register(collection, input) {
  return applyParsedCommands(collection, parseStickerCommands(input, albumIndex));
}

test("registra uma figurinha em colecao vazia", () => {
  const state = createEmptyCollection(album.id);
  const result = register(state, "Brasil 12");

  assert.equal(quantityOf(result.collection, "brasil-12"), 1);
  assert.equal(result.results[0].status, "added");
});

test("registra repetida ao adicionar a mesma figurinha novamente", () => {
  let state = createEmptyCollection(album.id);
  state = register(state, "Brasil 12").collection;
  const result = register(state, "Brasil 12");

  assert.equal(quantityOf(result.collection, "brasil-12"), 2);
  assert.equal(result.results[0].status, "duplicate-added");
  assert.equal(progressForAlbum(albumIndex, result.collection).duplicates, 1);
});

test("processa lote com secoes explicitas", () => {
  const result = register(createEmptyCollection(album.id), "Brasil 12, Argentina 8, Franca 20");

  assert.equal(quantityOf(result.collection, "brasil-12"), 1);
  assert.equal(quantityOf(result.collection, "argentina-8"), 1);
  assert.equal(quantityOf(result.collection, "franca-20"), 1);
});

test("processa continuidade de secao", () => {
  const result = register(createEmptyCollection(album.id), "Brasil 12, 15 e 18");

  assert.equal(quantityOf(result.collection, "brasil-12"), 1);
  assert.equal(quantityOf(result.collection, "brasil-15"), 1);
  assert.equal(quantityOf(result.collection, "brasil-18"), 1);
});

test("converte numeros por extenso sem confundir vinte e um com separador", () => {
  const parsed = parseStickerCommands("figurinha numero doze do Brasil", albumIndex);
  const parsedTwenty = parseStickerCommands("Brasil vinte", albumIndex);

  assert.equal(parsed[0].status, "valid");
  assert.equal(parsed[0].sticker.id, "brasil-12");
  assert.equal(parsedTwenty[0].status, "valid");
  assert.equal(parsedTwenty[0].sticker.id, "brasil-20");
});

test("salva parte valida de lote parcialmente invalido", () => {
  const result = register(createEmptyCollection(album.id), "Brasil 12, Argentina 999, Franca 8");

  assert.equal(quantityOf(result.collection, "brasil-12"), 1);
  assert.equal(quantityOf(result.collection, "franca-8"), 1);
  assert.equal(result.results[1].status, "missing-sticker");
});

test("desfaz a ultima operacao completa", () => {
  const result = register(createEmptyCollection(album.id), "Brasil 12, Argentina 8");
  const undone = undoOperation(result.collection, result.operation);

  assert.equal(quantityOf(undone, "brasil-12"), 0);
  assert.equal(quantityOf(undone, "argentina-8"), 0);
});

test("backup valido restaura estado identico", () => {
  const result = register(createEmptyCollection(album.id), "Brasil 12, Argentina 8, Argentina 8");
  const backup = createBackup(result.collection);
  const validation = validateBackup(backup, albumIndex);
  const restored = backupToCollection(backup);

  assert.equal(validation.ok, true);
  assert.deepEqual(restored.quantities, result.collection.quantities);
});

test("backup invalido nao passa validacao", () => {
  const validation = validateBackup(
    {
      version: 1,
      albumId: album.id,
      stickers: {
        "brasil-12": 1,
        "brasil-999": 1
      }
    },
    albumIndex
  );

  assert.equal(validation.ok, false);
});


test("carrega o catalogo completo da FIFA World Cup 26", () => {
  assert.equal(album.id, "fifa-world-cup-26");
  assert.equal(albumIndex.album.sections.length, 51);
  assert.equal(albumIndex.totalStickers, 994);
  assert.deepEqual(
    parseStickerCommands("Brasil 20, Coca-Cola 14, Especiais 19", albumIndex).map((item) => item.sticker?.id),
    ["brasil-20", "coca-cola-14", "especiais-19"]
  );
});
