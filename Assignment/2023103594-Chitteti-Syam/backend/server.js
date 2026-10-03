import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import { getEventById, searchEvents } from "./services/eventService.js";
import { searchAnnouncements } from "./services/announcementService.js";
import { registerForEvent } from "./services/registrationService.js";
import { runAgent } from "./src/agent/agent.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/events", async (req, res) => {
  const events = await searchEvents();
  res.json(events);
});

app.get("/api/events/:id", async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  const event = await getEventById(req.params.id);

  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  res.json(event);
});

app.get("/api/announcements", async (req, res) => {
  const announcements = await searchAnnouncements();
  res.json(announcements);
});

app.post("/api/registrations", async (req, res) => {
  const { eventId, studentName, studentEmail } = req.body;

  if (
    !mongoose.isObjectIdOrHexString(eventId) ||
    typeof studentName !== "string" ||
    !studentName.trim() ||
    typeof studentEmail !== "string" ||
    !studentEmail.trim()
  ) {
    return res.status(400).json({
      error: "A valid eventId, studentName, and studentEmail are required",
    });
  }

  const result = await registerForEvent({
    eventId,
    studentName: studentName.trim(),
    studentEmail: studentEmail.trim(),
  });

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.status(201).json({
    message: "Registration successful",
    registration: result.registration,
  });
});

app.post("/api/chat", async (req, res) => {
  const { message, conversationId } = req.body ?? {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "A non-empty message is required" });
  }

  if (
    conversationId !== undefined &&
    (typeof conversationId !== "string" || !conversationId.trim() || conversationId.length > 128)
  ) {
    return res.status(400).json({ error: "conversationId must be a non-empty string up to 128 characters" });
  }

  try {
    const reply = await runAgent(message.trim(), conversationId?.trim() || "default");
    res.json({ reply });
  } catch (error) {
    console.error("Chat request failed:", error);
    res.status(error.statusCode || 502).json({
      error: error.message || "The assistant could not process your message",
    });
  }
});

app.use((error, req, res, next) => {
  console.error("API request failed:", error);
  res.status(error.status || 500).json({
    error: error.status === 400
      ? "Invalid JSON request body"
      : "An unexpected server error occurred",
  });
});

async function startServer() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } else {
    console.log("MONGODB_URI is not set; skipping MongoDB connection");
  }

  app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start the backend:", error);
  process.exitCode = 1;
});
