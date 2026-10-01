function resolutionAgent(triageResult, knowledgeResult) {
    const { category, priority } = triageResult;

    const steps = knowledgeResult.steps;

    let confidence = 0.90;

    if (category === "General IT") {
        confidence = 0.65;
    }

    if (priority === "High") {
        confidence -= 0.05;
    }

    const shouldEscalate = confidence < 0.75;

    const recommendation = steps
        .map((step, index) => `${index + 1}. ${step}`)
        .join("\n");

    return {
        category,
        priority,
        confidence: Math.round(confidence * 100),
        recommendation,
        shouldEscalate,
        status: shouldEscalate ? "Escalated" : "AI Resolved"
    };
}

module.exports = resolutionAgent;