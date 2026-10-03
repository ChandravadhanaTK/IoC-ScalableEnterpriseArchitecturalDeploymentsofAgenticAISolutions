from __future__ import annotations

import re
from collections import defaultdict


class TriageAgent:
    CATEGORY_KEYWORDS = {
        "Network": ["wifi", "wi fi", "internet", "router", "network", "connection", "latency", "signal", "server"],
        "Equipment": ["projector", "computer", "speaker", "equipment", "printer", "laptop", "monitor", "keyboard"],
        "Plumbing": ["water", "tap", "pipe", "leak", "drain", "toilet", "sink", "flood"],
        "Electrical": ["fan", "light", "switch", "electric", "power", "socket", "tripped", "sparks", "wiring"],
        "Cleaning": ["clean", "garbage", "dust", "mold", "sanitation", "trash", "dirty"],
        "Infrastructure": ["building", "wall", "door", "window", "ceiling", "roof", "floor", "gate", "lock"],
    }

    def analyze(self, description: str, title: str | None = None) -> dict:
        raw_text = " ".join(filter(None, [title, description])).lower()
        text = re.sub(r"[-_]", " ", raw_text)
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        scores = defaultdict(int)
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                normalized_keyword = re.sub(r"[-_]", " ", keyword.lower())
                matches = len(re.findall(rf"\b{re.escape(normalized_keyword)}\b", text))
                if matches:
                    scores[category] += matches * 2

        if not scores:
            return {
                "category": "Other",
                "confidence": 0.35,
                "reasoning": "No clear category keyword matches were found. Defaulted to Other.",
                "analysis_source": "rule_based",
            }

        category = max(scores.items(), key=lambda item: item[1])[0]
        max_score = scores[category]
        confidence = min(0.95, 0.55 + (max_score / 12))
        return {
            "category": category,
            "confidence": round(confidence, 2),
            "reasoning": f"Matched keywords associated with {category} in the ticket text.",
            "analysis_source": "rule_based",
        }
