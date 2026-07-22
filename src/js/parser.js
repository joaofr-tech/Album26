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
  const stickersById = new Map();
  const stickersBySectionAndNumber = new Map();

  for (const section of indexedAlbum.sections) {
    sections.set(section.id, section);
    const aliases = new Set([section.name, section.id, ...(section.aliases || [])]);
    for (const alias of aliases) {
      sectionsByAlias.set(slugify(alias), section);
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
    stickersById,
    stickersBySectionAndNumber,
    totalStickers: stickersById.size,
    maxNumber: maxStickerNumber(indexedAlbum)
  };
}

function splitRawCommands(input) {
  return normalizeText(input)
    .replace(/[.;,\n\r]+/g, "|")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap(splitByLooseAnd);
}

function splitByLooseAnd(part) {
  const tokens = part.split(/\s+/);
  const groups = [[]];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const previous = tokens[index - 1];
    const next = tokens[index + 1];
    const isNumberWordJoin =
      token === "e" && TENS_WORDS.has(previous) && (UNIT_WORDS.has(next) || TEEN_WORDS.has(next));

    if (token === "e" && !isNumberWordJoin) {
      groups.push([]);
    } else {
      groups[groups.length - 1].push(token);
    }
  }

  return groups.map((group) => group.join(" ").trim()).filter(Boolean);
}

function removeAuxiliaryWords(tokens) {
  return tokens.filter((token) => !AUXILIARY_WORDS.has(token));
}

function findSection(tokens, index) {
  let best = null;

  for (const [alias, section] of index.sectionsByAlias.entries()) {
    const aliasTokens = alias.split("-").filter(Boolean);
    for (let start = 0; start <= tokens.length - aliasTokens.length; start += 1) {
      const candidate = tokens.slice(start, start + aliasTokens.length).map(slugify);
      if (candidate.join("-") === alias) {
        const score = aliasTokens.length;
        if (!best || score > best.score) {
          best = { section, start, end: start + aliasTokens.length, score };
        }
      }
    }
  }

  return best;
}

function firstNumber(tokens) {
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      return Number(token);
    }
  }

  return null;
}

export function parseStickerCommands(input, albumIndex) {
  const parts = splitRawCommands(input);
  const results = [];
  let activeSection = null;

  for (const rawPart of parts) {
    const withDigits = numberWordsToDigits(rawPart, albumIndex.maxNumber);
    const tokens = removeAuxiliaryWords(withDigits.split(/\s+/).filter(Boolean));
    const sectionMatch = findSection(tokens, albumIndex);
    const number = firstNumber(tokens);
    const isNumericContinuation =
      !sectionMatch &&
      activeSection &&
      tokens.length > 0 &&
      tokens.every((token) => /^\d+$/.test(token));
    const section = sectionMatch?.section || (isNumericContinuation ? activeSection : null);

    if (sectionMatch?.section) {
      activeSection = sectionMatch.section;
    }

    if (!section) {
      results.push({
        status: "unknown-section",
        raw: rawPart,
        message: `Nao foi possivel identificar a secao "${rawPart}".`
      });
      continue;
    }

    if (number === null) {
      results.push({
        status: "missing-number",
        raw: rawPart,
        section,
        message: `Nenhum numero foi identificado em "${rawPart}".`
      });
      continue;
    }

    const sticker = albumIndex.stickersBySectionAndNumber.get(`${section.id}:${number}`);
    if (!sticker) {
      results.push({
        status: "missing-sticker",
        raw: rawPart,
        section,
        number,
        message: `${section.name} ${number} nao existe neste album.`
      });
      continue;
    }

    results.push({
      status: "valid",
      raw: rawPart,
      section,
      number,
      sticker,
      message: `${section.name} ${number}`
    });
  }

  return results;
}
