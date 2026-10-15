import os
import sys
import pathlib

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from phase1_fetch import main
from agents import store
from email.message import EmailMessage
import mailbox


def test_main_mbox_writes_store(tmp_path, capsys):
    mpath = tmp_path / "in.mbox"
    box = mailbox.mbox(str(mpath))
    m = EmailMessage()
    m["Subject"] = "Sponsorship"
    m["Message-ID"] = "<m1@x>"
    m["From"] = "rahul@abctech.com"
    m["Date"] = "Mon, 02 Sep 2024 10:00:00 +0000"
    m.set_content("We are happy to sponsor.")
    box.add(m)
    box.close()

    store_path = tmp_path / "evidence" / "raw" / "emailstore.jsonl"
    main(["--source", "mbox", "--mbox", str(mpath),
          "--evidence-dir", str(tmp_path / "evidence")])
    out = capsys.readouterr().out
    assert "saved 1 new thread" in out
    threads = store.load_threads(store_path)
    assert len(threads) == 1
    assert threads[0].subject == "Sponsorship"