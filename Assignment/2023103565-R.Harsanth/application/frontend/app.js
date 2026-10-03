const $ = (id) => document.getElementById(id);

const views = {
    assistant: $("assistant-view"),
    operations: $("operations-view")
};

let runs = 0;


function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[character]));
}


function showView(name) {

    Object.entries(views).forEach(([key, element]) => {
        element.classList.toggle("hidden", key !== name);
    });

    document.querySelectorAll(".nav").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.view === name
        );
    });

    $("page-title").textContent =
        name === "assistant"
            ? "How can I help?"
            : "Operations overview";

    if (name === "operations") {
        loadOperations();
    }
}


document.querySelectorAll(".nav").forEach((button) => {

    button.addEventListener("click", () => {
        showView(button.dataset.view);
    });

});


document.querySelectorAll(".suggestion").forEach((button) => {

    button.addEventListener("click", () => {
        $("message").value = button.dataset.prompt;
        $("message").focus();
    });

});


$("chat-form").addEventListener("submit", async (event) => {

    event.preventDefault();

    const message = $("message").value.trim();

    if (!message) {
        return;
    }

    const send = $("send");

    send.disabled = true;
    send.innerHTML = "<span>Working...</span>";

    if (runs === 0) {
        $("conversation").innerHTML = "";
    }

    const userCard = document.createElement("div");

    userCard.className = "message-card";

    userCard.innerHTML = `
        <div class="message-meta">
            <span class="mini-avatar">RH</span>
            <strong>You</strong>
        </div>

        <div class="message-body">
            ${escapeHtml(message)}
        </div>
    `;

    $("conversation").appendChild(userCard);

    try {

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                role: "employee"
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "Request failed"
            );
        }


        const tags = `
            <span class="tag">
                ${escapeHtml(
                    data.category.replaceAll("_", " ")
                )}
            </span>

            <span class="tag ${data.approval_id ? "warn" : "good"}">
                ${data.approval_id
                    ? "Approval required"
                    : "Policy checked"}
            </span>
        `;


        const trace = (data.trace || [])
            .map((step) => `
                <div class="trace-step">

                    <b>
                        ${escapeHtml(step.stage)}
                    </b>

                    <p>
                        ${escapeHtml(step.detail)}
                    </p>

                </div>
            `)
            .join("");


        const sources = data.evidence?.length
            ? `
                <div class="result-badges">

                    ${data.evidence.map((source) => `
                        <span class="tag">
                            Source:
                            ${escapeHtml(source.title)}
                        </span>
                    `).join("")}

                </div>
            `
            : "";


        const agentCard = document.createElement("div");

        agentCard.className = "message-card";

        agentCard.innerHTML = `

            <div class="message-meta">

                <span class="mini-avatar">AI</span>

                <strong>Northstar Agent</strong>

                <span>
                    / ${escapeHtml(data.duration_ms)} ms
                </span>

            </div>


            <div class="result-badges">
                ${tags}
            </div>


            <div class="message-body">
                ${escapeHtml(data.answer)
                    .replace(
                        /\*\*(.*?)\*\*/g,
                        "<strong>$1</strong>"
                    )}
            </div>


            ${sources}


            <details class="trace">

                <summary>
                    View agent trace / ${data.trace.length} stages
                </summary>

                ${trace}

            </details>
        `;


        $("conversation").appendChild(agentCard);

        runs++;

        $("message").value = "";

        $("conversation").scrollIntoView({
            behavior: "smooth",
            block: "end"
        });


    } catch (error) {

        const errorCard = document.createElement("div");

        errorCard.className = "message-card";

        errorCard.innerHTML = `
            <div class="message-body">
                Could not reach the assistant:
                ${escapeHtml(error.message)}
            </div>
        `;

        $("conversation").appendChild(errorCard);

    } finally {

        send.disabled = false;

        send.innerHTML = `
            <span>Run assistant</span>
            <span class="send-arrow">↑</span>
        `;

    }

});


async function loadOperations() {

    try {

        const metricsResponse =
            await fetch("/api/metrics");

        const metrics =
            await metricsResponse.json();


        const cards = [
            [
                "Total runs",
                metrics.total_runs,
                "Requests handled"
            ],
            [
                "Pending approvals",
                metrics.pending_approvals,
                "Awaiting human review"
            ],
            [
                "Safety blocks",
                metrics.safety_blocks,
                "Protected workflows"
            ],
            [
                "Avg. duration",
                `${metrics.avg_duration_ms} ms`,
                "In-process approximation"
            ]
        ];


        $("metrics").innerHTML =
            cards.map((card) => `

                <div class="metric">

                    <div class="metric-label">
                        ${card[0]}
                    </div>

                    <div class="metric-value">
                        ${card[1]}
                    </div>

                    <div class="metric-note">
                        ${card[2]}
                    </div>

                </div>

            `).join("");


        $("recent-list").innerHTML =
            metrics.recent_runs?.length
                ? metrics.recent_runs.map((run) => `

                    <div class="run-row">

                        <div>

                            <strong>
                                ${escapeHtml(run.intent)}
                            </strong>

                            <small>
                                ${escapeHtml(
                                    run.request_id.slice(0, 8)
                                )}
                                /
                                ${new Date(
                                    run.created_at
                                ).toLocaleTimeString()}
                            </small>

                        </div>

                        <div class="right">

                            ${escapeHtml(run.duration_ms)} ms

                            <small>
                                ${escapeHtml(run.category)}
                            </small>

                        </div>

                    </div>

                `).join("")
                : `
                    <div class="empty">
                        No runs yet.
                    </div>
                `;


        const approvalResponse =
            await fetch("/api/approvals");

        const approvalData =
            await approvalResponse.json();

        const approvals =
            approvalData.items || [];


        $("approval-list").innerHTML =
            approvals.length
                ? approvals.map((approval) => `

                    <article class="approval-card">

                        <div class="approval-top">

                            <div>

                                <h3>
                                    ${escapeHtml(
                                        approval.action
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        approval.request
                                    )}
                                </p>

                            </div>

                            <span class="status ${escapeHtml(
                                approval.status
                            )}">
                                ${escapeHtml(
                                    approval.status
                                )}
                            </span>

                        </div>

                        <div class="approval-meta">
                            Request
                            ${escapeHtml(approval.id)}
                            /
                            ${new Date(
                                approval.created_at
                            ).toLocaleString()}
                        </div>

                        ${
                            approval.status === "pending"
                                ? `
                                    <div class="approval-actions">

                                        <button
                                            class="approve"
                                            data-id="${escapeHtml(
                                                approval.id
                                            )}"
                                            data-decision="approve"
                                        >
                                            Approve
                                        </button>

                                        <button
                                            class="reject"
                                            data-id="${escapeHtml(
                                                approval.id
                                            )}"
                                            data-decision="reject"
                                        >
                                            Reject
                                        </button>

                                    </div>
                                `
                                : `
                                    <div class="approval-meta">
                                        Resolved by
                                        ${escapeHtml(
                                            approval.approver || "approver"
                                        )}
                                        ${
                                            approval.decision_rationale
                                                ? ` / ${escapeHtml(
                                                    approval.decision_rationale
                                                )}`
                                                : ""
                                        }
                                    </div>
                                `
                        }

                    </article>

                `).join("")
                : `
                    <div class="empty">
                        No approval requests yet.
                    </div>
                `;


        document
            .querySelectorAll("[data-decision]")
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    () => resolveApproval(
                        button.dataset.id,
                        button.dataset.decision
                    )
                );

            });


        const auditResponse =
            await fetch("/api/audit?limit=12");

        const auditData =
            await auditResponse.json();

        const audit =
            auditData.items || [];


        $("audit-list").innerHTML =
            audit.length
                ? audit.map((event) => `

                    <div class="audit-row">

                        <div>

                            <strong>
                                ${escapeHtml(
                                    event.event.replaceAll(
                                        "_",
                                        " "
                                    )
                                )}
                            </strong>

                            <small>
                                Request
                                ${escapeHtml(
                                    (event.request_id || "")
                                        .slice(0, 8)
                                )}
                                /
                                ${escapeHtml(
                                    event.stage ||
                                    event.decision ||
                                    event.status ||
                                    ""
                                )}
                            </small>

                        </div>

                        <small>
                            ${new Date(
                                event.timestamp
                            ).toLocaleTimeString()}
                        </small>

                    </div>

                `).join("")
                : `
                    <div class="empty">
                        No audit events yet.
                    </div>
                `;

    } catch (error) {

        $("metrics").innerHTML = `
            <div class="empty">
                Could not load operations data.
            </div>
        `;

        console.error(error);

    }

}


async function resolveApproval(id, decision) {

    const rationale = prompt(
        `Optional rationale for ${decision}:`,
        "Reviewed in capstone demo"
    );

    if (rationale === null) {
        return;
    }


    try {

        const response = await fetch(
            `/api/approvals/${encodeURIComponent(id)}/decision`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    decision,
                    approver: "demo.approver",
                    rationale
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {
            throw new Error(
                data.detail || "Could not record decision."
            );
        }


        await loadOperations();

        alert(data.notice || "Decision recorded.");

    } catch (error) {

        alert(
            `Could not record decision: ${error.message}`
        );

    }

}


$("refresh").addEventListener(
    "click",
    loadOperations
);


fetch("/api/health")
    .then((response) => response.json())
    .then((data) => {

        if (data.status !== "ok") {
            throw new Error("Backend unhealthy");
        }

    })
    .catch((error) => {

        console.warn(
            "Backend health check failed:",
            error
        );

    });