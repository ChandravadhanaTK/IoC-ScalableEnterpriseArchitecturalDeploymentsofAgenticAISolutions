import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { createSearchFilter } from "./searchFilter.js";

export function searchEvents(query) {
  return Event.find(
    createSearchFilter(query, ["title", "description", "location"]),
  ).limit(20).lean();
}

export function getEventById(id) {
  return Event.findById(id);
}

export async function isEventAvailableForRegistration(event) {
  if (!event.registrationOpen) {
    return false;
  }

  const registrationCount = await Registration.countDocuments({ eventId: event._id });
  return registrationCount < event.capacity;
}
