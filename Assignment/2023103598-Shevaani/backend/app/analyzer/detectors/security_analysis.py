"""Small AST-based checks for potentially risky source patterns."""
from __future__ import annotations

from app.analyzer.detectors.basic_smells import Finding
from app.analyzer.parser.python_parser import ParsedPythonFile


_RECOMMENDATIONS = {
    "hard_coded_credential_candidate": "Move secrets to a secret manager or environment-provided configuration and rotate exposed values.",
    "dynamic_code_execution": "Avoid evaluating untrusted strings; use a constrained parser or explicit dispatch instead.",
    "shell_command": "Avoid shell=True where possible; pass a structured argument list and validate untrusted values.",
    "deserialization_candidate": "Do not deserialize untrusted data with executable object formats; use a safe data-only format.",
    "weak_hash_candidate": "Use a modern cryptographic hash for integrity/security-sensitive operations; password storage needs a dedicated password hash.",
    "sql_string_concatenation": "Use parameterized SQL queries rather than concatenating query strings.",
}


def analyze_security(parsed_files: list[ParsedPythonFile]) -> list[Finding]:
    """Normalize parser-recorded risk indicators as potential findings."""
    findings: list[Finding] = []
    for parsed in sorted(parsed_files, key=lambda item: item.filename.casefold()):
        for indicator in parsed.security_indicators:
            findings.append(
                Finding(
                    id=f"SECURITY-{indicator.category}:{parsed.filename}:{indicator.line}",
                    type=f"Potential security risk: {indicator.category.replace('_', ' ')}",
                    file=parsed.filename,
                    line=indicator.line,
                    severity="medium",
                    evidence={"pattern": indicator.category, "description": indicator.evidence},
                    message=(
                        f"Static source pattern may indicate risk. {_RECOMMENDATIONS[indicator.category]} "
                        "Validate whether the value or input is attacker-controlled."
                    ),
                    detector="basic_ast_security_patterns",
                    status="potential",
                    confidence=0.55,
                    requires_validation=True,
                )
            )
    return findings
