/**
 * GroupGenerator.js
 * Fix: soporte completo para todos los tipos de ejercicio.
 * Bug corregido: generateGroup() ignoraba exerciseType y siempre
 * usaba el pool Koch. Ahora respeta custom_string, koch_custom,
 * words_custom, words_custom_g4fon, words_custom_lcwo.
 */

import { getActiveCharacters } from '../constants/kochSequences.js';

// -- Helpers de cadena personalizada ------------------------------------

function parseCustomTokens(customString) {
  if (!customString || typeof customString !== 'string') return [];
  const withoutComments = customString.replace(/\{[^}]*\}/g, '');
  return withoutComments
    .split(/\s+/)
    .map(t => t.trim().toUpperCase())
    .filter(t => t.length > 0);
}

function parseCustomChars(customString) {
  const tokens = parseCustomTokens(customString);
  const chars = new Set();
  tokens.forEach(token => {
    [...token].forEach(ch => { if (ch.trim()) chars.add(ch); });
  });
  return [...chars];
}

function getActivePool(settings, kochSequence) {
  const type = settings.exerciseType;
  const customChars = parseCustomChars(settings.customString);
  const fallback = ['K', 'M'];

  switch (type) {
    case 'koch_custom':
    case 'words_custom':
      return customChars.length > 0 ? customChars : fallback;

    case 'words_custom_g4fon':
    case 'words_custom_lcwo': {
      const kochChars = getActiveCharacters(kochSequence, settings.kochLevel);
      return [...new Set([...customChars, ...kochChars])];
    }

    case 'koch_lcwo':
    case 'koch_g4fon':
    default:
      return getActiveCharacters(kochSequence, settings.kochLevel);
  }
}

// -- Generador principal ------------------------------------------------

export function generateGroup(settings, kochSequence) {

  if (settings.exerciseType === 'custom_string') {
    const tokens = parseCustomTokens(settings.customString);
    if (tokens.length === 0) return 'K';
    const groupLen = settings.wordLength === 0
      ? Math.floor(Math.random() * 5) + 1
      : settings.wordLength;
    const maxStart = Math.max(0, tokens.length - groupLen);
    const startIdx = Math.floor(Math.random() * (maxStart + 1));
    return tokens.slice(startIdx, startIdx + groupLen).join('') || tokens[0];
  }

  const activeChars = getActivePool(settings, kochSequence);
  if (activeChars.length === 0) return 'K';

  const groupLen = settings.wordLength === 0
    ? Math.floor(Math.random() * 5) + 1
    : settings.wordLength;

  const hardSet = new Set(settings.hardLetters || []);
  const isKochStandard = settings.exerciseType === 'koch_g4fon' ||
                         settings.exerciseType === 'koch_lcwo';
  if (isKochStandard && settings.autoHardLetters && activeChars.length >= 2) {
    hardSet.add(activeChars[activeChars.length - 1]);
    hardSet.add(activeChars[activeChars.length - 2]);
  }
  const hardArray = [...hardSet].filter(c => activeChars.includes(c));

  const group = [];
  for (let i = 0; i < groupLen; i++) {
    let selectedChar;
    if (hardArray.length > 0 && Math.random() < 0.5) {
      selectedChar = hardArray[Math.floor(Math.random() * hardArray.length)];
    } else {
      selectedChar = activeChars[Math.floor(Math.random() * activeChars.length)];
    }
    group.push(selectedChar);
  }
  return group.join('');
}

export function generateGroupBatch(count, settings, kochSequence) {
  const groups = [];
  for (let i = 0; i < count; i++) {
    groups.push(generateGroup(settings, kochSequence));
  }
  return groups;
}

export function analyzeDistribution(activeChars, hardChars, sampleSize = 1000) {
  const counts = {};
  activeChars.forEach(c => { counts[c] = 0; });
  const hardArray = hardChars.filter(c => activeChars.includes(c));
  for (let i = 0; i < sampleSize; i++) {
    let char;
    if (hardArray.length > 0 && Math.random() < 0.5) {
      char = hardArray[Math.floor(Math.random() * hardArray.length)];
    } else {
      char = activeChars[Math.floor(Math.random() * activeChars.length)];
    }
    if (counts[char] !== undefined) counts[char]++;
  }
  const freqs = {};
  Object.entries(counts).forEach(([char, count]) => {
    freqs[char] = count / sampleSize;
  });
  return freqs;
}
