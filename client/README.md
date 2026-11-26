# SwiftTrack frontend

React + Vite frontend for the SwiftTrack parcel-tracking app.

## Local development

```bash
npm install
npm run dev
```

Create `client/.env`:

```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:5000/api
```

The backend must be running on port 5000. See the main
`DEPLOYMENT_BACKEND.md` guide for deployment.

## Useful commands

```bash
npm run lint     # check the code
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Pages

- `/` home, `/track` public tracking, `/live` public live map
- `/relay-points` public relay-point finder
- `/admin/login` admin sign-in (`admin@example.com` / `admin123` when seeded)
- `/admin`, `/admin/shipments`, `/admin/couriers`,
  `/admin/relay-points`, `/admin/messages`, `/admin/settings`

The admin dashboard holds the live-simulation panel: several runs can move
at once, each with its own speed, pause/resume/stop controls, and courier.
