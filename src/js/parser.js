import { looksLikeStructuredStickerList, parseStructuredStickerList } from "./structured-list.js";

const AUXILIARY_WORDS = new Set([
  "figurinha",
  "figurinhas",
  "numero",
  "adicionar",
  "adiciona",
  "tenho",
  "possuo",
  "do",
  "da",
  "de"
]);

const UNIT_WORDS = new Map([
  ["zero", 0],
  ["um", 1],
  ["uma", 1],
  ["dois", 2],
  ["duas", 2],
  ["tres", 3],
  ["quatro", 4],
  ["cinco", 5],
  ["seis", 6],
  ["sete", 7],
  ["oito", 8],
  ["nove", 9]
]);

const TEEN_WORDS = new Map([
  ["dez", 10],
  ["onze", 11],
  ["doze", 12],
  ["treze", 13],
  ["quatorze", 14],
  ["catorze", 14],
  ["quinze", 15],
  ["dezesseis", 16],
  ["dezassete", 17],
  ["dezessete", 17],
  ["dezoito", 18],
  ["dezenove", 19]
]);

const TENS_WORDS = new Map([
  ["vinte", 20],
  ["trinta", 30],
  ["quarenta", 40],
  ["cinquenta", 50],
  ["sessenta", 60],
  ["setenta", 70],
  ["oitenta", 80],
  ["noventa", 90]
]);

export function stripAccents(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function slugify(value) {
  return stripAccents(String(value))
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeText(value) {
  return stripAccents(String(value))
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/[()[\]{}-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function maxStickerNumber(album) {
  return Math.max(...album.sections.flatMap((section) => section.stickers.map((sticker) => sticker.number)));
}

function materializeAlbum(album) {
  return {
    ...album,
    sections: album.sections.map((section) => {
      const { numberRange, numbers, stickers, ...metadata } = section;
      const stickerNumbers =
        numbers ||
        (numberRange
          ? Array.from({ length: numberRange[1] - numberRange[0] + 1 }, (_, index) => numberRange[0] + index)
          : []);

      return {
        ...metadata,
        stickers:
          stickers ||
          stickerNumbers.map((number) => ({
            id: `${section.id}-${number}`,
            sectionId: section.id,
            number,
            title: null
          }))
      };
    })
  };
}

function numberWordsToDigits(text, maxNumber) {
  const words = text.split(/\s+/);
  const output = [];

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    let value = null;
    let consumed = 0;

    if (UNIT_WORDS.has(word)) {
      value = UNIT_WORDS.get(word);
    } else if (TEEN_WORDS.has(word)) {
      value = TEEN_WORDS.get(word);
    } else if (TENS_WORDS.has(word)) {
      value = TENS_WORDS.get(word);
      if (words[index + 1] === "e" && UNIT_WORDS.has(words[index + 2])) {
        const combined = value + UNIT_WORDS.get(words[index + 2]);
        if (combined <= maxNumber) {
          value = combined;
          consumed = 2;
        }
      }
    }

    if (value !== null && value <= maxNumber) {
      output.push(String(value));
      index += consumed;
    } else {
      output.push(word);
    }
  }

  return output.join(" ");
}

export function buildAlbumIndex(album) {
  const indexedAlbum = materializeAlbum(album);
  const sections = new Map();
  const sectionsByAlias = new Map();
  const sectionAliases = [];
  const stickersById = new Map();
  const stickersBySectionAndNumber = new Map();

  for (const section of indexedAlbum.sections) {
    sections.set(section.id, section);
    const aliases = new Set([section.name, section.id, ...(section.aliases || [])]);
    for (const alias of aliases) {
      sectionsByAlias.set(slugify(alias), section);
      const tokens = normalizeText(alias).split(/\s+/).filter(Boolean);
      sectionAliases.push({ section, tokens, compact: tokens.join("") });
    }

    for (const sticker of section.stickers) {
      stickersById.set(sticker.id, sticker);
      stickersBySectionAndNumber.set(`${section.id}:${sticker.number}`, sticker);
    }
  }

  return {
    album: indexedAlbum,
    sections,
    sectionsByAlias,
    sectionAliases: sectionAliases.sort((left, right) => right.tokens.length - left.tokens.length),
    stickersById,
    stickersBySectionAndNumber,
    totalStickers: stickersById.size,
    maxNumber: maxStickerNumber(indexedAlbum)
  };
}

function tokenizeInput(input, maxNumber) {
  const text = numberWordsToDigits(normalizeText(input).replace(/[.;,\n\r]+/g, " "), maxNumber);

  return text.split(/\s+/).filter(Boolean).flatMap((token) => {
    if (/^\d+:\d+$/.test(token)) return [{ type: "invalid", value: token }];
    if (/^\d+(?:h\d+)+$/.test(token) || /^h\d+(?:h\d+)*$/.test(token)) {
      return token.split(/(h)/).filter(Boolean).map((value) => (/^\d+$/.test(value) ? { type: "number", value: Number(value) } : { type: "separator", value }));
    }
    if (/^\d+h$/.test(token)) return [{ type: "number", value: Number(token.slice(0, -1)) }, { type: "separator", value: "h" }];
    if (/^\d+$/.test(token)) return [{ type: "number", value: Number(token) }];
    if (/^[a-z]+$/.test(token)) return [{ type: "word", value: token }];
    return [{ type: "invalid", value: token }];
  });
}

function findSectionAt(tokens, start, index) {
  for (const candidate of index.sectionAliases) {
    let compact = "";

    for (let position = start; position < tokens.length; position += 1) {
      const current = tokens[position];
      if (current?.type !== "word") break;

      compact += current.value;
      if (compact === candidate.compact) return { ...candidate, length: position - start + 1 };
      if (!candidate.compact.startsWith(compact)) break;
    }
  }

  return null;
}

function isIgnorable(token) {
  return token.type === "separator" || (token.type === "word" && (AUXILIARY_WORDS.has(token.value) || token.value === "e" || token.value === "h"));
}

function structuredItemsToCommands(parsed) {
  return [
    ...parsed.items.map((item) => ({
      status: "valid",
      raw: item.raw,
      section: item.section,
      number: item.number,
      sticker: item.sticker,
      message: `${item.section.name} ${item.number}`
    })),
    ...parsed.warnings
  ];
}

export function parseStickerCommands(input, albumIndex) {
  if (looksLikeStructuredStickerList(input, albumIndex)) {
    const parsed = parseStructuredStickerList(input, albumIndex);
    if (parsed.items.length > 0 || parsed.warnings.length > 0) return structuredItemsToCommands(parsed);
  }
  const tokens = tokenizeInput(input, albumIndex.maxNumber);
  const results = [];
  let activeSection = null;
  let activeSectionHasNumber = false;
  let pendingNumbers = [];
  let pendingNumbersAreSafe = true;
  let unknownWordRun = false;

  const addNumber = (section, number, raw) => {
    activeSectionHasNumber = true;
    const sticker = albumIndex.stickersBySectionAndNumber.get(`${section.id}:${number}`);
    if (!sticker) {
      results.push({ status: "missing-sticker", raw, section, number, message: `${section.name} ${number} nao existe neste album.` });
      return;
    }
    results.push({ status: "valid", raw, section, number, sticker, message: `${section.name} ${number}` });
  };

  const reportMissingNumber = (section, raw) => {
    results.push({ status: "missing-number", raw, section, message: `Nenhum numero foi identificado em "${raw}".` });
  };

  for (let position = 0; position < tokens.length;) {
    const sectionMatch = findSectionAt(tokens, position, albumIndex);
    if (sectionMatch) {
      if (activeSection && !activeSectionHasNumber) reportMissingNumber(activeSection, activeSection.name);
      const numbersBeforeSection = !activeSection && pendingNumbersAreSafe ? pendingNumbers : [];
      activeSection = sectionMatch.section;
      activeSectionHasNumber = false;
      pendingNumbers = [];
      pendingNumbersAreSafe = true;
      unknownWordRun = false;
      for (const number of numbersBeforeSection) addNumber(activeSection, number, String(number));
      position += sectionMatch.length;
      continue;
    }

    const token = tokens[position];
    if (token.type === "number") {
      if (activeSection) addNumber(activeSection, token.value, String(token.value));
      else if (pendingNumbersAreSafe) pendingNumbers.push(token.value);
      position += 1;
      continue;
    }

    if (isIgnorable(token)) {
      position += 1;
      continue;
    }

    if (token.type === "invalid" && activeSection) reportMissingNumber(activeSection, token.value);
    activeSection = null;
    activeSectionHasNumber = false;
    pendingNumbers = [];
    pendingNumbersAreSafe = false;
    if (token.type === "word" && !unknownWordRun) {
      results.push({ status: "unknown-section", raw: token.value, message: `Nao foi possivel identificar a secao "${token.value}".` });
      unknownWordRun = true;
    }
    position += 1;
  }

  if (activeSection && !activeSectionHasNumber) reportMissingNumber(activeSection, activeSection.name);
  return results;
}
