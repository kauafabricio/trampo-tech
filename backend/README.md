# TrampoTech API

The Angular application talks to this API for registration, login, logout, session
restoration, and the authenticated user's profile. Passwords are stored as bcrypt
hashes. The session JWT is kept in an HttpOnly cookie and is never exposed to
browser JavaScript.

## Local setup

1. Copy `.env.example` to `.env`.
2. Replace the MongoDB placeholders with a connection string for your cluster.
   Ensure the database user has read/write access and the machine running the
   API is allowed by the cluster's network access list. URL-encode special
   characters in the database username or password.
3. Set `AUTH_JWT_SECRET` to a random secret of at least 32 characters.
4. Keep `.env` private; never commit or send its contents.
5. Run `npm install`, then `npm start` (or `npm run dev`).
6. In another terminal, run the Angular app with `npm start` from the repository
   root.

The API creates a unique index on `users.email` at startup. Configure
`CLIENT_ORIGIN` to the exact origin serving the Angular app. In production, use
HTTPS and keep the client and API on the same site, or configure the deployment
and cookie policy for the required cross-site setup.

## Routes

- `POST /api/auth/register` — create an account and start a session.
- `POST /api/auth/login` — authenticate and start a session.
- `POST /api/auth/logout` — clear the session cookie.
- `GET /api/auth/me` — return the authenticated account.
- `PATCH /api/auth/me` — update the authenticated account's name, email, and
  selected learning track.
