import mongoose from "mongoose";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";

export async function registerForEvent({ eventId, studentName, studentEmail }) {
  if (!mongoose.isObjectIdOrHexString(eventId)) {
    return { status: 400, error: "A valid eventId is required" };
  }

  const event = await Event.findById(eventId);

  if (!event) {
    return { status: 404, error: "Event not found" };
  }

  if (!event.registrationOpen) {
    return { status: 409, error: "Registration is closed for this event" };
  }

  const registrationCount = await Registration.countDocuments({ eventId });

  if (registrationCount >= event.capacity) {
    return { status: 409, error: "This event has reached capacity" };
  }

  const registration = await Registration.create({
    eventId,
    studentName,
    studentEmail,
  });

  return { registration, event };
}
