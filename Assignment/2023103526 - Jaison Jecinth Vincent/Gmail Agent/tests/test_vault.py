from web.vault import SessionVault


def test_set_get_and_wipe_removes_key_and_temps(tmp_path):
    v = SessionVault()
    assert v.has_key() is False
    v.set_api_key("sk-test-123")
    assert v.has_key() is True
    assert v.get_api_key() == "sk-test-123"
    p = tmp_path / "up.mbox"
    p.write_bytes(b"mbox-bytes")
    v.register_temp(str(p))
    deleted = v.wipe()
    assert v.has_key() is False
    assert v.get_api_key() is None
    assert str(p) in deleted
    assert p.exists() is False


def test_wipe_is_idempotent():
    v = SessionVault()
    assert v.wipe() == []
    v.set_api_key("x")
    v.wipe()
    assert v.wipe() == []


class _SessionState(dict):
    def __getattr__(self, name):
        try:
            return self[name]
        except KeyError:
            raise AttributeError(name)

    def __setattr__(self, name, value):
        self[name] = value

    def __delattr__(self, name):
        try:
            del self[name]
        except KeyError:
            raise AttributeError(name)


def test_app_module_imports_without_side_effects():
    import importlib.util
    import sys
    from unittest.mock import MagicMock
    stub = MagicMock(name="streamlit")
    stub.session_state = _SessionState()
    stub.columns.return_value = [MagicMock(), MagicMock()]
    stub.tabs.return_value = [MagicMock(), MagicMock(), MagicMock()]
    stub.file_uploader.return_value = None
    stub.button.return_value = False

    def _store(key, value):
        if key is not None and key not in stub.session_state:
            stub.session_state[key] = value
        return value

    def _text_input(label="", value="", *a, **k):
        return _store(k.get("key"), k.get("value", value))

    def _slider(label="", *a, **k):
        default = k.get("value", a[2] if len(a) >= 3 else 0.0)
        return _store(k.get("key"), default)

    def _selectbox(label="", options=(), *a, **k):
        idx = k.get("index", 0)
        default = list(options)[idx] if options else None
        return _store(k.get("key"), default)

    def _number_input(label="", *a, **k):
        default = k.get("value", a[2] if len(a) >= 3 else 0.0)
        return _store(k.get("key"), default)

    def _text_area(label="", value="", *a, **k):
        return _store(k.get("key"), k.get("value", value))

    stub.text_input.side_effect = _text_input
    stub.slider.side_effect = _slider
    stub.selectbox.side_effect = _selectbox
    stub.number_input.side_effect = _number_input
    stub.text_area.side_effect = _text_area
    sys.modules["streamlit"] = stub
    try:
        spec = importlib.util.spec_from_file_location("webapp", "web/app.py")
        assert spec is not None
        assert spec.loader is not None
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        assert "vault" in stub.session_state
        assert "rules" in stub.session_state
        assert "threads" in stub.session_state
    finally:
        sys.modules.pop("streamlit", None)
        sys.modules.pop("webapp", None)
