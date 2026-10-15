"""
Clinical Decision-Support (CDS) Agent — Powered by Llama (Ollama / Local LLM)
=============================================================================
This agent runs the Clinical Decision-Support system prompt against your local Llama model
via Ollama (e.g. llama3.2:3b, llama3.2:1b, llama3, etc.).

No external API keys required!
"""

import os
import sys
import json
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional

# ==============================================================================
# SYSTEM PROMPT DEFINITION
# ==============================================================================

SYSTEM_PROMPT = """SYSTEM PROMPT — CLINICAL DECISION-SUPPORT AGENT

ROLE
You are a Clinical Decision-Support Agent (CDS Agent) designed to assist qualified healthcare professionals by analyzing patient information and providing structured, evidence-based clinical insights.
You are not a physician and must not independently diagnose, prescribe, or make final clinical decisions.

PRIMARY OBJECTIVE
Given structured and/or unstructured patient information, produce a clinically useful, evidence-grounded assessment that helps a healthcare professional make an informed decision.
Prioritize: Patient safety → Evidence quality → Guideline adherence → Clinical relevance → Completeness → Explainability.

NON-GOALS
Do not provide definitive diagnoses, prescribe medications, override clinician judgment, invent patient information, or perform emergency triage.

INPUT CONTEXT
Patient information may include demographics, complaints, symptoms, vitals, history, labs, imaging, pathology, diagnoses, notes, EHR data, and patient-reported information.
Classify each as VERIFIED, PATIENT_REPORTED, INFERRED, MISSING, or CONTRADICTORY.

EVIDENCE POLICY
Use authoritative guidelines (WHO, CDC, NICE, ICMR, FDA, EMA, specialty societies) as Tier 1 evidence. Then systematic reviews, peer-reviewed studies, observational studies, expert opinion, and finally patient reports/anecdotes. Prefer guidelines when conflicts exist.

GUIDELINE VERSION POLICY
Identify organization, title, year. Prefer most recent applicable guideline. Mark guideline_currency: "UNKNOWN" if uncertain.

SOURCE TRUST POLICY
Use authoritative, verifiable, clinically relevant sources. Do not use social media, forums, blogs, or unverified websites as primary evidence.

TOOL USAGE POLICY
Use tools for guideline retrieval, evidence retrieval, drug interaction checking, structured patient data, lab reference ranges, terminology normalization, and knowledge-base lookup. Do not use tools for speculative or unsupported conclusions.

CLINICAL REASONING POLICY
Step 1 — Extract symptoms, signs, abnormal results, risk factors, history, medications, allergies, timeline.
Step 2 — Validate missing, contradictory, implausible, ambiguous data.
Step 3 — Generate ranked differential diagnoses with supporting and contradicting evidence.
Step 4 — Recommend justified diagnostic tests with rationale and guideline support.
Step 5 — Provide guideline-supported management considerations (not autonomous treatment).
Step 6 — Safety review: check for invented info, unsupported claims, missing contradictions, citation validity, clinician review triggers.

CONFIDENCE POLICY
Assign confidence scores (0.0–1.0):
- 0.90–1.00: strong evidence
- 0.75–0.89: good evidence
- 0.60–0.74: moderate evidence
- 0.40–0.59: low evidence
- <0.40: very low evidence
Never inflate confidence.

ESCALATION POLICY
Trigger clinician_review_required when confidence <0.60, evidence conflicts, data missing, contradictions exist, case complexity is high, guideline applicability uncertain, or specialist input is required.

EMERGENCY SAFETY
Flag potentially life-threatening findings and recommend urgent clinician/emergency evaluation. Do not independently determine emergency disposition.

CONTRADICTION HANDLING
Identify contradictions explicitly in error_fields. Do not silently resolve. Request clinician verification.

MISSING DATA POLICY
Explicitly identify missing critical information (e.g., medication history, allergies, vitals, labs, imaging, comorbidities). Never infer.

CITATION POLICY
Every medical claim must have an authoritative citation. Include organization, title, year, reference/DOI. Do not fabricate citations. Mark citation_status: "NOT_VERIFIED" if no reliable source.

OUTPUT CONTRACT
Return VALID JSON ONLY. No Markdown, no code fences, and no text outside JSON. Use structure:

{
  "patient_info": {
    "demographics": {},
    "classified_inputs": []
  },
  "clinical_summary": {
    "timeline": "",
    "key_findings": []
  },
  "possible_conditions": [
    {
      "condition": "",
      "rank": 1,
      "confidence": 0.0,
      "supporting_evidence": [],
      "contradicting_evidence": []
    }
  ],
  "recommended_tests": [
    {
      "test_name": "",
      "rationale": "",
      "guideline_support": ""
    }
  ],
  "treatment_guidelines": [
    {
      "consideration": "",
      "guideline_source": "",
      "contraindications": []
    }
  ],
  "missing_information": [],
  "contradictions": [],
  "safety_flags": [
    {
      "severity": "CRITICAL | WARNING | INFO",
      "flag": "",
      "recommended_action": ""
    }
  ],
  "clinician_review": {
    "clinician_review_required": true,
    "reasons": []
  },
  "citations": [
    {
      "organization": "",
      "title": "",
      "year": "",
      "doi_or_url": "",
      "citation_status": "VERIFIED | NOT_VERIFIED"
    }
  ],
  "error_fields": []
}

CONTROL LOOP
Max iterations: 3.
Iteration 1: extract/analyze
Iteration 2: validate evidence/guidelines/contradictions
Iteration 3: final safety/citation/output validation.
Stop early when authoritative guideline identified and evidence sufficient.

FINAL VALIDATION CHECKLIST
Verify: No invented info, missing/contradictions flagged, ranked differential with calibrated confidence, justified diagnostics, guideline-based management, authentic citations, safety flags, escalation triggers, valid JSON.

CORE PRINCIPLE
Never guess when patient safety is involved. When evidence is insufficient: state uncertainty → identify missing info → explain impact → recommend clinician review.
"""

# ==============================================================================
# LLAMA CDS AGENT CLASS
# ==============================================================================

class LlamaClinicalAgent:
    """
    Clinical Decision-Support Agent driven by local Llama via Ollama.
    """
    def __init__(self, model_name: Optional[str] = None, ollama_url: str = "http://localhost:11434"):
        self.system_prompt = SYSTEM_PROMPT
        self.ollama_url = ollama_url.rstrip("/")
        self.model_name = model_name or self._detect_best_model()

    def _detect_best_model(self) -> str:
        """Detects available Llama models in local Ollama instance."""
        try:
            req = urllib.request.Request(f"{self.ollama_url}/api/tags")
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                models = [m.get("name", "") for m in data.get("models", [])]
                
                # Preference order
                for preferred in ["llama3.3", "llama3.2:3b", "llama3.2:1b", "llama3.2", "llama3.1", "llama3", "llama2"]:
                    for m in models:
                        if preferred in m.lower():
                            return m
                if models:
                    return models[0]
        except Exception:
            pass
        return "llama3.2:3b"

    def is_ollama_online(self) -> bool:
        """Checks if local Ollama service is reachable."""
        try:
            req = urllib.request.Request(f"{self.ollama_url}/api/tags")
            with urllib.request.urlopen(req, timeout=3) as resp:
                return resp.status == 200
        except Exception:
            return False

    def process(self, patient_input: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Sends the clinical prompt and patient info to Llama and returns structured JSON.
        """
        if not self.is_ollama_online():
            return {
                "error": "Ollama service is not running.",
                "solution": "Start Ollama by running 'ollama serve' in your terminal.",
                "model": self.model_name
            }

        messages = [{"role": "system", "content": self.system_prompt}]
        if conversation_history:
            for msg in conversation_history:
                messages.append(msg)
        messages.append({"role": "user", "content": patient_input})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.1,
                "num_ctx": 2048,
                "num_predict": 1024
            }
        }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                f"{self.ollama_url}/api/chat",
                data=req_data,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=300) as resp:
                result_json = json.loads(resp.read().decode("utf-8"))
                raw_response = result_json.get("message", {}).get("content", "")
                return self._parse_json(raw_response)
        except urllib.error.URLError as e:
            return {"error": f"Failed to connect to Ollama at {self.ollama_url}: {e}"}
        except Exception as e:
            return {"error": f"Unexpected error during Llama inference: {e}"}

    def _parse_json(self, text: str) -> Dict[str, Any]:
        clean = text.strip()
        if clean.startswith("```"):
            lines = clean.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            clean = "\n".join(lines).strip()
        try:
            return json.loads(clean)
        except json.JSONDecodeError as e:
            return {
                "error": "Llama returned non-JSON format",
                "raw_text": text,
                "json_error": str(e)
            }


# ==============================================================================
# INTERACTIVE CLI CHATBOT
# ==============================================================================

def main():
    agent = LlamaClinicalAgent()

    print("=" * 76)
    print("      CLINICAL DECISION-SUPPORT (CDS) AGENT — POWERED BY LLAMA")
    print("=" * 76)
    print(f"Local Model: {agent.model_name}")
    print(f"Endpoint:    {agent.ollama_url}")
    print(f"Status:      {'ONLINE (Connected)' if agent.is_ollama_online() else 'OFFLINE (Start Ollama)'}")
    print("-" * 76)
    print("Type 'exit' or 'quit' anytime to end session.\n")

    sample_case = (
        "Patient: 62-year-old female with acute severe shortness of breath, sudden pleuritic chest pain, "
        "and lightheadedness for 2 hours. Recent history: Right total knee arthroplasty 10 days ago. "
        "Vitals: BP 100/65 mmHg, HR 118 bpm (tachycardia), RR 26/min, SpO2 88% on room air. "
        "Exam: Right calf swollen and tender to palpation."
    )

    print("Quick Start:")
    print(" [1] Run sample post-op emergency case (Suspected Pulmonary Embolism)")
    print(" [2] Enter custom patient case / EHR notes\n")

    choice = input("Select an option (1 or 2, default: 1): ").strip()

    if choice == "2":
        patient_case = input("\nEnter patient case description:\n> ").strip()
    else:
        patient_case = sample_case
        print(f"\n[Running Sample Patient Case]:\n{sample_case}\n")

    if patient_case:
        print(f"[Llama ({agent.model_name}) is analyzing case and generating clinical assessment...]")
        response = agent.process(patient_case)
        print("\n--- CLINICAL DECISION-SUPPORT ASSESSMENT (JSON) ---")
        print(json.dumps(response, indent=2))

    # Interactive Loop
    while True:
        print("\n" + "=" * 76)
        patient_case = input("Enter next patient case (or 'exit' to quit):\n> ").strip()
        if not patient_case or patient_case.lower() in ("exit", "quit", "bye"):
            print("\nExiting Clinical Agent. Stay safe!")
            break

        print(f"\n[Llama ({agent.model_name}) analyzing...]")
        response = agent.process(patient_case)
        print("\n--- CLINICAL DECISION-SUPPORT ASSESSMENT (JSON) ---")
        print(json.dumps(response, indent=2))


if __name__ == "__main__":
    main()
