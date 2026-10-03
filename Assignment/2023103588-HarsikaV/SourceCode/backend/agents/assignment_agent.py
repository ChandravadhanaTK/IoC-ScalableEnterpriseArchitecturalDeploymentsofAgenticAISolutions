from __future__ import annotations


class AssignmentAgent:
    TEAM_MAP = {
        "Network": "IT Support",
        "Equipment": "Technical Support",
        "Electrical": "Electrical Team",
        "Plumbing": "Plumbing Team",
        "Cleaning": "Housekeeping",
        "Infrastructure": "Civil Maintenance",
        "Other": "General Support",
    }

    def assign(self, category: str) -> dict:
        team_name = self.TEAM_MAP.get((category or "Other").title(), "General Support")
        return {
            "team_name": team_name,
            "team_id": self._match_team_id(team_name),
            "reasoning": f"Category '{category}' maps to {team_name}.",
        }

    @staticmethod
    def _match_team_id(team_name: str) -> int | None:
        mapping = {
            "IT Support": 1,
            "Electrical Team": 2,
            "Plumbing Team": 3,
            "Housekeeping": 4,
            "Technical Support": 5,
            "Civil Maintenance": 6,
            "General Support": 1,
        }
        return mapping.get(team_name)
