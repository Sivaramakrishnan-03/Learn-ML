"""Run every Python snippet of the guide. Usage: node <bundled dump-snippets.js> | python verify_snippets.py"""
import json, sys, io, contextlib, traceback, warnings
warnings.filterwarnings("ignore")
snips = json.load(sys.stdin); bad = 0
for s in snips:
    out = io.StringIO()
    try:
        with contextlib.redirect_stdout(out):
            exec(s["code"], {"AD_CSV": s["AD_CSV"], "__name__": "__main__"})
        print(f"OK  {s['key']:15s} {s['title']}")
        if "-v" in sys.argv: print(out.getvalue())
    except Exception:
        bad += 1; print(f"BAD {s['key']:15s} {s['title']}"); traceback.print_exc()
sys.exit(1 if bad else 0)
