import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fakes import install_fakes  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _fakes(tmp_path_factory):
    install_fakes(tmp_path_factory.mktemp("rp_data"))
