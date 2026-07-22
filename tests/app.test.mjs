import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { applyParsedCommands, createEmptyCollection, isOwned, migrateLegacyCollection, progressForAlbum, toggleOwned } from "../src/js/collection.js";
import { buildAlbumIndex, parseStickerCommands } from "../src/js/parser.js";

const album = JSON.parse(await readFile(new URL("../src/data/album.json", import.meta.url), "utf8"));
const albumIndex = buildAlbumIndex(album);
const register = (collection, input) => applyParsedCommands(collection, parseStickerCommands(input, albumIndex));

test("registra uma figurinha como possuida", () => {
  const result = register(createEmptyCollection(album.id), "Brasil 12");
  assert.equal(isOwned(result.collection, "brasil-12"), true);
  assert.equal(result.results[0].status, "added");
});

test("nao registra repetidas", () => {
  const first = register(createEmptyCollection(album.id), "Brasil 12");
  const second = register(first.collection, "Brasil 12");
  assert.equal(second.changed, false);
  assert.equal(second.results[0].status, "already-owned");
});

test("processa lote e continuidade de secao", () => {
  const result = register(createEmptyCollection(album.id), "Brasil 12, 15 e 18, Argentina 8");
  for (const id of ["brasil-12", "brasil-15", "brasil-18", "argentina-8"]) assert.equal(isOwned(result.collection, id), true);
});

test("interpreta 10h12 como dois numeros da mesma selecao", () => {
  const result = register(createEmptyCollection(album.id), "Canada 10h12");
  assert.equal(isOwned(result.collection, "canada-10"), true);
  assert.equal(isOwned(result.collection, "canada-12"), true);
});

test("nao trata dois-pontos como separador", () => {
  const parsed = parseStickerCommands("Canada 10:12", albumIndex);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].status, "missing-number");
});

test("converte numero por extenso", () => {
  const result = register(createEmptyCollection(album.id), "figurinha numero doze do Brasil");
  assert.equal(isOwned(result.collection, "brasil-12"), true);
});

test("mantem itens validos em lote parcialmente invalido", () => {
  const result = register(createEmptyCollection(album.id), "Brasil 12, Argentina 999, Franca 8");
  assert.equal(isOwned(result.collection, "brasil-12"), true);
  assert.equal(isOwned(result.collection, "franca-8"), true);
  assert.equal(result.results[1].status, "missing-sticker");
});

test("nao transforma secao desconhecida em continuidade", () => {
  const parsed = parseStickerCommands("Brasil 12, Brasul 13", albumIndex);
  assert.equal(parsed[1].status, "unknown-section");
});

test("permite corrigir o estado tocando na figurinha", () => {
  const initial = register(createEmptyCollection(album.id), "Brasil 12").collection;
  assert.equal(isOwned(toggleOwned(initial, "brasil-12"), "brasil-12"), false);
});

test("calcula o progresso sem repetidas", () => {
  const collection = register(createEmptyCollection(album.id), "Brasil 12, Brasil 15").collection;
  const progress = progressForAlbum(albumIndex, collection);
  assert.equal(progress.owned, 2);
  assert.equal(progress.total, 994);
  assert.equal("duplicates" in progress, false);
});

test("migra quantidades antigas para figurinhas possuidas", () => {
  const migrated = migrateLegacyCollection({ version: 1, albumId: album.id, quantities: { "brasil-12": 3, "argentina-8": 1 } }, albumIndex);
  assert.deepEqual(migrated.ownedStickerIds.sort(), ["argentina-8", "brasil-12"]);
});
