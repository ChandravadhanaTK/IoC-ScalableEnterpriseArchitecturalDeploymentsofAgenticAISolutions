/**
 * NexusAI — Agentic Customer Support Assistant
 * Main Application JavaScript
 *
 * Architecture:
 *  - AgentCore: state machine driving agent workflow
 *  - ToolOrchestrator: simulates Gemini function-calling tool use
 *  - GeminiClient: calls real Gemini API or falls back to demo mode
 *  - UIController: manages all DOM interactions
 *  - SessionTracker: real-time session stats
 */

'use strict';

/* ============================================================
   CONFIGURATION
   ============================================================ */
const CONFIG = {
  // generateContent REST API — supports browser CORS (unlike Interactions API)
  geminiApiBase: 'https://generativelanguage.googleapis.com/v1beta/models',
  defaultModel: 'gemini-3.6-flash',
  demoMode: true,
  apiKey: null,
  maxHistory: 20,
  typingDelayMs: 800,
  toolExecDelayMs: 1200,
};

/* ============================================================
   AGENT SYSTEM PROMPT
   ============================================================ */
const SYSTEM_PROMPT = `You are NexusAI, an enterprise-grade agentic customer support assistant for an e-commerce platform.

## Your Capabilities
You can use the following tools to help customers:
1. **order_lookup(order_id)** — retrieve order status, tracking, and delivery details
2. **create_ticket(issue_type, description, priority)** — create a support ticket in the CRM
3. **search_knowledge_base(query)** — search the help center for FAQs and policy information
4. **escalate_to_human(reason, urgency)** — escalate complex issues to a human agent

## Workflow States
You operate through these states:
- **Greeting**: Welcome and understand the customer's name/account
- **Understanding**: Classify the issue (order, billing, account, product, policy)
- **Resolving**: Use appropriate tools to resolve the issue
- **Follow-Up**: Confirm resolution and check customer satisfaction
- **Escalation**: Hand off to human when AI cannot resolve

## Behavior Rules
- Always be empathetic, professional, and concise
- Use tools proactively — do not ask for info you can look up
- Always confirm after using a tool: "I've looked up your order and found..."
- If the issue requires human judgment (complex refund disputes, legal matters, angry customers), escalate
- Format responses clearly using paragraphs; use **bold** for key info
- Confidence: rate your resolution confidence as HIGH/MEDIUM/LOW in your thinking
- Keep responses under 150 words unless explaining policy

## Response Format
When you invoke a tool, say: "Let me [action]..." then present results.
Always end resolved interactions with: "Is there anything else I can help you with today?"`;

/* ============================================================
   DEMO RESPONSES (used when no API key is configured)
   ============================================================ */
const DEMO_FLOWS = {
  order: {
    tool: 'order_lookup',
    toolInput: { order_id: 'ORD-2847' },
    toolResult: {
      order_id: 'ORD-2847',
      status: 'In Transit',
      carrier: 'FedEx',
      tracking: 'FX-7291847362',
      estimated_delivery: 'Oct 4, 2026',
      items: ['Wireless Headphones (x1)', 'USB-C Cable (x2)'],
      last_update: 'Departed Memphis hub, 2h ago',
    },
    response: `Let me look up order **#ORD-2847** for you right now.\n\nGreat news! Your order is currently **In Transit** with FedEx. Here are the details:\n\n📦 **Items:** Wireless Headphones (x1), USB-C Cable (x2)\n🚚 **Carrier:** FedEx · Tracking: \`FX-7291847362\`\n📅 **Estimated Delivery:** October 4, 2026\n📍 **Last Update:** Departed Memphis hub 2 hours ago\n\nYour package is on its way and should arrive on time. Is there anything else I can help you with today?`,
  },
  refund: {
    tool: 'create_ticket',
    toolInput: { issue_type: 'refund_damaged_item', description: 'Customer received damaged product, requesting replacement or full refund.', priority: 'HIGH' },
    toolResult: { ticket_id: 'TKT-58291', status: 'Created', sla: '24 hours', assigned_to: 'Returns Team' },
    response: `I'm really sorry to hear your product arrived damaged — that's definitely not the experience we want for you!\n\nI've created a priority support ticket for your case:\n\n🎫 **Ticket ID:** \`TKT-58291\`\n⚡ **Priority:** High · Assigned to Returns Team\n⏱️ **SLA:** Resolution within **24 hours**\n\nOur returns team will contact you via email within the hour with instructions to either **send back the damaged item** for a full replacement or process a **full refund** — whichever you prefer. You'll also receive a prepaid return label.\n\nIs there anything else I can help you with today?`,
  },
  account: {
    tool: 'search_knowledge_base',
    toolInput: { query: 'cannot login account password reset not working' },
    toolResult: {
      articles: [
        { title: 'Password Reset Not Working', relevance: 0.97, solution: 'Clear browser cache, check spam folder for reset email, ensure using same email as account.' },
        { title: 'Account Locked After Failed Attempts', relevance: 0.82, solution: 'After 5 failed attempts, account is locked for 30 minutes.' },
      ],
    },
    response: `I've searched our knowledge base for your login issue. Here's what I found:\n\n🔐 **Most Common Cause:** The password reset email sometimes lands in the **spam/junk folder**. Please check there first!\n\n**Quick fixes to try:**\n1. Clear your browser cache & cookies, then try again\n2. Check spam/junk for the reset email\n3. Make sure you're using the email address registered with your account\n4. If your account is locked after failed attempts, wait **30 minutes** and try again\n\nIf none of these work, I can escalate this to our account security team who can manually verify and unlock your account.\n\nWould you like me to escalate, or would you prefer to try these steps first?`,
  },
  policy: {
    tool: 'search_knowledge_base',
    toolInput: { query: 'return policy timeline process' },
    toolResult: {
      articles: [
        { title: 'Return Policy', relevance: 0.99, policy: '30-day return window, items must be unused and in original packaging. Refunds processed in 5-7 business days.' },
      ],
    },
    response: `I've found our return policy information for you!\n\n📋 **Return Policy Summary:**\n\n✅ **Return Window:** 30 days from delivery date\n📦 **Condition:** Items must be unused, in original packaging\n💰 **Refund Timeline:** 5–7 business days after we receive the item\n🚚 **Free Returns:** Yes, we provide a prepaid return label\n💳 **Refund Method:** Original payment method\n\n**To start a return:**\n1. Go to My Orders → Select Order → "Return Item"\n2. Print the prepaid label that appears\n3. Drop it at any FedEx location\n\nIs there anything else I can help you with today?`,
  },
  cancel: {
    tool: 'create_ticket',
    toolInput: { issue_type: 'subscription_cancellation', description: 'Customer requesting subscription cancellation.', priority: 'MEDIUM' },
    toolResult: { ticket_id: 'TKT-58299', status: 'Created', next_step: 'Retention team will call within 2 hours' },
    response: `I can help you with cancelling your subscription. Before I process that, I'd like to make sure you're getting the best experience.\n\nI've flagged your account for our **Retention Team** (Ticket \`TKT-58299\`) — they may have a special offer or solution that addresses the reason you're considering cancelling.\n\nYou'll receive a call within **2 hours**. If you'd prefer to proceed with immediate cancellation without speaking to them, just let me know and I'll escalate to finalize it right away.\n\nWould you like to wait for their call, or proceed with immediate cancellation?`,
  },
  billing: {
    tool: 'escalate_to_human',
    toolInput: { reason: 'Duplicate charge detected — requires payment team investigation and refund processing', urgency: 'HIGH' },
    toolResult: { escalation_id: 'ESC-1042', human_agent: 'Sarah M. (Billing Specialist)', wait_time: '< 3 minutes', channel: 'Live Chat' },
    response: null, // escalation has special handling
    escalation: true,
  },
};

function getIntentKey(text) {
  const lower = text.toLowerCase();
  if (/order|track|deliver|ship|where.*package|hasn't.*arriv/.test(lower)) return 'order';
  if (/damage|broken|refund|replacement|return|defect/.test(lower)) return 'refund';
  if (/login|log in|sign in|password|account|can't.*access/.test(lower)) return 'account';
  if (/policy|return policy|how.*return|timeline/.test(lower)) return 'policy';
  if (/cancel|cancell|subscription|unsubscribe/.test(lower)) return 'cancel';
  if (/charge|billing|payment|paid.*twice|duplicate|overcharg/.test(lower)) return 'billing';
  return null;
}

/* ============================================================
   AGENT STATE MACHINE
   ============================================================ */
const AgentWorkflow = {
  states: ['greeting', 'understanding', 'resolving', 'followup', 'escalation'],
  current: 'greeting',
  history: [],

  transition(newState) {
    if (!this.states.includes(newState)) return;
    this.history.push(this.current);
    this.current = newState;
    UIController.updateWorkflowUI(newState);
  },

  reset() {
    this.current = 'greeting';
    this.history = [];
    UIController.updateWorkflowUI('greeting');
  },
};

/* ============================================================
   SESSION TRACKER
   ============================================================ */
const SessionTracker = {
  startTime: null,
  messageCount: 0,
  toolCallCount: 0,
  confidenceScores: [],
  timerInterval: null,

  start() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  },

  addMessage() {
    this.messageCount++;
    document.getElementById('msgCount').textContent = this.messageCount;
  },

  addToolCall() {
    this.toolCallCount++;
    document.getElementById('toolCalls').textContent = this.toolCallCount;
  },

  setConfidence(level) {
    const el = document.getElementById('confScore');
    const colors = { HIGH: '#34d399', MEDIUM: '#fbbf24', LOW: '#fb7185' };
    el.textContent = level;
    el.style.webkitTextFillColor = colors[level] || '#a78bfa';
  },

  updateTimer() {
    if (!this.startTime) return;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    document.getElementById('sessionTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  reset() {
    clearInterval(this.timerInterval);
    this.startTime = null;
    this.messageCount = 0;
    this.toolCallCount = 0;
    this.confidenceScores = [];
    document.getElementById('msgCount').textContent = '0';
    document.getElementById('toolCalls').textContent = '0';
    document.getElementById('sessionTime').textContent = '0:00';
    document.getElementById('confScore').textContent = '—';
    document.getElementById('confScore').style.webkitTextFillColor = '';
    this.start();
  },
};

/* ============================================================
   TOOL ORCHESTRATOR
   ============================================================ */
const ToolOrchestrator = {
  async run(toolName, toolInput, toolResult) {
    // Activate tool badge
    this.setToolBadge(toolName, 'Running', 'running');
    UIController.showToolActivity(`Executing: ${toolName}(${JSON.stringify(toolInput).substring(0, 60)}...)`);
    SessionTracker.addToolCall();

    await sleep(CONFIG.toolExecDelayMs);

    this.setToolBadge(toolName, 'Done', 'done');
    UIController.hideToolActivity();

    return toolResult;
  },

  toolNameToId(toolName) {
    const map = {
      order_lookup: 'tool-order-lookup',
      create_ticket: 'tool-ticket-create',
      search_knowledge_base: 'tool-knowledge-base',
      escalate_to_human: 'tool-escalate',
    };
    return map[toolName];
  },

  setToolBadge(toolName, label, state) {
    const toolId = this.toolNameToId(toolName);
    const badgeId = 'badge-' + toolId.replace('tool-', '');

    const toolEl = document.getElementById(toolId);
    const badgeEl = document.getElementById(badgeId);

    if (toolEl) {
      toolEl.classList.toggle('active', state === 'running');
    }
    if (badgeEl) {
      badgeEl.textContent = label;
      badgeEl.className = 'tool-badge' + (state !== 'ready' ? ' ' + state : '');
    }

    if (state === 'done') {
      setTimeout(() => {
        if (toolEl) toolEl.classList.remove('active');
        if (badgeEl) {
          badgeEl.textContent = 'Ready';
          badgeEl.className = 'tool-badge';
        }
      }, 3000);
    }
  },
};

/* ============================================================
   GEMINI API CLIENT
   ============================================================ */
const GeminiClient = {
  conversationHistory: [],

  async sendMessage(userMessage) {
    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    if (CONFIG.demoMode || !CONFIG.apiKey) {
      return this.demoResponse(userMessage);
    }

    return this.realApiCall(userMessage);
  },

  /**
   * Real Gemini API call.
   * Strategy: detect intent → run tool simulation → inject tool result
   * into the prompt so Gemini produces a rich, grounded response.
   */
  async realApiCall(userMessage) {
    const model = CONFIG.model || CONFIG.defaultModel;
    const url = `${CONFIG.geminiApiBase}/${model}:generateContent?key=${CONFIG.apiKey}`;

    // ── Step 1: detect intent and run tool if applicable ──────────────────
    const intentKey = getIntentKey(userMessage);
    const flow = intentKey ? DEMO_FLOWS[intentKey] : null;

    let toolUsed = null;
    let toolInput = null;
    let toolResult = null;
    let isEscalation = false;

    if (flow) {
      toolResult = await ToolOrchestrator.run(flow.tool, flow.toolInput, flow.toolResult);
      toolUsed   = flow.tool;
      toolInput  = flow.toolInput;
      isEscalation = !!flow.escalation;

      if (flow.tool === 'escalate_to_human') {
        AgentWorkflow.transition('escalation');
      } else {
        AgentWorkflow.transition('resolving');
      }
    }

    // Escalation path — no need to call Gemini, use built-in banner
    if (isEscalation) {
      SessionTracker.setConfidence('HIGH');
      return { type: 'escalation', toolUsed, toolInput, toolResult, content: null };
    }

    // ── Step 2: build a grounded prompt injecting the tool result ──────────
    let groundedUserTurn = userMessage;
    if (toolResult) {
      groundedUserTurn =
        `${userMessage}\n\n` +
        `[TOOL EXECUTED: ${toolUsed}]\n` +
        `[TOOL RESULT]: ${JSON.stringify(toolResult, null, 2)}\n\n` +
        `Using ONLY the tool result above, write a helpful, warm, and detailed support response to the customer. ` +
        `Use **bold** for key values. Do NOT say "I will look up" — the data is already retrieved. ` +
        `End with "Is there anything else I can help you with today?"`;
    }

    // Replace last user turn in history with the grounded version
    const historyWithTool = [
      ...this.conversationHistory.slice(0, -1),
      { role: 'user', parts: [{ text: groundedUserTurn }] },
    ];

    // ── Step 3: call Gemini ────────────────────────────────────────────────
    const body = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: historyWithTool.slice(-CONFIG.maxHistory),
      generationConfig: {
        temperature: 0.75,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'I encountered an issue. Please try again.';

      this.conversationHistory.push({ role: 'model', parts: [{ text }] });

      if (flow) {
        AgentWorkflow.transition('followup');
        SessionTracker.setConfidence('HIGH');
      } else {
        AgentWorkflow.transition('understanding');
        SessionTracker.setConfidence('MEDIUM');
      }

      return { type: 'text', content: text, toolUsed, toolInput, toolResult };

    } catch (err) {
      console.error('Gemini API error:', err);
      UIController.showToast(`API Error: ${err.message}`, 'error');
      CONFIG.demoMode = true;
      // Graceful fallback to demo
      return this.demoResponse(userMessage);
    }
  },

  async demoResponse(userMessage) {
    const intentKey = getIntentKey(userMessage);
    const flow = intentKey ? DEMO_FLOWS[intentKey] : null;

    if (flow) {
      const toolResult = await ToolOrchestrator.run(flow.tool, flow.toolInput, flow.toolResult);

      if (flow.tool === 'escalate_to_human') {
        AgentWorkflow.transition('escalation');
      } else {
        AgentWorkflow.transition('resolving');
      }

      if (flow.escalation) {
        return { type: 'escalation', toolUsed: flow.tool, toolInput: flow.toolInput, toolResult, content: null };
      }

      AgentWorkflow.transition('followup');
      SessionTracker.setConfidence('HIGH');

      this.conversationHistory.push({ role: 'model', parts: [{ text: flow.response }] });

      return { type: 'text', toolUsed: flow.tool, toolInput: flow.toolInput, toolResult, content: flow.response };
    }

    // Generic fallback
    AgentWorkflow.transition('understanding');
    SessionTracker.setConfidence('MEDIUM');

    const generic = `Thank you for reaching out! I want to make sure I fully understand your issue so I can help you as effectively as possible.\n\nCould you provide a bit more detail? For example:\n- Your **order number** (if order-related)\n- Your **account email**\n- A brief description of what happened\n\nWith those details, I'll be able to look everything up and get this sorted for you quickly!`;

    this.conversationHistory.push({ role: 'model', parts: [{ text: generic }] });

    return { type: 'text', content: generic, toolUsed: null };
  },

  reset() {
    this.conversationHistory = [];
    this.lastInteractionId = null;
  },
};



/* ============================================================
   UI CONTROLLER
   ============================================================ */
const UIController = {
  messagesContainer: null,
  messageInput: null,
  sendBtn: null,
  welcomeScreen: null,
  isProcessing: false,

  init() {
    this.messagesContainer = document.getElementById('messagesContainer');
    this.messageInput = document.getElementById('messageInput');
    this.sendBtn = document.getElementById('sendBtn');
    this.welcomeScreen = document.getElementById('welcomeScreen');
  },

  appendMessage(role, content, toolData = null) {
    // Remove welcome screen
    if (this.welcomeScreen && this.welcomeScreen.parentNode) {
      this.welcomeScreen.style.animation = 'fadeInUp 0.3s ease reverse';
      setTimeout(() => this.welcomeScreen?.remove(), 300);
      this.welcomeScreen = null;
    }

    const msg = document.createElement('div');
    msg.className = `message ${role}`;
    msg.setAttribute('aria-label', `${role === 'user' ? 'You' : 'NexusAI'} said`);

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.innerHTML = role === 'user' ? '👤' : '🤖';

    const msgContent = document.createElement('div');
    msgContent.className = 'msg-content';

    // Tool use card (if tool was used)
    if (toolData) {
      const toolCard = document.createElement('div');
      toolCard.className = 'tool-use-card';
      toolCard.innerHTML = `
        <div class="tool-use-header">
          ⚡ Tool Used: ${toolData.toolName}
        </div>
        <div class="tool-use-body">${JSON.stringify(toolData.result, null, 2)}</div>
      `;
      msgContent.appendChild(toolCard);
    }

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = this.formatText(content);

    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgContent.appendChild(bubble);
    msgContent.appendChild(time);

    msg.appendChild(avatar);
    msg.appendChild(msgContent);

    this.messagesContainer.appendChild(msg);
    this.scrollToBottom();

    return msg;
  },

  appendEscalationMessage(toolResult) {
    if (this.welcomeScreen && this.welcomeScreen.parentNode) {
      this.welcomeScreen.remove();
      this.welcomeScreen = null;
    }

    const msg = document.createElement('div');
    msg.className = 'message agent';

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.innerHTML = '🤖';

    const msgContent = document.createElement('div');
    msgContent.className = 'msg-content';

    const toolCard = document.createElement('div');
    toolCard.className = 'tool-use-card';
    toolCard.innerHTML = `
      <div class="tool-use-header">⚡ Tool Used: escalate_to_human</div>
      <div class="tool-use-body">${JSON.stringify(toolResult, null, 2)}</div>
    `;

    const banner = document.createElement('div');
    banner.className = 'escalation-banner';
    banner.innerHTML = `
      🚨 <div>
        <strong>Escalating to Human Specialist</strong><br/>
        I've detected this billing issue requires manual investigation by our payment team. A specialist has been assigned:<br/><br/>
        👤 <strong>${toolResult.human_agent}</strong> · Escalation ID: <code>${toolResult.escalation_id}</code><br/>
        ⏱️ Estimated wait: <strong>${toolResult.wait_time}</strong> via ${toolResult.channel}<br/><br/>
        Your case has been flagged as <strong>HIGH PRIORITY</strong>. The specialist can see your entire conversation history and will resolve the duplicate charge within 24 hours. You'll also receive a confirmation email.
      </div>
    `;

    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgContent.appendChild(toolCard);
    msgContent.appendChild(banner);
    msgContent.appendChild(time);
    msg.appendChild(avatar);
    msg.appendChild(msgContent);

    this.messagesContainer.appendChild(msg);
    this.scrollToBottom();

    // Update agent status
    document.getElementById('statusDot').className = 'status-dot escalated';
    document.getElementById('statusValue').textContent = 'Escalated';
    SessionTracker.setConfidence('HIGH');
  },

  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message agent';
    indicator.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.innerHTML = '🤖';

    const content = document.createElement('div');
    content.className = 'msg-content';

    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;

    content.appendChild(typing);
    indicator.appendChild(avatar);
    indicator.appendChild(content);
    this.messagesContainer.appendChild(indicator);
    this.scrollToBottom();

    return indicator;
  },

  removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
  },

  showToolActivity(text) {
    const activity = document.getElementById('toolActivity');
    const inner = document.getElementById('toolActivityInner');
    inner.innerHTML = `<div class="tool-spinner"></div><span>${text}</span>`;
    activity.classList.add('visible');
  },

  hideToolActivity() {
    const activity = document.getElementById('toolActivity');
    activity.classList.remove('visible');
  },

  updateWorkflowUI(activeStep) {
    const steps = document.querySelectorAll('.wf-step');
    const stateOrder = ['greeting', 'understanding', 'resolving', 'followup', 'escalation'];
    const activeIdx = stateOrder.indexOf(activeStep);

    steps.forEach((step, i) => {
      step.classList.remove('active', 'completed');
      if (i === activeIdx) step.classList.add('active');
      else if (i < activeIdx && activeStep !== 'escalation') step.classList.add('completed');
    });

    // Update status
    const statusMap = {
      greeting: { text: 'Greeting', color: 'idle' },
      understanding: { text: 'Analyzing...', color: 'thinking' },
      resolving: { text: 'Resolving', color: 'thinking' },
      followup: { text: 'Following Up', color: 'idle' },
      escalation: { text: 'Escalated', color: 'escalated' },
    };

    const s = statusMap[activeStep];
    if (s) {
      document.getElementById('statusValue').textContent = s.text;
      document.getElementById('statusDot').className = `status-dot ${s.color === 'idle' ? '' : s.color}`;
    }
  },

  setProcessing(val) {
    this.isProcessing = val;
    this.sendBtn.disabled = val || !this.messageInput.value.trim();
    this.messageInput.disabled = val;

    if (val) {
      document.getElementById('statusDot').className = 'status-dot thinking';
      document.getElementById('statusValue').textContent = 'Processing...';
      document.getElementById('agentDesc').textContent = 'Thinking...';
    } else {
      document.getElementById('agentDesc').textContent = 'Powered by Gemini · Multi-tool orchestration enabled';
    }
  },

  formatText(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>');
  },

  scrollToBottom() {
    requestAnimationFrame(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    });
  },

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.borderColor = type === 'error' ? 'rgba(251, 113, 133, 0.4)' :
      type === 'success' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(167, 139, 250, 0.25)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  },

  clearChat() {
    this.messagesContainer.innerHTML = '';
    GeminiClient.reset();
    AgentWorkflow.reset();
    SessionTracker.reset();

    // Re-add welcome screen
    const ws = document.createElement('div');
    ws.className = 'welcome-screen';
    ws.id = 'welcomeScreen';
    ws.innerHTML = `
      <div class="welcome-icon" aria-hidden="true">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="url(#wg1)" stroke-width="2" opacity="0.6"/>
          <rect x="18" y="22" width="28" height="20" rx="5" stroke="url(#wg2)" stroke-width="2"/>
          <circle cx="26" cy="32" r="2.5" fill="#a78bfa"/>
          <circle cx="38" cy="32" r="2.5" fill="#38bdf8"/>
          <path d="M20 18h24" stroke="url(#wg1)" stroke-width="2" stroke-linecap="round"/>
          <defs>
            <linearGradient id="wg1" x1="0" y1="0" x2="64" y2="64">
              <stop stop-color="#a78bfa"/><stop offset="1" stop-color="#38bdf8"/>
            </linearGradient>
            <linearGradient id="wg2" x1="0" y1="0" x2="64" y2="64">
              <stop stop-color="#a78bfa"/><stop offset="1" stop-color="#38bdf8"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h2 class="welcome-title">New Conversation</h2>
      <p class="welcome-sub">Start a new conversation or pick a quick prompt below.</p>
      <div class="quick-prompts" role="list">
        <button class="quick-prompt" data-prompt="Where is my order #ORD-2847? It's been 5 days and I haven't received it yet.">📦 Track my order</button>
        <button class="quick-prompt" data-prompt="I received a damaged product and I need a replacement or refund as soon as possible.">🔄 Request a refund</button>
        <button class="quick-prompt" data-prompt="I can't log into my account. It says my password is incorrect but I just reset it.">🔐 Account login issue</button>
        <button class="quick-prompt" data-prompt="What is your return policy and how long does it take to process a return?">📋 Return policy</button>
        <button class="quick-prompt" data-prompt="I want to cancel my subscription. Can you help me with that?">❌ Cancel subscription</button>
        <button class="quick-prompt" data-prompt="My payment was charged twice for the same order. I need help getting a refund for the duplicate charge.">💳 Billing problem</button>
      </div>
    `;

    this.messagesContainer.appendChild(ws);
    this.welcomeScreen = ws;
    attachQuickPromptListeners();
    this.showToast('Conversation cleared', 'success');
  },
};

/* ============================================================
   CORE MESSAGE HANDLER
   ============================================================ */
async function handleSendMessage(text) {
  const message = text.trim();
  if (!message || UIController.isProcessing) return;

  // Start session if first message
  if (SessionTracker.messageCount === 0) {
    SessionTracker.start();
  }

  // Show user message
  UIController.appendMessage('user', message);
  SessionTracker.addMessage();

  // Transition to understanding
  AgentWorkflow.transition('understanding');
  UIController.setProcessing(true);

  // Clear input
  UIController.messageInput.value = '';
  UIController.messageInput.style.height = 'auto';
  document.getElementById('charCount').textContent = '0 / 2000';
  UIController.sendBtn.disabled = true;

  // Show typing indicator
  await sleep(CONFIG.typingDelayMs / 2);
  UIController.showTypingIndicator();

  // Get response from Gemini/demo
  await sleep(CONFIG.typingDelayMs);
  const response = await GeminiClient.sendMessage(message);
  SessionTracker.addMessage();

  // Remove typing
  UIController.removeTypingIndicator();

  // Render response
  if (response.type === 'escalation') {
    UIController.appendEscalationMessage(response.toolResult);
  } else {
    const toolData = response.toolUsed ? {
      toolName: response.toolUsed,
      result: response.toolResult,
    } : null;

    UIController.appendMessage('agent', response.content, toolData);
  }

  UIController.setProcessing(false);
}

/* ============================================================
   UTILITY
   ============================================================ */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function attachQuickPromptListeners() {
  document.querySelectorAll('.quick-prompt').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-prompt');
      if (prompt) handleSendMessage(prompt);
    });
  });
}

function exportConversation() {
  const messages = [];
  document.querySelectorAll('.message').forEach(msg => {
    const role = msg.classList.contains('user') ? 'User' : 'NexusAI';
    const bubble = msg.querySelector('.msg-bubble');
    const time = msg.querySelector('.msg-time');
    if (bubble && time) {
      messages.push(`[${time.textContent}] ${role}: ${bubble.innerText}`);
    }
  });

  if (messages.length === 0) {
    UIController.showToast('No messages to export');
    return;
  }

  const text = `NexusAI Support Conversation\nExported: ${new Date().toLocaleString()}\n\n` + messages.join('\n\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `nexusai-conversation-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
  UIController.showToast('Conversation exported!', 'success');
}

/* ============================================================
   CONFIG MODAL
   ============================================================ */
function openConfigModal() {
  document.getElementById('configModal').style.display = 'flex';
}

function closeConfigModal() {
  document.getElementById('configModal').style.display = 'none';
}

/* ============================================================
   INITIALIZATION
   ============================================================ */
function init() {
  UIController.init();

  // Check for saved API key
  const savedKey = localStorage.getItem('nexusai_key');
  let savedModel = localStorage.getItem('nexusai_model');

  // Migrate deprecated model names to current gemini-3.6-flash
  const DEPRECATED_MODELS = [
    'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash',
    'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-1.5-pro-latest',
    'gemini-2.5-flash', 'gemini-2.5-pro',
  ];
  if (savedModel && DEPRECATED_MODELS.includes(savedModel)) {
    savedModel = 'gemini-3.6-flash';
    localStorage.setItem('nexusai_model', savedModel);
  }

  if (savedKey) {
    CONFIG.apiKey = savedKey;
    CONFIG.demoMode = false;
    CONFIG.model = savedModel || CONFIG.defaultModel;
    document.getElementById('apiKeyInput').value = savedKey;
    document.getElementById('modelSelect').value = CONFIG.model;
    document.getElementById('agentDesc').textContent =
      `Powered by ${CONFIG.model} · Multi-tool orchestration enabled`;
  }

  // Show config modal on first visit if no key
  if (!savedKey) {
    setTimeout(() => openConfigModal(), 1200);
  }

  // ===== EVENT LISTENERS =====

  // Send button
  document.getElementById('sendBtn').addEventListener('click', () => {
    handleSendMessage(UIController.messageInput.value);
  });

  // Input events
  UIController.messageInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 140) + 'px';
    const len = this.value.length;
    document.getElementById('charCount').textContent = `${len} / 2000`;
    document.getElementById('sendBtn').disabled = len === 0 || UIController.isProcessing;
  });

  UIController.messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(this.value);
    }
  });

  // Quick prompts
  attachQuickPromptListeners();

  // Clear chat
  document.getElementById('clearChatBtn').addEventListener('click', () => UIController.clearChat());

  // Export
  document.getElementById('exportBtn').addEventListener('click', exportConversation);

  // Mobile sidebar toggle
  const sidebar = document.getElementById('sidebar');
  document.getElementById('mobileMenuBtn').addEventListener('click', function () {
    const isOpen = sidebar.classList.toggle('open');
    this.setAttribute('aria-expanded', isOpen.toString());
  });

  // Close sidebar on outside click (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && e.target !== document.getElementById('mobileMenuBtn')) {
        sidebar.classList.remove('open');
        document.getElementById('mobileMenuBtn').setAttribute('aria-expanded', 'false');
      }
    }
  });

  // Config modal
  document.getElementById('modalClose').addEventListener('click', closeConfigModal);
  document.getElementById('useDemoMode').addEventListener('click', () => {
    CONFIG.demoMode = true;
    CONFIG.apiKey = null;
    closeConfigModal();
    UIController.showToast('Running in Demo Mode — no API key needed', 'success');
  });

  document.getElementById('saveConfig').addEventListener('click', () => {
    const key = document.getElementById('apiKeyInput').value.trim();
    const model = document.getElementById('modelSelect').value;
    if (!key) {
      UIController.showToast('Please enter a valid API key', 'error');
      return;
    }
    CONFIG.apiKey = key;
    CONFIG.model = model;
    CONFIG.demoMode = false;
    localStorage.setItem('nexusai_key', key);
    localStorage.setItem('nexusai_model', model);
    closeConfigModal();
    UIController.showToast(`Connected to ${model}!`, 'success');
    document.getElementById('agentDesc').textContent = `Powered by ${model} · Multi-tool orchestration enabled`;
  });

  document.getElementById('configModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeConfigModal();
  });

  // Focus input
  UIController.messageInput.focus();

  console.log('%cNexusAI Initialized', 'color: #a78bfa; font-weight: bold; font-size: 14px;');
  console.log('%cAgentic Customer Support Agent v1.0', 'color: #38bdf8;');
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', init);
