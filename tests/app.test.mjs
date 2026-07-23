import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { applyParsedCommands, createEmptyCollection, isOwned, migrateLegacyCollection, progressForAlbum, toggleOwned } from "../src/js/collection.js";
import { buildWhatsAppShareUrl, formatMissingStickersMessage, formatNumberRanges, missingStickerGroups, missingStickersShare } from "../src/js/export.js";
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

test("ignora h residual depois de um numero ditado", () => {
  const result = register(createEmptyCollection(album.id), "Canada 8, 12h e 16");
  assert.equal(isOwned(result.collection, "canada-8"), true);
  assert.equal(isOwned(result.collection, "canada-12"), true);
  assert.equal(isOwned(result.collection, "canada-16"), true);
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
  assert.equal(progress.total, 1014);
  assert.equal("duplicates" in progress, false);
});

test("migra quantidades antigas para figurinhas possuidas", () => {
  const migrated = migrateLegacyCollection({ version: 1, albumId: album.id, quantities: { "brasil-12": 3, "argentina-8": 1 } }, albumIndex);
  assert.deepEqual(migrated.ownedStickerIds.sort(), ["argentina-8", "brasil-12"]);
});

test("calcula figurinhas faltantes agrupadas por selecao", () => {
  const collection = register(createEmptyCollection(album.id), "Brasil 1 2 3").collection;
  const groups = missingStickerGroups(albumIndex, collection);
  const brasil = groups.find((group) => group.section.id === "brasil");

  assert.equal(brasil.numbers.includes(1), false);
  assert.equal(brasil.numbers.includes(2), false);
  assert.equal(brasil.numbers.includes(3), false);
  assert.equal(brasil.numbers.includes(4), true);
});

test("compacta sequencias de numeros faltantes", () => {
  assert.equal(formatNumberRanges([1, 2, 3, 5, 7, 8]), "1-3, 5, 7-8");
});
test("formata mensagem de figurinhas faltantes para compartilhamento", () => {
  const collection = {
    ...createEmptyCollection(album.id),
    ownedStickerIds: [...albumIndex.stickersById.keys()].filter((id) => id !== "brasil-1" && id !== "argentina-5")
  };
  const message = formatMissingStickersMessage(albumIndex, collection);

  assert.equal(message.includes("Figurinhas faltantes - FIFA World Cup 26"), true);
  assert.equal(message.includes("Brasil: 1"), true);
  assert.equal(message.includes("Argentina: 5"), true);
  assert.equal(message.includes("Total: 2 faltantes"), true);
});

test("gera link do WhatsApp com mensagem codificada", () => {
  const url = buildWhatsAppShareUrl("Brasil: 1, 2\nTotal: 2 faltantes");

  assert.equal(url, "https://wa.me/?text=Brasil%3A%201%2C%202%0ATotal%3A%202%20faltantes");
});

test("mantem link do WhatsApp compacto quando ha muitas faltantes", () => {
  const share = missingStickersShare(albumIndex, createEmptyCollection(album.id));

  assert.equal(share.total, 1014);
  assert.equal(share.message.includes("Brasil: 1-20"), true);
  assert.equal(share.url.length < 4000, true);
});
test("informa album completo quando nao ha faltantes", () => {
  const collection = { ...createEmptyCollection(album.id), ownedStickerIds: [...albumIndex.stickersById.keys()] };
  const share = missingStickersShare(albumIndex, collection);

  assert.equal(share.total, 0);
  assert.equal(share.message, "Album completo - FIFA World Cup 26");
});
// Matriz de estresse da gramatica de ditado.
function validIds(input) {
  return parseStickerCommands(input, albumIndex).filter((command) => command.status === "valid").map((command) => command.sticker.id);
}

function assertValidIds(input, expected) {
  assert.deepEqual(validIds(input), expected);
}

const allSections = [...albumIndex.sections.values()];
for (const section of allSections) {
  test(`gramatica: lista sem pontuacao para ${section.name}`, () => {
    const numbers = [...new Set([section.stickers[0].number, section.stickers[Math.floor(section.stickers.length / 2)].number, section.stickers.at(-1).number])];
    assertValidIds(`${section.name} ${numbers.join(" ")}`, numbers.map((number) => `${section.id}-${number}`));
  });
}

for (const separator of [",", ", ", ".", "\n", " e ", " ", "h", " h "]) {
  test(`gramatica: separador ${JSON.stringify(separator)} em uma selecao`, () => {
    assertValidIds(`Brasil 8${separator}12${separator}16`, ["brasil-8", "brasil-12", "brasil-16"]);
  });
}

for (const separator of [", ", ". ", "\n", " ", " e ", " h ", "; ", "  "]) {
  test(`gramatica: troca de selecao com ${JSON.stringify(separator)}`, () => {
    assertValidIds(`Franca 8 12 16${separator}Costa do Mar, fim 8 12 16`, ["franca-8", "franca-12", "franca-16", "costa-do-marfim-8", "costa-do-marfim-12", "costa-do-marfim-16"]);
  });
}

for (const section of allSections.filter((candidate) => candidate.name.includes(" "))) {
  const words = section.name.split(" ");
  const head = words.slice(0, -1).join(" ");
  const tail = words.at(-1);
  const numbers = section.stickers.slice(0, 2).map((sticker) => sticker.number);
  for (const separator of [", ", ". ", "\n"]) {
    test(`gramatica: nome composto ${section.name} com ${JSON.stringify(separator)}`, () => {
      assertValidIds(`${head}${separator}${tail} ${numbers.join(" ")}`, numbers.map((number) => `${section.id}-${number}`));
    });
  }
}

for (const scenario of [
  ["Brasil oito doze dezesseis", ["brasil-8", "brasil-12", "brasil-16"]],
  ["Brasil dez onze doze", ["brasil-10", "brasil-11", "brasil-12"]],
  ["Brasil vinte", ["brasil-20"]],
  ["Brasil oito, doze e dezesseis", ["brasil-8", "brasil-12", "brasil-16"]],
  ["Brasil 8 doze 16", ["brasil-8", "brasil-12", "brasil-16"]],
  ["figurinha numero oito doze do Brasil", ["brasil-8", "brasil-12"]]
]) {
  test(`gramatica: numero ditado ${scenario[0]}`, () => assertValidIds(scenario[0], scenario[1]));
}

for (const scenario of [
  ["Brasil 8h12", ["brasil-8", "brasil-12"]],
  ["Brasil 8 h 12", ["brasil-8", "brasil-12"]],
  ["Brasil 8h e 12", ["brasil-8", "brasil-12"]],
  ["Brasil 8 h, 12", ["brasil-8", "brasil-12"]],
  ["Brasil 8h12h16", ["brasil-8", "brasil-12", "brasil-16"]]
]) {
  test(`gramatica: h em ${scenario[0]}`, () => assertValidIds(scenario[0], scenario[1]));
}

for (const scenario of [
  ["8 12", []],
  ["Brasil 8 Brasul 12", ["brasil-8"]],
  ["Brasil 999 8", ["brasil-8"]],
  ["Brasil 10:12", []],
  ["Costa do Mar 8", []],
  ["Brasil 8 xpto 12", ["brasil-8"]]
]) {
  test(`gramatica: entrada invalida ${scenario[0]}`, () => assertValidIds(scenario[0], scenario[1]));
}
