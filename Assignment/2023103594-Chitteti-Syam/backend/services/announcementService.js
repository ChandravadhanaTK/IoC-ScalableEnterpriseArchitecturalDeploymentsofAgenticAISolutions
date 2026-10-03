import Announcement from "../models/Announcement.js";
import { createSearchFilter } from "./searchFilter.js";

export function searchAnnouncements(query) {
  return Announcement.find(
    createSearchFilter(query, ["title", "content"]),
  ).limit(20).lean();
}
