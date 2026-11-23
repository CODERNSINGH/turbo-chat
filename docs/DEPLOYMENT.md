# Deployment (Render)

- Build command: `npm install`
- Start command: `npm run server`
- Environment variables: `DATABASE_URL`, optionally `PORT` and `RENDER_EXTERNAL_URL`

## Why the server pinged itself

Render free services sleep after about 15 minutes with no traffic. The server calls its own `/health` every 14 minutes to stay awake. If your URL is not the default, set `RENDER_EXTERNAL_URL` (Render usually sets it for you).

## Redeploying

Pushing to `main` redeploys if auto-deploy is on. A redeploy restarts the server and clears the in-memory rooms, so connected users must join again.
