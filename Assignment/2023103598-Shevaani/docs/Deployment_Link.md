# Deployment_Link.md

# Live Application

## Application URL

**Live Application:** https://ai-architecture-reviewer.vercel.app/

The AI Architecture Reviewer is deployed and accessible through the live Vercel application above.

## Deployment Platform

**Frontend:** Vercel

**Live URL:** https://ai-architecture-reviewer.vercel.app/

## Application Overview

The deployed application provides:

- Python repository analysis
- ZIP repository upload
- Public GitHub repository analysis
- Static code analysis
- Code smell detection
- Dependency analysis
- Inferred architecture visualization
- SOLID analysis
- Security and performance heuristics
- Gemini AI-assisted review
- Analysis performance metrics
- Generated analysis reports

## Environment Configuration

Sensitive configuration is supplied through deployment environment variables.

```text
GEMINI_API_KEY=<configured-secret>
GEMINI_MODEL=<configured-model>
```

The actual API key must never be included in this documentation or committed to the repository.

## Pre-Submission Checklist

- [x] Frontend is publicly accessible
- [x] Live application URL is available
- [ ] Backend API production URL documented separately
- [ ] Gemini API key configured securely
- [ ] `.env` excluded from source control
- [ ] ZIP upload tested
- [ ] Public GitHub analysis tested
- [ ] Findings page tested
- [ ] Architecture page tested
- [ ] AI Review tested
- [ ] Performance metrics tested
- [ ] Error handling tested
