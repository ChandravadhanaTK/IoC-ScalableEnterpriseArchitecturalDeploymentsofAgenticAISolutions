import argparse
import os
import sys
from dotenv import load_dotenv

# Load .env from project root so GEMINI_API_KEY is available
dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from agents import store
from agents.config import Config
from agents.mbox_importer import import_mbox


def main(argv=None):
    ap = argparse.ArgumentParser(description="Phase 1: fetch email threads")
    ap.add_argument("--source", choices=["gmail", "mbox"], default="gmail")
    ap.add_argument("--mbox", default=None, help="path to Takeout .mbox")
    ap.add_argument("--query", default="", help="Gmail search query")
    ap.add_argument("--credentials", default="credentials.json")
    ap.add_argument("--token", default="token.json")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--evidence-dir", default=None)
    args = ap.parse_args(argv)

    cfg = Config.load(args.config)
    paths = {}
    if args.evidence_dir:
        # Build paths under the evidence directory
        for k, v in store.DEFAULT_PATHS.items():
            # DEFAULT_PATHS uses forward slashes; normalize for OS
            parts = v.replace("\\", "/").split("/")
            rel = os.path.sep.join(parts[1:])  # skip leading ""
            paths[k] = os.path.join(args.evidence_dir, rel)
    else:
        paths = dict(store.DEFAULT_PATHS)

    if args.source == "mbox":
        if not args.mbox:
            ap.error("--source mbox requires --mbox PATH")
        threads = import_mbox(args.mbox)
        added = store.save_threads(threads, paths["emailstore"])
        store_path = paths["emailstore"]
        print(f"saved {added} new thread(s); store now has {len(store.load_threads(store_path))} threads")
    else:
        from agents import gmail_client
        creds = gmail_client.build_credentials(args.credentials, args.token)
        service = gmail_client.build_service(creds)
        added = 0
        batch_seen = 0
        print(f"fetching Gmail threads (query={args.query!r})...")
        for page_no, batch, total_estimate in gmail_client.iter_fetch_threads(
            service, query=args.query, own_addresses=cfg.own_addresses
        ):
            batch_seen += len(batch)
            added += store.save_threads(batch, paths["emailstore"])
            print(
                f"  page {page_no}: fetched {batch_seen} thread(s)"
                f" (total estimate {total_estimate}); saved so far {added}"
            )
        store_path = paths["emailstore"]
        print(f"done: saved {added} new thread(s); store now has {len(store.load_threads(store_path))} threads")


if __name__ == "__main__":
    main()