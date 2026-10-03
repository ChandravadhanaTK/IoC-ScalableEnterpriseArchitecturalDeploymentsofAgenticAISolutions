import { GoogleGenAI } from "@google/genai";
import {
  executeTool,
  searchAnnouncementsTool,
  searchEventsTool,
} from "./agentTools.js";
import { instructions, model } from "./agentConfig.js";
import { isEventAvailableForRegistration, searchEvents } from "../../services/eventService.js";
import { processRegistrationConfirmation } from "./registrationApproval.js";

const pendingRegistrations = new Map();
let geminiClient;

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("The assistant is not configured. Set GEMINI_API_KEY in backend/.env.");
    error.statusCode = 503;
    throw error;
  }

  geminiClient ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return geminiClient;
}

function isRegistrationRequest(message) {
  return /\b(register|registration|sign\s*me\s*up|sign\s*up|enroll|enrol)\b/i.test(message);
}

function getStudentDetails(message) {
  const email = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  if (!email) {
    return null;
  }

  const studentName = message
    .replace(email, "")
    .replace(/\b(my name is|i am|i'm|name is)\b/i, "")
    .replace(/[,\s]+$/g, "")
    .trim();

  return studentName ? { studentName, studentEmail: email } : null;
}

async function runWithTools(input, tools, context = {}) {
  const client = getGeminiClient();
  const declarations = tools.map(({ name, description, parameters }) => ({
    name,
    description,
    parameters,
  }));
  const requestConfig = {
    systemInstruction: instructions,
    tools: [{ functionDeclarations: declarations }],
  };
  const contents = [{ role: "user", parts: [{ text: input }] }];
  const toolResults = [];
  let response;

  async function generateResponse() {
    try {
      return await client.models.generateContent({
        model,
        contents,
        config: requestConfig,
      });
    } catch (error) {
      console.error("Gemini API request failed:", error);
      const requestError = new Error("The assistant could not process your request. Please try again.");
      requestError.statusCode = 502;
      throw requestError;
    }
  }

  for (let turn = 0; turn < 5; turn += 1) {
    response = await generateResponse();
    const modelContent = response.candidates?.[0]?.content;
    const parts = modelContent?.parts ?? [];
    const calls = parts
      .filter((part) => part.functionCall)
      .map((part) => part.functionCall);

    if (calls.length === 0) {
      return { reply: response.text ?? "", toolResults };
    }

    contents.push(modelContent);
    const functionResponses = [];
    for (const call of calls) {
      const result = await executeTool(call.name, call.args ?? {}, context);
      toolResults.push({ name: call.name, result });
      context.onToolResult?.(call.name, result);
      functionResponses.push({
        functionResponse: {
          name: call.name,
          id: call.id,
          response: { output: result },
        },
      });
    }

    contents.push({ role: "user", parts: functionResponses });
  }

  return {
    reply: "I couldn't complete that request. Please try again.",
    toolResults,
  };
}

function selectEvent(events, message) {
  const normalizedMessage = message.toLowerCase();
  return events.find((event) => normalizedMessage.includes(event.title.toLowerCase()))
    ?? (events.length === 1 ? events[0] : null);
}

async function beginRegistration(message, conversationId) {
  const result = await runWithTools(message, [searchEventsTool]);
  let events = result.toolResults
    .filter((toolResult) => toolResult.name === "search_events" && Array.isArray(toolResult.result))
    .flatMap((toolResult) => toolResult.result);
  events = [...new Map(events.map((event) => [event._id.toString(), event])).values()];

  const searchError = result.toolResults.find(
    (toolResult) => toolResult.name === "search_events" && toolResult.result?.error,
  );
  if (searchError) {
    return `I couldn't search events: ${searchError.result.error}`;
  }

  if (events.length === 0) {
    try {
      events = await searchEvents(message);
    } catch (error) {
      console.error("Could not search events for registration:", error);
      return "I couldn't search events right now. Please try again.";
    }
  }

  const event = selectEvent(events, message);
  if (!event) {
    if (events.length > 1) {
      pendingRegistrations.set(conversationId, { stage: "choose", events });
      return `I found multiple events. Which one would you like to register for?\n${events
        .map((item) => `- ${item.title}`)
        .join("\n")}`;
    }
    return "I couldn't find a matching event. Please check the event name and try again.";
  }

  try {
    if (!(await isEventAvailableForRegistration(event))) {
      return `${event.title} is not accepting registrations right now.`;
    }
  } catch (error) {
    console.error("Could not check event registration availability:", error);
    return "I couldn't check registration availability right now. Please try again.";
  }

  let pendingRegistration = {
    event,
    studentName: null,
    studentEmail: null,
    stage: "details",
  };
  pendingRegistrations.set(conversationId, pendingRegistration);

  const details = getStudentDetails(message);
  if (details) {
    pendingRegistration = { ...pendingRegistration, ...details, stage: "confirmation" };
    pendingRegistrations.set(conversationId, pendingRegistration);
    return `${event.title} is available. Please confirm registration for ${details.studentName} (${details.studentEmail}). Reply "yes" to register or "no" to cancel.`;
  }

  return `${event.title} is available. To prepare your registration, send your full name and student email address. I will ask you to confirm before registering.`;
}

async function confirmRegistration(message, conversationId) {
  let pendingRegistration = pendingRegistrations.get(conversationId);

  function savePendingRegistration(value) {
    pendingRegistration = value;
    if (value) {
      pendingRegistrations.set(conversationId, value);
    } else {
      pendingRegistrations.delete(conversationId);
    }
  }

  if (pendingRegistration.stage === "processing") {
    return "Your registration is being processed. Please wait.";
  }

  if (pendingRegistration.stage === "choose") {
    const event = pendingRegistration.events.find((item) =>
      message.toLowerCase().includes(item.title.toLowerCase()),
    );

    if (!event) {
      return `Please reply with one of these event names:\n${pendingRegistration.events
        .map((item) => `- ${item.title}`)
        .join("\n")}`;
    }

    try {
      if (!(await isEventAvailableForRegistration(event))) {
        pendingRegistrations.delete(conversationId);
        return `${event.title} is not accepting registrations right now.`;
      }
    } catch (error) {
      console.error("Could not check event registration availability:", error);
      return "I couldn't check registration availability right now. Please try again.";
    }

    savePendingRegistration({
      event,
      studentName: null,
      studentEmail: null,
      stage: "details",
    });
  }

  if (pendingRegistration.stage === "details") {
    const details = getStudentDetails(message);
    if (!details) {
      return "Please send your full name and student email address, for example: Alex Student, alex@example.com.";
    }

    savePendingRegistration({
      ...pendingRegistration,
      ...details,
      stage: "confirmation",
    });

    return `Please confirm registration for ${pendingRegistration.event.title} using ${details.studentName} (${details.studentEmail}). Reply "yes" to register or "no" to cancel.`;
  }

  return `Please reply "yes" to confirm registration for ${pendingRegistration.event.title}, or "no" to cancel.`;
}

export async function runAgent(message, conversationId = "default") {
  const pendingRegistration = pendingRegistrations.get(conversationId);
  const approval = await processRegistrationConfirmation(
    message,
    pendingRegistration,
    pendingRegistration
      ? (details) => executeTool(
        "register_for_event",
        details,
        {
          registrationConfirmed: true,
          pendingRegistration,
        },
      )
      : undefined,
  );

  if (approval?.action === "none" || approval?.action === "processing") {
    return approval.reply;
  }

  if (approval?.action === "cancelled") {
    pendingRegistrations.delete(conversationId);
    return approval.reply;
  }

  if (approval?.action === "registered") {
    pendingRegistrations.delete(conversationId);
    if (approval.result.error) {
      return `Registration could not be completed: ${approval.result.error}.`;
    }
    return `You are registered for ${pendingRegistration.event.title}.`;
  }

  if (pendingRegistration && approval === null) {
    return confirmRegistration(message, conversationId);
  }

  if (approval?.action === "not-confirmation") {
    return "There is no registration awaiting confirmation.";
  }

  getGeminiClient();

  if (isRegistrationRequest(message)) {
    return beginRegistration(message, conversationId);
  }

  const result = await runWithTools(message, [
    searchEventsTool,
    searchAnnouncementsTool,
  ]);
  return result.reply || "I couldn't generate a response. Please try again.";
}
