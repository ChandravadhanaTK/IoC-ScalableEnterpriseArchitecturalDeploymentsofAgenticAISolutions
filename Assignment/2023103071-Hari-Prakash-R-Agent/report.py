import os
import sys
sys.path.insert(0, 'E:\\\\Gmail Agent')
import pandas as pd

out_dir = 'E:\\\\Gmail Agent\\\\crm_out'

print('=== ALL OUTPUT FILES ===')
for f in ['crm.csv', 'history.csv', 'review_sheet.xlsx', 'crm.xlsx', 'interested.csv', 'all_classified.csv']:
    p = os.path.join(out_dir, f)
    if os.path.exists(p):
        size = os.path.getsize(p)
        print(f'  {f}: EXISTS ({size} bytes)')
    else:
        # Legacy sponsorship-era alias
        legacy = {'crm.csv': 'sponsorship_crm.csv', 'history.csv': 'sponsorship_history.csv',
                  'crm.xlsx': 'sponsorship_crm.xlsx'}.get(f)
        lp = os.path.join(out_dir, legacy) if legacy else None
        if lp and os.path.exists(lp):
            print(f'  {f}: EXISTS via legacy {legacy} ({os.path.getsize(lp)} bytes)')
        else:
            print(f'  {f}: MISSING')

print()
def _read_csv_first(*names):
    for n in names:
        p = os.path.join(out_dir, n)
        if os.path.exists(p):
            return pd.read_csv(p), n
    raise FileNotFoundError(f"none of {names} found in {out_dir}")


crm, crm_name = _read_csv_first('crm.csv', 'sponsorship_crm.csv')
print(f'Matches ({crm_name}): {len(crm)}')
print(f'Thread IDs: {set(crm["thread_id"])}')
outs = crm['outcome'].value_counts()
print(f'Outcomes: {outs.to_dict()}')

print()
hist, hist_name = _read_csv_first('history.csv', 'sponsorship_history.csv')
print(f'History rows: {len(hist)}')
print(f'History columns: {list(hist.columns)}')
count_col = 'match_count' if 'match_count' in hist.columns else 'sponsorship_count'
print(hist[['company', 'company_normalized', count_col, 'first_year', 'last_year', 'latest_amount', 'latest_outcome']].to_string())