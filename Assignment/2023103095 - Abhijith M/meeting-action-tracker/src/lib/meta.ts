export function pageMeta(title: string, description: string) {
  const t = `${title} — AI Meeting Action Tracker`;
  return {
    meta: [
      { title: t },
      { name: "description", content: description },
      { property: "og:title", content: t },
      { property: "og:description", content: description },
    ],
  };
}
