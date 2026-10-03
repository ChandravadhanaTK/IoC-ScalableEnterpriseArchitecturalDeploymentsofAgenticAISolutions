KNOWLEDGE = [
    {
        "title": "Company Wi-Fi",
        "keywords": ["wifi", "wi-fi", "wireless", "network"],
        "content": (
            "Open the network settings, select the corporate Wi-Fi SSID, "
            "sign in with your company credentials, and accept the device "
            "security prompt. If authentication fails repeatedly, create an IT ticket."
        ),
    },
    {
        "title": "VPN",
        "keywords": ["vpn", "remote", "tunnel"],
        "content": (
            "Open the approved company VPN client, sign in using SSO, "
            "select the corporate gateway and connect. Do not install unapproved VPN software."
        ),
    },
    {
        "title": "Password Policy",
        "keywords": ["password", "credential", "reset"],
        "content": (
            "Use the official account recovery process. IT support password resets "
            "are controlled actions and may require approval."
        ),
    },
]


def search_knowledge(query: str):
    q = query.lower()
    results = []
    for item in KNOWLEDGE:
        score = sum(1 for k in item["keywords"] if k in q)
        if score:
            results.append((score, item))
    results.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in results[:3]]
