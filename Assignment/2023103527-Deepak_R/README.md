# AgroMitra — Agentic Crop Insurance Claims
Roll No: 2023103527 | Name: Deepak R

| File | Purpose |
|---|---|
| `01_PROMPT.md` | Prompt that generates this application |
| `02_DELIVERABLES.md` | Architecture, workflow, deployment, security, monitoring |
| `app/`, `tests/`, `k8s/`, `Dockerfile`, `docker-compose.yml` | Complete source code |

## Run
```bash
pip install -r requirements.txt
pytest -q
uvicorn app.main:app --reload      # dashboard: http://localhost:8000/
# or: docker compose up --build
```

## Try it
```bash
curl -X POST localhost:8000/api/claims -H "X-API-Key: key-submit" -H "Content-Type: application/json" \
 -d '{"farmer_id":"TN100001","crop":"Paddy","district":"Coimbatore","acres":2,"loss_percent":60,"cause":"drought","claim_amount":30000,"notes":"field photos"}'
```
Keys: `key-submit` (submitter), `key-officer` (officer), `key-admin` (admin).
Sample farmer IDs: TN100001–TN100004.
