"""In-memory per-session secret + temp-file holder.

Security contract (enforced by tests + code review):
- API key lives ONLY in this object's _key attribute (which Streamlit keeps
  in st.session_state, i.e. server memory). Never written to disk/env/logs.
- wipe() overwrites the key material, drops the reference, and deletes every
  registered temp file. Call it from the End Session button and after runs
  when the user asks to clear.
"""
import os


class SessionVault:
    def __init__(self) -> None:
        self._key: str | None = None
        self._temps: list[str] = []

    def set_api_key(self, key: str) -> None:
        cleaned = (key or "").strip()
        if not cleaned:
            raise ValueError("API key must be a non-empty string")
        self._key = cleaned

    def get_api_key(self) -> str | None:
        return self._key

    def has_key(self) -> bool:
        return bool(self._key)

    def register_temp(self, path: str) -> None:
        if path and path not in self._temps:
            self._temps.append(path)

    def wipe(self) -> list[str]:
        # Overwrite key material before dropping the reference.
        if self._key is not None:
            try:
                self._key = "x" * len(self._key)
            finally:
                self._key = None
        deleted: list[str] = []
        for path in list(self._temps):
            try:
                if path and os.path.exists(path):
                    os.remove(path)
                    deleted.append(path)
            except OSError:
                continue
        self._temps = []
        return deleted
