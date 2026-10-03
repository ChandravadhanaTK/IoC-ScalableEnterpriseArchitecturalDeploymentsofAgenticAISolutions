export function tokenize(text = '') {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

export function buildEmbedding(text = '') {
  const tokens = tokenize(text);
  const counts = {};

  for (const token of tokens) {
    counts[token] = (counts[token] || 0) + 1;
  }

  const uniqueTokens = Object.keys(counts).sort();
  const vector = uniqueTokens.map((token) => ({ token, value: counts[token] }));
  return vector;
}

export function cosineSimilarity(vecA, vecB) {
  const mapA = new Map(vecA.map((entry) => [entry.token, entry.value]));
  const mapB = new Map(vecB.map((entry) => [entry.token, entry.value]));

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const [token, valueA] of mapA.entries()) {
    const valueB = mapB.get(token) || 0;
    dot += valueA * valueB;
    magnitudeA += valueA * valueA;
  }

  for (const valueB of mapB.values()) {
    magnitudeB += valueB * valueB;
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}
