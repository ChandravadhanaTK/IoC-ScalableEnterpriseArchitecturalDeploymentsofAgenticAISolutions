from __future__ import annotations


class ResolutionAgent:
    RESOLUTION_MAP = {
        "Network": [
            "Check the Wi-Fi access point and confirm power is on.",
            "Verify the router and switch status in the building.",
            "Restart the affected network equipment and test connectivity.",
        ],
        "Equipment": [
            "Inspect power and cable connections.",
            "Verify the input source or HDMI connection.",
            "Test with a working device before replacing the unit.",
        ],
        "Electrical": [
            "Isolate the affected circuit and inspect for burning or loose wiring.",
            "Check the breaker panel and reset tripped switches if safe.",
            "Escalate to the electrical team if there is visible damage or sparking.",
        ],
        "Plumbing": [
            "Shut off the water supply to the affected line.",
            "Check fixtures, valves, and visible leak points.",
            "Repair or replace damaged pipes and test for pressure issues.",
        ],
        "Cleaning": [
            "Remove debris and clean the affected area.",
            "Inspect for hidden waste or clogged drains.",
            "Perform a follow-up sweep for hygiene compliance.",
        ],
        "Infrastructure": [
            "Inspect the wall, door, window, or ceiling for structural damage.",
            "Secure loose parts and check for underlying damage.",
            "Schedule repair or replacement of damaged elements.",
        ],
    }

    def generate(self, description: str, category: str | None = None) -> dict:
        category_name = (category or "Other").title()
        steps = self.RESOLUTION_MAP.get(category_name, [
            "Inspect the issue area thoroughly.",
            "Confirm whether the fault is isolated or systemic.",
            "Apply the appropriate repair or replacement and verify functionality.",
        ])
        return {"resolution": steps, "category": category_name}
