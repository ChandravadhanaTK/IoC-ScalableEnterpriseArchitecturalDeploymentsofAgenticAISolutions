const ignoredSearchTerms = new Set([
  "a",
  "all",
  "an",
  "and",
  "announcements",
  "announcement",
  "are",
  "available",
  "college",
  "event",
  "events",
  "find",
  "for",
  "in",
  "latest",
  "me",
  "of",
  "on",
  "recent",
  "show",
  "the",
  "to",
  "upcoming",
  "what",
  "which",
]);

export function createSearchFilter(query, fields) {
  const terms = typeof query === "string"
    ? [...new Set(
      query
        .trim()
        .split(/\s+/)
        .filter((term) => term.length > 1 && !ignoredSearchTerms.has(term.toLowerCase())),
    )]
    : [];

  if (terms.length === 0) {
    return {};
  }

  return {
    $and: terms.map((term) => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return {
        $or: fields.map((field) => ({
          [field]: { $regex: escapedTerm, $options: "i" },
        })),
      };
    }),
  };
}
