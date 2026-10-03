"""Run the real Streamlit UI against offline fakes:  streamlit run tests/run_demo_app.py"""
import runpy
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fakes import SRC, install_fakes  # noqa: E402

install_fakes(Path(tempfile.gettempdir()) / "rp_demo_data")
runpy.run_path(str(SRC / "app.py"), run_name="__main__")
