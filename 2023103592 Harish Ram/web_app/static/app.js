/* Trip Planner Agent - local web UI logic (no external dependencies) */

(function () {
  "use strict";

  const form = document.getElementById("trip-form");
  const planBtn = document.getElementById("plan-btn");
  const formError = document.getElementById("form-error");
  const interestsWrap = document.getElementById("interests");
  const transportSelect = document.getElementById("transportation");
  const paceSelect = document.getElementById("pace");

  const emptyState = document.getElementById("empty-state");
  const loading = document.getElementById("loading");
  const results = document.getElementById("results");
  const resultsTitle = document.getElementById("results-title");
  const summaryEl = document.getElementById("summary");
  const timelineEl = document.getElementById("timeline");
  const alternativesWrap = document.getElementById("alternatives-wrap");
  const alternativesEl = document.getElementById("alternatives");

  let lastMarkdown = "";

  /* ---------- helpers ---------- */
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function money(n) {
    return "$" + Number(n || 0).toFixed(2);
  }

  function prettyLabel(value) {
    return String(value || "").replace(/_/g, " ");
  }

  function defaultDate() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }

  /* ---------- meta / form setup ---------- */
  function buildInterests(list) {
    interestsWrap.innerHTML = "";
    const preselected = ["museum", "restaurant", "park", "landmark"];
    list.forEach(function (value) {
      const label = document.createElement("label");
      label.className = "chip";
      const checked = preselected.indexOf(value) !== -1 ? "checked" : "";
      if (checked) label.classList.add("active");
      label.innerHTML =
        '<input type="checkbox" value="' + esc(value) + '" ' + checked + " />" +
        esc(value);
      const box = label.querySelector("input");
      box.addEventListener("change", function () {
        label.classList.toggle("active", box.checked);
      });
      interestsWrap.appendChild(label);
    });
  }

  function fillSelect(select, list) {
    select.innerHTML = "";
    list.forEach(function (value) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = value.replace(/_/g, " ");
      select.appendChild(opt);
    });
  }

  async function loadMeta() {
    try {
      const res = await fetch("/api/meta");
      const meta = await res.json();
      buildInterests(meta.interests || []);
      fillSelect(transportSelect, meta.transportation || []);
      fillSelect(paceSelect, meta.paces || []);
      paceSelect.value = "moderate";
    } catch (err) {
      buildInterests(["museum", "restaurant", "park", "landmark"]);
      fillSelect(transportSelect, ["walking", "driving", "public_transit", "rideshare", "bicycling"]);
      fillSelect(paceSelect, ["relaxed", "moderate", "packed"]);
      paceSelect.value = "moderate";
    }
  }

  /* ---------- rendering ---------- */
  function renderSummary(data) {
    const pct = data.budget > 0 ? (data.total_cost / data.budget) * 100 : 0;
    const budgetClass = data.total_cost > data.budget ? "over" : "ok";
    const stats = [
      { label: "Activities", value: data.total_activities, cls: "" },
      { label: "Total cost", value: money(data.total_cost), cls: budgetClass },
      { label: "Budget used", value: pct.toFixed(0) + "%", cls: budgetClass },
      { label: "Avg rating", value: "⭐ " + Number(data.average_rating).toFixed(2), cls: "" }
    ];
    summaryEl.innerHTML = stats.map(function (s) {
      return '<div class="stat"><div class="value ' + s.cls + '">' +
        esc(s.value) + '</div><div class="label">' + esc(s.label) + "</div></div>";
    }).join("");
  }

  function renderTimeline(items) {
    if (!items.length) {
      timelineEl.innerHTML = '<p class="item-desc">No activities were scheduled.</p>';
      return;
    }
    timelineEl.innerHTML = items.map(function (it) {
      let html = '<div class="item">';
      html += '<div class="item-head">';
      html += '<h3 class="item-title">' + it.index + ". " + esc(it.name) + "</h3>";
      html += '<div class="item-time">' + esc(it.time) + " – " + esc(it.end_time) + "</div>";
      html += "</div>";
      html += '<div class="item-meta">';
      html += '<span class="tag">' + esc(prettyLabel(it.category)) + "</span>";
      html += '<span class="tag cost">' + money(it.cost) + "</span>";
      html += '<span class="tag rating">⭐ ' + Number(it.rating).toFixed(1) + "</span>";
      html += '<span class="tag">' + it.duration_minutes + " min</span>";
      html += "</div>";
      html += '<p class="item-desc">' + esc(it.description) + "</p>";
      if (it.travel_time_to_next > 0) {
        html += '<div class="travel">🚶 Travel to next: ' +
          it.travel_time_to_next + " min via " + esc(prettyLabel(it.travel_mode)) + "</div>";
      }
      html += "</div>";
      return html;
    }).join("");
  }

  function renderAlternatives(alts) {
    if (!alts || !alts.length) {
      alternativesWrap.hidden = true;
      return;
    }
    alternativesWrap.hidden = false;
    alternativesEl.innerHTML = alts.map(function (a) {
      return '<div class="alt">' + esc(a.name) +
        ' <span>· ' + esc(prettyLabel(a.category)) + " · " + money(a.cost) +
        " · ⭐ " + Number(a.rating).toFixed(1) + "</span></div>";
    }).join("");
  }

  function showResults(data) {
    lastMarkdown = data.markdown || "";
    resultsTitle.textContent = "Itinerary for " + data.location;
    renderSummary(data);
    renderTimeline(data.items || []);
    renderAlternatives(data.alternatives || []);
    emptyState.hidden = true;
    loading.hidden = true;
    results.hidden = false;
  }

  /* ---------- actions ---------- */
  function collectPreferences() {
    const interests = Array.prototype.slice
      .call(interestsWrap.querySelectorAll("input:checked"))
      .map(function (el) { return el.value; });

    return {
      location: document.getElementById("location").value,
      start_date: document.getElementById("start_date").value,
      duration_days: Number(document.getElementById("duration_days").value),
      budget: Number(document.getElementById("budget").value),
      party_size: Number(document.getElementById("party_size").value),
      start_time: document.getElementById("start_time").value,
      end_time: document.getElementById("end_time").value,
      transportation: transportSelect.value,
      pace: paceSelect.value,
      interests: interests
    };
  }

  async function onSubmit(event) {
    event.preventDefault();
    formError.hidden = true;

    const payload = collectPreferences();
    if (!payload.location.trim()) {
      formError.textContent = "Please enter a destination.";
      formError.hidden = false;
      return;
    }
    if (!payload.interests.length) {
      formError.textContent = "Please select at least one interest.";
      formError.hidden = false;
      return;
    }

    planBtn.disabled = true;
    emptyState.hidden = true;
    results.hidden = true;
    loading.hidden = false;

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }
      showResults(data);
    } catch (err) {
      loading.hidden = true;
      emptyState.hidden = false;
      formError.textContent = err.message || String(err);
      formError.hidden = false;
    } finally {
      planBtn.disabled = false;
    }
  }

  function initExports() {
    document.getElementById("copy-btn").addEventListener("click", async function () {
      if (!lastMarkdown) return;
      try {
        await navigator.clipboard.writeText(lastMarkdown);
        this.textContent = "Copied!";
        setTimeout(() => { this.textContent = "Copy Markdown"; }, 1500);
      } catch (e) {
        window.prompt("Copy your itinerary:", lastMarkdown);
      }
    });

    document.getElementById("download-btn").addEventListener("click", function () {
      if (!lastMarkdown) return;
      const blob = new Blob([lastMarkdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "itinerary.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    document.getElementById("print-btn").addEventListener("click", function () {
      window.print();
    });
  }

  /* ---------- init ---------- */
  document.getElementById("start_date").value = defaultDate();
  form.addEventListener("submit", onSubmit);
  initExports();
  loadMeta();
})();