# PlacementPilot Deployment

## Local development

```powershell
npm install
Copy-Item .env.example .env
npm run dev:full
```

Open the Vite URL shown by the terminal. The server reads `GEMINI_API_KEY`, `GEMINI_BASE_URL`, and `GEMINI_MODEL` from `.env`.

### Gemini configuration

Use:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_MODEL=gemini-3.5-flash-lite
```

The Gemini key is read by the server-side runtime only. Never add it to a `VITE_*` variable.

## Production deployment

1. Push the repository to GitHub.
2. Import the GitHub repository into Vercel.
3. Leave the detected Vite settings unchanged:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
4. Add `GEMINI_API_KEY` in **Settings → Environment Variables** for Production (and Preview if needed).
5. Optionally add `GEMINI_MODEL` and `GEMINI_BASE_URL`.
6. Redeploy after adding or changing environment variables.

Vercel automatically deploys the files in `api/` as serverless functions. The local
`server/index.ts` process is only for development and is not started by Vercel.

## Security checklist

- Never create `VITE_GEMINI_API_KEY`.
- Never commit `.env` or credentials.
- Keep the API key only in Vercel/server environment variables.
- Limit JSON body size.
- Reject empty or suspiciously short resume/job requests.
- Treat uploaded document text as untrusted prompt context.
- Validate structured AI output before returning it.

## Deployment topology

```text
GitHub
  ├── Vercel static frontend
  └── Vercel serverless API
           │
           └── Gemini API
```

## Health check

Production health endpoint:

```text
GET /api/health
```

Expected response:

```json
{"status":"ok","provider":"gemini","model":"gemini-3.5-flash-lite","apiKeyConfigured":true}
```

The production health response uses `"provider":"gemini"` and reports the configured
Gemini model.
