const express = require("express");
const cors = require("cors");

const triageAgent = require("./agents/triageAgent");
const knowledgeAgent = require("./agents/knowledgeAgent");
const resolutionAgent = require("./agents/resolutionAgent");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// In-memory ticket store for this prototype
const tickets = [];

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        service: "AI IT Helpdesk Backend",
        timestamp: new Date().toISOString()
    });
});

// Create a new support ticket
app.post("/api/tickets", (req, res) => {
    try {
        const { title, description, employee } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                message: "Title and description are required."
            });
        }

        // Agent 1: Triage
        const triageResult = triageAgent(title, description);

        // Agent 2: Knowledge retrieval
        const knowledgeResult = knowledgeAgent(triageResult.category);

        // Agent 3: Resolution
        const resolutionResult = resolutionAgent(
            triageResult,
            knowledgeResult
        );

        const ticket = {
            id: `TKT-${String(tickets.length + 1).padStart(4, "0")}`,
            employee: employee || "Anonymous Employee",
            title,
            description,

            category: triageResult.category,
            priority: triageResult.priority,

            knowledgeArticle: knowledgeResult.title,
            troubleshootingSteps: knowledgeResult.steps,

            confidence: resolutionResult.confidence,
            recommendation: resolutionResult.recommendation,

            status: resolutionResult.shouldEscalate
                ? "Escalated"
                : "AI Resolved",

            createdAt: new Date().toISOString()
        };

        tickets.push(ticket);

        res.status(201).json(ticket);

    } catch (error) {
        console.error("Ticket processing error:", error);

        res.status(500).json({
            message: "Unable to process the ticket."
        });
    }
});

// Get all tickets
app.get("/api/tickets", (req, res) => {
    res.json(tickets);
});

// Get one ticket
app.get("/api/tickets/:id", (req, res) => {
    const ticket = tickets.find(t => t.id === req.params.id);

    if (!ticket) {
        return res.status(404).json({
            message: "Ticket not found."
        });
    }

    res.json(ticket);
});

// Update ticket status
app.patch("/api/tickets/:id/status", (req, res) => {
    const ticket = tickets.find(t => t.id === req.params.id);

    if (!ticket) {
        return res.status(404).json({
            message: "Ticket not found."
        });
    }

    const { status } = req.body;

    const allowedStatuses = [
        "Open",
        "In Progress",
        "AI Resolved",
        "Resolved",
        "Escalated"
    ];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid ticket status."
        });
    }

    ticket.status = status;

    res.json(ticket);
});

// Dashboard metrics
app.get("/api/metrics", (req, res) => {
    const total = tickets.length;

    const resolved = tickets.filter(
        t => t.status === "Resolved" || t.status === "AI Resolved"
    ).length;

    const escalated = tickets.filter(
        t => t.status === "Escalated"
    ).length;

    const open = tickets.filter(
        t => t.status === "Open" || t.status === "In Progress"
    ).length;

    const highPriority = tickets.filter(
        t => t.priority === "High"
    ).length;

    const averageConfidence = total
        ? Math.round(
            tickets.reduce((sum, ticket) => sum + ticket.confidence, 0) /
            total
        )
        : 0;

    res.json({
        total,
        open,
        resolved,
        escalated,
        highPriority,
        averageConfidence
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`AI IT Helpdesk backend running on http://localhost:${PORT}`);
});