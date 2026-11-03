# TrampoTech API

The Angular application talks to this API for registration, login, logout, session
restoration, and the authenticated user's profile. Passwords are stored as bcrypt
hashes. The session JWT is kept in an HttpOnly cookie and is never exposed to
browser JavaScript.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` to a newly rotated MongoDB Atlas connection string and
   `AUTH_JWT_SECRET` to a random secret of at least 32 characters.
3. Keep `.env` private; never commit or send its contents.
4. Run `npm install`, then `npm start` (or `npm run dev`).
5. In another terminal, run the Angular app with `npm start` from the repository
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
