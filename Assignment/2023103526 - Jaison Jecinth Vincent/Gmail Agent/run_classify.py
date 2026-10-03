import subprocess, sys, json, os, time

cl_path = r'E:\Gmail Agent\evidence\state\classifications.json'
cand_path = r'E:\Gmail Agent\evidence\state\candidates.json'

print("Running phase3_multi.py with qwen first...")
proc = subprocess.Popen(
    [sys.executable, 'phase3_multi.py', '--evidence-dir', 'evidence/', '--models', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'],
    cwd=r'E:\Gmail Agent',
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

try:
    stdout, stderr = proc.communicate(timeout=300)
    print("STDOUT:", stdout[:1000] if stdout else "empty")
    print("STDERR:", stderr[:1000] if stderr else "empty")
except subprocess.TimeoutExpired:
    proc.kill()
    stdout, stderr = proc.communicate()
    print("TIMED OUT after 300s")
    print("STDOUT:", stdout[:500] if stdout else "empty")
    print("STDERR:", stderr[:500] if stderr else "empty")

# Check state after
if os.path.exists(cl_path):
    cl_after = json.load(open(cl_path, encoding='utf-8'))
    classified_after = len(cl_after)
else:
    classified_after = "file not found"

if os.path.exists(cand_path):
    total_after = len(json.load(open(cand_path, encoding='utf-8')))
else:
    total_after = "file not found"

remaining_after = total_after - classified_after if isinstance(total_after, int) else "unknown"

print(f"After: {classified_after} classified / {total_after} total, {remaining_after} remaining")