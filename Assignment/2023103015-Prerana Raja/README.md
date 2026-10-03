# HelpdeskAI – Secure Multi-Agent IT Service Desk

## Run locally
```bash
cd src
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Docs: http://localhost:8000/docs

## Try it
```bash
curl -X POST localhost:8000/chat -H "X-API-Key: employee-demo-key" \
  -H "Content-Type: application/json" -d '{"message":"How do I set up VPN?"}'

curl -X POST localhost:8000/chat -H "X-API-Key: employee-demo-key" \
  -H "Content-Type: application/json" -d '{"message":"I forgot my password"}'
# copy approval_id, then:
curl -X POST localhost:8000/approvals/<id>/decide -H "X-API-Key: admin-demo-key" \
  -H "Content-Type: application/json" -d '{"approve":true}'

curl localhost:8000/metrics -H "X-API-Key: admin-demo-key"
```

## Tests
```bash
cd src && pytest -q
```

## Docker
```bash
docker build -t helpdeskai src && docker run -p 8000:8000 -e ADMIN_KEY=change-me -e EMPLOYEE_KEY=change-me-too helpdeskai
```
Set `EMPLOYEE_KEY` / `ADMIN_KEY` via environment; the demo keys are for local use only.
