import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { applyParsedCommands, createEmptyCollection } from "../src/js/collection.js";
import { matchNeededStickers, parseChecklistInput, formatNeededStickersResult } from "../src/js/match-list.js";
import { buildAlbumIndex, parseStickerCommands } from "../src/js/parser.js";
import { expectedIdsFromGroups, sharedListCase1, sharedListCase1Expected, sharedListCase2, sharedListCase2Expected } from "./fixtures.mjs";

const album = JSON.parse(await readFile(new URL("../src/data/album.json", import.meta.url), "utf8"));
const albumIndex = buildAlbumIndex(album);
const brazilFlag = "\u{1F1E7}\u{1F1F7}";

function parsedIds(input) {
  return parseChecklistInput(input, albumIndex).items.map((item) => item.sticker.id);
}

function register(collection, input) {
  return applyParsedCommands(collection, parseStickerCommands(input, albumIndex)).collection;
}

function groupNumbers(result, sectionId) {
  return result.groups.find((group) => group.section.id === sectionId)?.numbers || [];
}

test("conferencia: aceita nome da selecao com numeros por virgula e espaco", () => {
  assert.deepEqual(parsedIds("Brasil 12, 14 15"), ["brasil-12", "brasil-14", "brasil-15"]);
});

test("conferencia: aceita abreviacao e ignora bandeira", () => {
  assert.deepEqual(parsedIds(`BRA ${brazilFlag} 12, 14, 15`), ["brasil-12", "brasil-14", "brasil-15"]);
});

test("conferencia: aceita Coca-Cola por nome e por CC", () => {
  assert.deepEqual(parsedIds("Coca-Cola 1 2\nCC 3, 4"), ["coca-cola-1", "coca-cola-2", "coca-cola-3", "coca-cola-4"]);
});

test("conferencia: aceita FWC como secao propria", () => {
  assert.deepEqual(parsedIds("FWC 1, 2"), ["fwc-1", "fwc-2"]);
});

test("conferencia: FWC vai de 0 a 19", () => {
  const parsed = parseChecklistInput("FWC 0 19 20", albumIndex);

  assert.deepEqual(parsed.items.map((item) => item.sticker.id), ["fwc-0", "fwc-19"]);
  assert.equal(parsed.warnings[0].status, "missing-sticker");
  assert.equal(parsed.warnings[0].number, 20);
});
test("conferencia: usa MOR e MAR para Marrocos", () => {
  assert.deepEqual(parsedIds("MOR 8"), ["marrocos-8"]);
  assert.deepEqual(parsedIds("MAR 19"), ["marrocos-19"]);
  assert.deepEqual(parsedIds("MAR19"), ["marrocos-19"]);
});

test("conferencia: parseia o caso 1 completo de tokens colados", () => {
  const parsed = parseChecklistInput(sharedListCase1, albumIndex);

  assert.deepEqual(parsed.items.map((item) => item.sticker.id), expectedIdsFromGroups(sharedListCase1Expected));
  assert.deepEqual(parsed.warnings, []);
});

test("conferencia: parseia o caso 2 completo com dois-pontos", () => {
  const parsed = parseChecklistInput(sharedListCase2, albumIndex);

  assert.deepEqual(parsed.items.map((item) => item.sticker.id), expectedIdsFromGroups(sharedListCase2Expected));
  assert.deepEqual(parsed.warnings, []);
});
test("conferencia: retorna apenas figurinhas da lista que ainda faltam", () => {
  const collection = register(createEmptyCollection(album.id), "Brasil 12");
  const result = matchNeededStickers(albumIndex, collection, "BRA 12, 14");

  assert.equal(result.total, 1);
  assert.deepEqual(groupNumbers(result, "brasil"), [14]);
});

test("conferencia: agrupa faltantes de multiplas linhas por secao", () => {
  const collection = register(createEmptyCollection(album.id), "Brasil 12, Coca-Cola 1");
  const result = matchNeededStickers(albumIndex, collection, `BRA ${brazilFlag} 12, 14\nCC 1 2\nFWC 1`);

  assert.equal(result.total, 3);
  assert.deepEqual(groupNumbers(result, "brasil"), [14]);
  assert.deepEqual(groupNumbers(result, "coca-cola"), [2]);
  assert.deepEqual(groupNumbers(result, "fwc"), [1]);
});

test("conferencia: avisa secao desconhecida e preserva linhas validas", () => {
  const result = parseChecklistInput("XYZ 1\nBrasil 2", albumIndex);

  assert.deepEqual(result.items.map((item) => item.sticker.id), ["brasil-2"]);
  assert.equal(result.warnings[0].status, "unknown-section");
});

test("conferencia: avisa figurinha inexistente", () => {
  const result = parseChecklistInput("CC 99", albumIndex);

  assert.equal(result.items.length, 0);
  assert.equal(result.warnings[0].status, "missing-sticker");
  assert.equal(result.warnings[0].number, 99);
});

test("conferencia: informa quando nenhuma figurinha da lista e necessaria", () => {
  const collection = register(createEmptyCollection(album.id), "Brasil 12");
  const result = matchNeededStickers(albumIndex, collection, "BRA 12");
  const message = formatNeededStickersResult(result);

  assert.equal(result.total, 0);
  assert.equal(result.groups.length, 0);
  assert.equal(message.includes("Nenhuma figurinha necessaria"), true);
});

test("conferencia: nao altera a colecao", () => {
  const collection = register(createEmptyCollection(album.id), "Brasil 12");
  const before = structuredClone(collection);

  matchNeededStickers(albumIndex, collection, "BRA 12, 14");

  assert.deepEqual(collection, before);
});
