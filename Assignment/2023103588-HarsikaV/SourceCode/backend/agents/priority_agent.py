from __future__ import annotations


class PriorityAgent:
    SAFETY_WORDS = ["fire", "smoke", "sparks", "electric", "gas", "danger", "hazard"]
    INFRASTRUCTURE_WORDS = ["collapse", "broken wall", "door jam", "ceiling", "roof", "structural"]
    ACADEMIC_WORDS = ["exam", "class", "lab", "lecture", "assessment", "seminar", "midterm"]
    URGENT_WORDS = ["urgent", "immediate", "down", "outage", "not working", "critical"]

    def analyze(self, description: str, category: str | None = None, affected_people: int = 1) -> dict:
        text = (description or "").lower()
        score = 0
        reasons: list[str] = []

        if any(word in text for word in self.SAFETY_WORDS):
            score += 4
            reasons.append("safety hazard")
        if any(word in text for word in self.INFRASTRUCTURE_WORDS):
            score += 3
            reasons.append("infrastructure damage")
        if any(word in text for word in self.ACADEMIC_WORDS):
            score += 2
            reasons.append("academic disruption")
        if any(word in text for word in self.URGENT_WORDS):
            score += 2
            reasons.append("urgency")
        if affected_people > 10:
            score += 3
        elif affected_people > 3:
            score += 2
        elif affected_people > 1:
            score += 1

        if score >= 7:
            priority = "Critical"
        elif score >= 5:
            priority = "High"
        elif score >= 3:
            priority = "Medium"
        else:
            priority = "Low"

        confidence = min(0.97, 0.5 + (score / 12))
        reasoning = ", ".join(reasons) if reasons else "General maintenance impact and user reports were considered."
        return {
            "priority": priority,
            "confidence": round(confidence, 2),
            "reasoning": f"Priority was set to {priority} based on {reasoning}.",
        }
