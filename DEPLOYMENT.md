# Quizzy: Render + Neon

- Site: https://quizzy-ui-defense.onrender.com
- API: https://quizzy-api-defense.onrender.com
- Private source repository: https://github.com/Floratania/quizzy-defense
- API dashboard: https://dashboard.render.com/web/srv-dbaa4oajnfac73eunvmg
- UI dashboard: https://dashboard.render.com/static/srv-dbaa593ncjis73cpu980
- Neon project: https://console.neon.tech/app/projects/spring-dust-07269482

Both Render services use free plans. PostgreSQL is on Neon's Free plan in Frankfurt.
The API sleeps after inactivity. Open the site before the demonstration and run a
short practice game to check the server, database, and participant connection.

## Updating the deployed version

The `defense` Git remote points to the private deployment repository. The original
`origin` remote is preserved. Render builds the `main` branch of `defense`.

After reviewing and committing the desired source changes:

```sh
git push defense HEAD:main
```

The API's root directory is `api`; the UI's root directory is `ui`.
Build both with `npm ci --include=dev && npm run build`.
The API starts with `npm run start:prod`; the UI publishes `dist`.
The UI rewrite rule `/*` -> `/index.html` supports React Router URLs.
`render.yaml` records equivalent settings for future deployments; the current
services were configured through the dashboard, not through a Blueprint.

## Secrets and optional integrations

Render stores `DATABASE_URL` and a generated `JWT_SECRET` in the API service's
environment. Never commit their values. Production refresh cookies use HTTPS.

The API also needs `NODE_ENV=production`, `CORS_ORIGIN` and `FRONTEND_URL` pointing
to the deployed site. Both services use `NODE_VERSION=22.16.0`.
The UI uses `VITE_API_URL` and its existing public Cloudinary upload configuration.

OpenRouter AI generation requires an API-side `OPENROUTER_API_KEY` and optionally
`OPENROUTER_MODEL`. Google login requires API-side Google credentials and adding
the deployed callback URL in Google Cloud. Those credentials are not automatically
copied from local `.env` files. Email integrations likewise need separate setup.

The cloud database was initialized with migrations. Existing local application
data is not automatically uploaded. A data migration needs to be performed
separately when authorized.

## Verification

- API and UI production builds passed.
- All 33 existing API tests passed; an additional signup test confirms password
  hashes are omitted from responses.
- All 21 schema migrations ran successfully on a new isolated PostgreSQL database.
- Cloud smoke test passed: registration, login, CORS, secure refresh cookie,
  token refresh, profile, quiz creation, session creation, WebSocket host/player
  joins, question delivery, correct answer, game completion, stored report.
- Guest homepage and login page render successfully; direct `/auth` loads.
- `/users/1` returns 404; unauthenticated `/quizzes` returns 401.

Optional provider integrations and high concurrency were not tested.
