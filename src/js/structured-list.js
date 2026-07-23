function stripAccents(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeLine(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[â€œâ€"']/g, "")
    .replace(/[^a-z0-9,:/\s-]+/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAlias(value) {
  return normalizeLine(value).replace(/[^a-z0-9]+/g, "");
}

function candidateAliases(albumIndex) {
  const candidates = [];

  for (const section of albumIndex.album.sections) {
    const aliases = new Set([section.name, section.id, ...(section.aliases || []), ...(section.checklistAliases || [])]);
    for (const alias of aliases) {
      const normalized = normalizeLine(alias);
      const tokens = normalized.split(/\s+/).filter(Boolean);
      const compact = normalizeAlias(alias);
      if (tokens.length > 0 && compact) candidates.push({ section, tokens, compact });
    }
  }

  return candidates.sort((left, right) => right.tokens.length - left.tokens.length || right.compact.length - left.compact.length);
}

function findSectionByCompactAlias(alias, albumIndex) {
  const normalized = normalizeAlias(alias);
  return candidateAliases(albumIndex).find((candidate) => candidate.compact === normalized)?.section || null;
}

function findSectionAtStart(tokens, albumIndex) {
  for (const candidate of candidateAliases(albumIndex)) {
    if (candidate.tokens.length === 0 || candidate.tokens.length > tokens.length) continue;

    const direct = candidate.tokens.every((token, index) => tokens[index] === token);
    if (direct) return { section: candidate.section, length: candidate.tokens.length };

    if (candidate.tokens.length > 1 && tokens[0] === candidate.compact) return { section: candidate.section, length: 1 };
  }

  return null;
}

function numbersFromText(text) {
  if (/\d\s*:\s*\d/.test(text)) return [];
  return [...text.matchAll(/\b\d+\b/g)].map((match) => Number(match[0]));
}

function addSticker(items, warnings, section, number, rawLine, albumIndex) {
  const sticker = albumIndex.stickersBySectionAndNumber.get(`${section.id}:${number}`);
  if (!sticker) {
    warnings.push({
      status: "missing-sticker",
      raw: rawLine,
      section,
      number,
      message: `${section.name} ${number} nao existe neste album.`
    });
    return;
  }

  items.push({ section, number, sticker, raw: rawLine });
}

export function parseStructuredStickerList(input, albumIndex) {
  const items = [];
  const warnings = [];
  const lines = String(input).split(/\r?\n/);

  for (const rawLine of lines) {
    const normalized = normalizeLine(rawLine);
    if (!normalized) continue;

    const hadProgress = /\b\d+\s*\/\s*\d+\b/.test(normalized);
    let working = normalized.replace(/\b\d+\s*\/\s*\d+\b/g, " ");
    let matchedGluedToken = false;

    working = working.replace(/\b([a-z]{2,4})(\d{1,3})(?=\D|$)/g, (match, alias, rawNumber) => {
      const section = findSectionByCompactAlias(alias, albumIndex);
      if (!section) {
        warnings.push({ status: "unknown-section", raw: rawLine, message: `Nao foi possivel identificar a secao em "${match}".` });
        return " ";
      }

      matchedGluedToken = true;
      addSticker(items, warnings, section, Number(rawNumber), rawLine, albumIndex);
      return " ";
    });

    working = working.replace(/\s+/g, " ").trim();
    if (!working) continue;

    const tokens = working.split(/\s+/).filter(Boolean);
    const sectionMatch = findSectionAtStart(tokens, albumIndex);
    if (!sectionMatch) {
      if (/\d/.test(working) && !matchedGluedToken) {
        warnings.push({ status: "unknown-section", raw: rawLine, message: `Nao foi possivel identificar a secao em "${rawLine.trim()}".` });
      }
      continue;
    }

    const remaining = tokens.slice(sectionMatch.length).join(" ");
    const numbers = numbersFromText(remaining);
    if (numbers.length === 0) {
      if (!hadProgress && !matchedGluedToken) {
        warnings.push({ status: "missing-number", raw: rawLine, section: sectionMatch.section, message: `Nenhum numero foi identificado em "${rawLine.trim()}".` });
      }
      continue;
    }

    for (const number of numbers) addSticker(items, warnings, sectionMatch.section, number, rawLine, albumIndex);
  }

  return { items, warnings };
}

export function looksLikeStructuredStickerList(input, albumIndex) {
  const lines = String(input).split(/\r?\n/);

  for (const rawLine of lines) {
    const normalized = normalizeLine(rawLine);
    if (!normalized) continue;

    if (/\b\d+\s*\/\s*\d+\b/.test(normalized)) return true;
    if (/\b([a-z]{2,4})\d{1,3}(?=\D|$)/.test(normalized)) return true;

    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens[0] && /^[a-z]{2,4}$/.test(tokens[0]) && findSectionByCompactAlias(tokens[0], albumIndex)) return true;
    if (normalized.includes(":") && findSectionAtStart(tokens, albumIndex)) return true;
  }

  return false;
}