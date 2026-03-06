# 🇳🇵 Nepal Election Dashboard 2082

A real-time election results dashboard for Nepal's House of Representatives General Election 2082 (2026).

Data is fetched from the **official Election Commission of Nepal** at [result.election.gov.np](https://result.election.gov.np) and refreshes every **30 seconds**.

---

## ✨ Features

- 📊 **Live party standings** — seats declared + leading, updated every 30 seconds
- 🗺️ **165 FPTP constituencies** — searchable, filterable by province and status
- 📍 **Province-by-province breakdown** — all 7 provinces of Nepal
- 📈 **Interactive charts** — bar charts, pie charts (powered by Recharts)
- 🔄 **Auto-sync from ECN** — Node.js backend polls ECN every 30 seconds via cron
- 💾 **MongoDB caching** — results cached to reduce ECN load
- 🌙 **Nepal-themed dark UI** — crimson & blue palette, Devanagari-inspired design

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Bootstrap 5, React-Bootstrap |
| Charts | Recharts |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Scheduler | node-cron (30s sync) |
| Data Source | Election Commission of Nepal API |

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
git clone <your-repo>
cd nepal-election
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- MongoDB: mongodb://localhost:27017

### Option 2: Manual Setup

#### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your MONGO_URI
npm install
npm start
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

Make sure MongoDB is running locally or set `MONGO_URI` in backend `.env`.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/summary` | Overall party standings + stats |
| GET | `/api/constituencies` | All constituencies (filterable) |
| GET | `/api/constituencies/:id` | Single constituency detail |
| GET | `/api/provinces` | Province-level summary |
| POST | `/api/sync` | Manually trigger ECN sync |

### Query Parameters for `/api/constituencies`
- `province` — filter by province name
- `status` — filter by `declared`, `counting`, or `pending`
- `search` — search constituency/district name

---

## 📡 ECN Data Integration

The backend connects to Nepal's official election results site:

```
https://result.election.gov.np/
```

A cron job runs every **30 seconds** to:
1. Fetch latest data from ECN
2. Parse constituency-level results
3. Store/update in MongoDB
4. Update party summary aggregates

If ECN is unreachable, the app continues with the last cached data from MongoDB.

### Upgrading ECN Parsing

When ECN updates their API response format, update the `syncFromECN()` function in `backend/server.js`:

```js
async function syncFromECN() {
  const res = await axios.get('https://result.election.gov.np/your-api-endpoint');
  // Parse res.data and update ConstituencyResult documents
}
```

---

## 🏗️ Project Structure

```
nepal-election/
├── backend/
│   ├── server.js          # Express API + cron sync
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css         # Nepal-themed dark design
│   │   ├── hooks/
│   │   │   └── useElectionData.js
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── Constituencies.jsx
│   │       ├── ConstituencyDetail.jsx
│   │       └── Provinces.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

---

## 🗳️ About Nepal Election 2082

- **Date**: March 5, 2026
- **Seats**: 275 total (165 FPTP + 110 proportional)
- **Registered voters**: ~18.9 million
- **Candidates**: 3,406 from 68+ parties
- **Majority needed**: 138 seats

### Major Parties
- 🔵 **NC** — Nepali Congress
- 🔴 **CPN-UML** — Communist Party of Nepal (United Marxist–Leninist)
- 🟥 **Maoist** — CPN (Maoist Centre)
- 🟠 **RSP** — Rastriya Swatantra Party
- 🟣 **RPP** — Rastriya Prajatantra Party

---

## ⚠️ Disclaimer

This is an independent informational dashboard. All data is sourced exclusively from the [Election Commission of Nepal](https://result.election.gov.np). For official and final results, refer directly to the ECN.

---

*Built with ❤️ for Nepal 🇳🇵*
# LiveElection
