# Deploy ResolveAI for Submission

This project includes a Render Blueprint at the repository root. It builds the React interface and FastAPI service into **one public web service**, so the deployed application has a single URL and the browser calls the API on the same origin.

> Demo limitation: this build deliberately uses mock in-memory support records. Tickets and audit history reset whenever the service restarts or redeploys. It is suitable for a capstone demonstration, not for real customer data. The production architecture in `docs/deployment.md` describes the next step: replace the repository with PostgreSQL-backed persistence before any real use.

## Deploy on Render

1. Sign in to [Render](https://render.com/) with GitHub.
2. Open the Render Dashboard and select **New → Blueprint**.
3. Select the fork: `CodewSanthosh/IoC-ScalableEnterpriseArchitecturalDeploymentsofAgenticAISolutions`.
4. Choose the `main` branch. Render detects the root `render.yaml` file and displays one web service named `resolveai-2023103552-santhosh-k`.
5. Keep the generated `JWT_SECRET`; it is created by Render and must not be replaced with a value from `.env.example`.
6. Leave `GEMINI_API_KEY` empty for the deterministic demo, or add a key in Render’s Environment settings only if optional model enrichment is added later.
7. Click **Apply**. Wait for the deployment status to become **Live**.
8. Open the service URL shown by Render, ending in `.onrender.com`.
9. Run the acceptance check below, then copy that URL into your assignment submission or pull-request comment.

## Acceptance check

1. Sign in as `customer@resolveai.demo` with `DemoPass!23`.
2. Submit order `ORD-1001` with: “My laptop arrived with a damaged screen. I want a replacement.”
3. Confirm the ticket becomes `PENDING APPROVAL` and displays its workflow trace.
4. Sign out and sign in as `manager@resolveai.demo` with the same password.
5. Approve the pending replacement and confirm that it becomes `RESOLVED`.
6. Open `<your-service-url>/api/health`; it should return `status: ok`.

## Updating the deployment

After the first deployment, every push to the connected fork’s `main` branch triggers a new deployment. Check the Render **Events** tab for build logs and the **Logs** tab for runtime errors. If the service enters an error state, first confirm `/api/health`, then inspect the latest deploy log.

## Why this deployment shape

A single FastAPI service serves the Vite-built React files and `/api/*` routes. This avoids needing to manually coordinate a static-site URL, CORS list, and API URL. The database container in local Docker Compose remains useful for future persistence work, but is not required for the live deterministic demonstration.
