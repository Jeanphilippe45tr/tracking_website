# Deployment guide (free hosting, beginner friendly)

This project has two parts:

| Part | Folder | What it is |
| --- | --- | --- |
| Frontend | `client/` | React + Vite website (public site + admin area) |
| Backend | `server/` | Node.js + Express + MySQL API |

Deploy the **database first**, then the **backend**, then the
**frontend**. Follow the steps in order and keep the URLs you get.

## What the app can do

- Public parcel tracking by tracking number.
- A live map showing **several deliveries at the same time**.
- Admin can start / pause / resume / stop / remove each live run.
- Admin can change each run's speed (0.1× = very slow, up to 20×).
- Admin can manage couriers and assign one to a shipment.
- Admin can create relay points; addresses are placed on the map.
- Shipment origins and destinations accept full addresses (street,
  region/state, postal code, country) and are geocoded automatically.
- Manual latitude/longitude fields are available when geocoding is not
  possible.

No map API key is needed: Leaflet is bundled, tiles come from
OpenStreetMap with an automatic Esri fallback.

---

## 1) Put the code on GitHub

1. Create a new GitHub repository (for example `swifttrack`).
2. From the project folder run:
   ```bash
   git init
   git add .
   git commit -m "SwiftTrack app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. Do **not** commit `node_modules` or `.env` files. The included
   `.gitignore` already excludes them.

---

## 2) Create a free MySQL database

Pick **one** provider:

| Provider | Notes |
| --- | --- |
| [TiDB Cloud](https://tidbcloud.com/) | Free serverless MySQL-compatible DB. Gives a `mysql://...` URI. Requires TLS. |
| [Aiven](https://aiven.io/) | Free/credit plan. Gives a MySQL URI, usually with TLS. |
| [Railway](https://railway.app/) | Easiest if the backend is also on Railway. Add the MySQL plugin. |
| [PlanetScale](https://planetscale.com/) | Check the current free tier. Connection setup can differ. |

After creating it, copy:

- the full connection string (`mysql://user:password@host:port/database`),
- or the host, port, database name, username and password.

The backend creates missing tables automatically on first start.

---

## 3) Deploy the backend (free Node host)

Recommended free options: **[Render](https://render.com/)**,
**[Railway](https://railway.app/)** or **[Koyeb](https://www.koyeb.com/)**.

### Option A: Render (free web service)

1. Sign in at [render.com](https://render.com/) → **New** → **Web Service**.
2. Connect your GitHub repository.
3. Fill in:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Open **Environment** and add these variables:

| Key | Value | Why |
| --- | --- | --- |
| `NODE_ENV` | `production` | Production mode. |
| `DATABASE_URL` | `mysql://user:pass@host:port/dbname` | From step 2. |
| `DB_SSL` | `true` | Most free cloud MySQL providers require TLS. Try `false` if connection fails. |
| `JWT_SECRET` | long random string | Signs admin logins. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. |
| `JWT_EXPIRES_IN` | `7d` | Optional login lifetime. |
| `CORS_ORIGIN` | `https://your-frontend-domain.com` | The exact frontend URL, no trailing slash. Comma-separate multiple URLs. |
| `SEED_ON_START` | `true` | Seeds the demo admin and sample data on the first boot. Set to `false` later if you want an empty production DB. |
| `SYNC_DATABASE` | `true` | Creates/updates missing tables. Keep `true` for this project. |
| `GEOCODE_ENABLED` | `true` | Enables free address lookup. |
| `GEOCODE_USER_AGENT` | `SwiftTrack/1.0 (you@example.com)` | Nominatim requires an identifying User-Agent with a contact address. |
| `GEOCODE_TIMEOUT_MS` | `5000` | Keeps address lookups inside host request timeouts. |

5. Click **Create Web Service**. Wait for the build.
6. Test the API:
   ```
   https://your-app.onrender.com/api/health
   ```
   It should return `{"status":"ok","database":"connected"}`.
   The API base URL is `https://your-app.onrender.com/api`.

### Option B: Railway

1. [railway.app](https://railway.app/) → **New Project** → deploy from
   GitHub.
2. Add **MySQL** from the marketplace (or use an external database).
3. On the backend service set **Root Directory** to `server`.
4. Add the same environment variables as Render.
   Railway may provide `MYSQL_URL`/`DATABASE_URL` automatically; use it if
   present.
5. Deploy and open `/api/health`.

### Option C: Koyeb

1. [koyeb.com](https://www.koyeb.com/) → **Create App** → GitHub.
2. **Root directory:** `server`
3. **Build command:** `npm install`
4. **Run command:** `npm start`
5. Add the same environment variables.

### About the live map and free sleeping

Live runs are stored in MySQL (`live_runs` table). Progress is calculated
from the server clock, so:

- customers on another phone/browser see the same moving parcels;
- a run keeps progressing even if the admin closes the tab;
- if a free host sleeps and wakes up, the run catches up to the correct
  position on the next request.

The database table for live runs is created automatically when
`SYNC_DATABASE=true`.

### About address geocoding

Address lookup uses the free OpenStreetMap **Nominatim** service:

- no API key;
- requests are queued at roughly one per second (its usage policy);
- results are cached in memory;
- common cities have an offline fallback if Nominatim is slow or blocked;
- if geocoding still fails, the shipment is created and the admin can set
  latitude/longitude manually under **Advanced: set coordinates manually**.

Nominatim is a shared free service. For a busy production site, use a paid
geocoder or your own Nominatim instance and set `GEOCODE_URL` to it. To
turn network lookup off completely, set `GEOCODE_ENABLED=false`; the
built-in city list is then used.

---

## 4) Deploy the frontend

### 4.1 Point it at the backend

In `client/.env` (locally) or in the frontend host's environment settings:

```env
VITE_USE_MOCK=false
VITE_API_URL=https://your-app.onrender.com/api
```

`VITE_API_URL` must end with `/api`.

### 4.2 Netlify

1. [netlify.com](https://www.netlify.com/) → **Add new site** → import
   your Git repository.
2. Set:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/dist` (Netlify may show `dist` because
     the base is already `client`)
3. Add the environment variable `VITE_USE_MOCK=false` and
   `VITE_API_URL=https://your-app.onrender.com/api`.
4. Deploy.
5. The included `client/public/_redirects` file makes page refreshes work
   on routes such as `/track/TRK...`, `/live` and `/admin`.

### 4.3 Vercel

1. [vercel.com](https://vercel.com/) → **Add New** → **Project** → import
   the repository.
2. **Root Directory:** `client`
3. Framework preset: **Vite**
4. Build command `npm run build`, output directory `dist`.
5. Add the same environment variables.
6. Add a rewrite so React Router pages work after refresh:
   - Source: `/(.*)`
   - Destination: `/index.html`
7. Deploy.

### 4.4 Cloudflare Pages

1. [pages.cloudflare.com](https://pages.cloudflare.com/) → **Create a
   project** → connect Git.
2. **Build command:** `npm run build`
3. **Build output directory:** `dist`
4. **Root directory:** `client`
5. Add the environment variables and deploy. The included `_redirects`
   file handles SPA routing.

After deploying, copy the final frontend URL into the backend's
`CORS_ORIGIN` variable and redeploy the backend if you changed it.

---

## 5) First test after deployment

1. Open your frontend URL → `/admin/login`.
2. Seeded admin account:
   - **Email:** `admin@example.com`
   - **Password:** `admin123`
3. Change the password immediately under **Admin → Settings → Security**.
4. Open **Couriers** → add a delivery person.
5. Open **Relay points** → add a location with a street, city, postal code
   and country. Check that it appears on the map and on the public
   **Relay points** page.
6. Open **Shipments → New shipment**. Use any full address. Assign the
   courier. Submit and check the map/tracking page.
7. Open **Dashboard → Live tracking simulations**:
   - choose a shipment and a slow speed (for example `0.5×`);
   - start it;
   - choose a second shipment and start that too;
   - open `/live` in a normal browser and in a private/incognito window;
   - both windows should show the same moving parcels.
8. Check `/api/health` once more.

---

## 6) After the first successful deploy

- **Change the admin password.**
- If you do not want demo data in production, set `SEED_ON_START=false`
  after the first boot. Existing data is not duplicated.
- Keep `JWT_SECRET` secret and long.
- Never commit `.env` files.
- If you change `CORS_ORIGIN`, redeploy the backend.
- `SYNC_DATABASE=true` also runs a small automatic column upgrade so an
  older database gets the new address/courier/live-run columns safely.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| MySQL connection error / `ETIMEDOUT` | Check `DATABASE_URL`; try `DB_SSL=true` (most cloud MySQL providers require TLS). |
| `CORS` error in the browser | Set `CORS_ORIGIN` to the exact frontend origin, including `https://` and no trailing slash. |
| “Cannot reach the server” | `VITE_API_URL` must point to the backend and end in `/api`; redeploy the frontend after changing it. |
| Page refresh shows 404 | Use the included `_redirects` (Netlify/Cloudflare) or add the Vercel rewrite. |
| Address has no coordinates | Check the backend logs for `[geocode]` warnings. Add coordinates manually in the shipment form, or set `GEOCODE_ENABLED=false` to use the city fallback. |
| Live map is empty | Start a run on the admin dashboard. Completed/stopped runs are removed with **Remove** or **Clear all**. |
| Render free service is slow after idle | Free instances sleep. The first request can take 30–60 seconds; live progress catches up because it is time-based. |
| Tables or columns missing | Keep `SYNC_DATABASE=true` on the first boot and check the database user can create/alter tables. |

---

## Quick local test (optional)

Terminals: use two separate terminals.

```bash
# Terminal 1 - backend
cd server
cp .env.example .env
npm install
npm run db:create
npm run db:seed
npm run dev
```

```bash
# Terminal 2 - frontend
cd client
npm install
# client/.env:
# VITE_USE_MOCK=false
# VITE_API_URL=http://localhost:5000/api
npm run dev
```

Local login: `admin@example.com` / `admin123`.

Local database (XAMPP): host `localhost`, port `3306`, user `root`,
empty password, database `tracking_db`.
