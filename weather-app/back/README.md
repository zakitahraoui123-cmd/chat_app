# Weather App (Backend)

Small Express server that proxies a free weather API (Open‑Meteo). No database. No API key.

## Run

```bash
npm install
npm run dev
```

Server runs on `http://localhost:5050`.

## Endpoints

- `GET /health`
- `GET /api/geocode?q=London`
- `GET /api/forecast?lat=51.5072&lon=-0.1276&units=metric`

