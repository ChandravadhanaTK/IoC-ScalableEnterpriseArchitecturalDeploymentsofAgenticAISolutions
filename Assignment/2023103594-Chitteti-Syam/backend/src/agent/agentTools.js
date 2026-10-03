import { Type } from "@google/genai";
import { searchAnnouncements } from "../../services/announcementService.js";
import { searchEvents, isEventAvailableForRegistration } from "../../services/eventService.js";
import { registerForEvent } from "../../services/registrationService.js";

export const searchEventsTool = {
  name: "search_events",
  description: "Find college events by title, description, or location. Leave query empty to list events.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Optional search text" },
    },
  },
};

export const searchAnnouncementsTool = {
  name: "search_announcements",
  description: "Find college announcements by title or content. Leave query empty to list announcements.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Optional search text" },
    },
  },
};

export const registerForEventTool = {
  name: "register_for_event",
  description: "Register a student for an event only after the student has explicitly confirmed.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      eventId: { type: Type.STRING },
      studentName: { type: Type.STRING },
      studentEmail: { type: Type.STRING },
    },
    required: ["eventId", "studentName", "studentEmail"],
  },
};

export async function executeTool(name, args, context = {}) {
  try {
    if (name === "search_events") {
      return await searchEvents(args.query);
    }

    if (name === "search_announcements") {
      return await searchAnnouncements(args.query);
    }

    if (name === "register_for_event") {
      if (!context.registrationConfirmed || !context.pendingRegistration) {
        return { error: "Registration requires explicit student confirmation" };
      }

      const pending = context.pendingRegistration;

      if (
        args.eventId !== pending.event._id.toString() ||
        args.studentName !== pending.studentName ||
        args.studentEmail !== pending.studentEmail
      ) {
        return { error: "Registration details do not match the confirmed request" };
      }

      if (context.registrationAttempted) {
        return { error: "Registration was already attempted for this confirmation" };
      }
      context.registrationAttempted = true;

      const result = await registerForEvent({
        eventId: pending.event._id,
        studentName: pending.studentName,
        studentEmail: pending.studentEmail,
      });

      if (result.error) {
        return { error: result.error };
      }

      return {
        message: "Registration successful",
        eventTitle: result.event.title,
        registration: result.registration.toObject(),
      };
    }

    return { error: `Unknown tool: ${name}` };
  } catch (error) {
    console.error(`Tool ${name} failed:`, error);
    return { error: "The requested data could not be loaded. Please try again." };
  }
}
