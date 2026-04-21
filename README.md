# simple-blog-ui

React frontend for a simple blog and minimal admin panel.

## Features
- Public blog list
- Public article page
- Admin login
- Admin article list
- Create / edit / delete article
- Simple text editor based on textarea
- Docker-ready

## Run locally

### With Docker
```bash
docker build -t simple-blog-ui .
```

### Without Docker
Requires Node.js 20+.

```bash
npm install
npm run dev
```

## Environment
Create `.env` from `.env.example`.

```bash
cp .env.example .env
```

Main variable:
- `VITE_API_URL`

## Notes
- Auth token is stored in `localStorage` for MVP simplicity.
- For production, better move to secure cookie-based auth and add route guards plus refresh flow.
