import { buildEmbedding, cosineSimilarity } from '../embeddings/basicEmbedding.js';

export function buildDocumentIndex(documents = []) {
  return documents.map((doc) => ({
    ...doc,
    vector: buildEmbedding(`${doc.title} ${doc.section} ${doc.content}`),
  }));
}

export function searchDocuments(query, documents = [], limit = 3) {
  const queryVector = buildEmbedding(query);

  return documents
    .map((doc) => ({
      ...doc,
      score: cosineSimilarity(queryVector, doc.vector || buildEmbedding(`${doc.title} ${doc.section} ${doc.content}`)),
    }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ vector, ...rest }) => rest);
}
