# Deployment Notes

## Current public demo strategy

- GitHub Pages serves a static public showcase from `docs/`
- The showcase includes one full-length CC0 jazz recording that can be played end-to-end from the repository
- Docker remains the source of truth for the complete full-stack demo
- This avoids pretending GitHub Pages can host NestJS, PostgreSQL and Redis

## Why this split exists

GitHub Pages can only host static assets. FreeVibes 2.0 needs a backend, a database, uploads storage and authenticated flows, so the public repository uses:

- a static showcase for instant public access and real audio playback
- local Docker for the complete product
- a future-ready split deployment path for frontend and backend services

## Future production path

- Frontend on Vercel, Netlify or a static-capable platform with server support if desired
- Backend on Railway, Render, Fly.io or a VPS
- PostgreSQL and Redis on managed services
- Object storage on S3-compatible infrastructure

## Important environment considerations

- `NEXT_PUBLIC_API_BASE_URL` must point to the deployed API
- `ALLOWED_ORIGINS` must include the deployed frontend host
- `LOCAL_STORAGE_BASE_URL` should move from localhost to the public uploads domain
- `COOKIE_SECURE=true` is required for HTTPS deployments
