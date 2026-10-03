export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — MediFlow AI` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — MediFlow AI` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
