# NEXUS – Deployment Link

## Student Details
- **Name:** Kokila K E
- **Roll Number:** 2023103089
- **Project:** NEXUS – Multi-Agent AI Productivity Platform

## Local Application

The application has been successfully tested locally at:

**http://127.0.0.1:8000**

This is a local development URL and is accessible only from the computer running the FastAPI server.

## Run Locally

From the project directory:

```bash
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Then open:

```text
http://127.0.0.1:8000
```

## Health Check

The backend health endpoint is:

```text
http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "ok",
  "agents": 6
}
```

## Live Deployment

**Live deployment URL: Not deployed yet.**

After deploying the Docker container to a hosting platform such as Google Cloud Run, replace this line with the generated HTTPS service URL.

> Important: Do not submit `127.0.0.1` as a public live-demo URL. It works only on the local machine.
