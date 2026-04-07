import { useEffect, useMemo, useRef, useState } from "react";
import { forecast, geocode } from "./api.js";
import { describeWeather } from "./weatherCodes.js";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function fmtTemp(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}°`;
}

function fmtWind(n, units) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n)} ${units === "imperial" ? "mph" : "km/h"}`;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function App() {
  const [units, setUnits] = useState("metric"); // metric | imperial
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef({ id: 0 });

  useEffect(() => {
    let alive = true;
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await geocode(q);
        if (!alive) return;
        setSuggestions(res);
      } catch {
        if (!alive) return;
        setSuggestions([]);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  async function loadForecast(place) {
    if (!place) return;
    const id = ++abortRef.current.id;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await forecast({
        lat: place.latitude,
        lon: place.longitude,
        units,
      });
      if (abortRef.current.id !== id) return;
      setData(res);
    } catch (e) {
      if (abortRef.current.id !== id) return;
      setError(e?.message || "Could not load weather.");
    } finally {
      if (abortRef.current.id === id) setLoading(false);
    }
  }

  useEffect(() => {
    if (!selected) return;
    loadForecast(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units]);

  useEffect(() => {
    // Fresh default: “current location” without permissions (a pleasant fallback city)
    const fallback = {
      id: "40.7128,-74.0060",
      name: "New York",
      country: "US",
      admin1: "New York",
      latitude: 40.7128,
      longitude: -74.006,
      timezone: "auto",
    };
    setSelected(fallback);
    loadForecast(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = data?.current || null;
  const daily = data?.daily || null;

  const header = useMemo(() => {
    const name = selected?.name || "Weather";
    const region = [selected?.admin1, selected?.country].filter(Boolean).join(", ");
    return { name, region };
  }, [selected]);

  const currentDesc = describeWeather(current?.weather_code);
  const tempUnit = units === "imperial" ? "°F" : "°C";

  const heroGradient = useMemo(() => {
    const isDay = Boolean(current?.is_day);
    const code = Number(current?.weather_code);
    if (!isDay) return "hero hero--night";
    if ([0, 1].includes(code)) return "hero hero--sun";
    if ([2, 3, 45, 48].includes(code)) return "hero hero--cloud";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "hero hero--rain";
    if ([71, 73, 75].includes(code)) return "hero hero--snow";
    if ([95, 96, 99].includes(code)) return "hero hero--storm";
    return "hero hero--sun";
  }, [current?.is_day, current?.weather_code]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand__mark" aria-hidden>
            ✦
          </div>
          <div className="brand__text">
            <div className="brand__name">Fresh Weather</div>
            <div className="brand__tag">Clean UI • Fast forecasts</div>
          </div>
        </div>

        <div className="controls">
          <div className="seg">
            <button
              type="button"
              className={units === "metric" ? "seg__btn seg__btn--on" : "seg__btn"}
              onClick={() => setUnits("metric")}
            >
              °C
            </button>
            <button
              type="button"
              className={units === "imperial" ? "seg__btn seg__btn--on" : "seg__btn"}
              onClick={() => setUnits("imperial")}
            >
              °F
            </button>
          </div>
        </div>
      </header>

      <main className="content">
        <section className={heroGradient}>
          <div className="hero__inner">
            <div className="search">
              <label className="sr-only" htmlFor="city">
                Search city
              </label>
              <input
                id="city"
                className="search__input"
                placeholder="Search a city… (e.g. London, Tokyo)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {suggestions.length > 0 ? (
                <div className="search__dropdown" role="listbox">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="search__item"
                      onClick={() => {
                        setSelected(s);
                        setQuery("");
                        setSuggestions([]);
                        loadForecast(s);
                      }}
                    >
                      <span className="search__itemName">{s.name}</span>
                      <span className="search__itemMeta">
                        {[s.admin1, s.country].filter(Boolean).join(", ")}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="hero__grid">
              <div className="hero__left">
                <div className="place">
                  <h1 className="place__name">{header.name}</h1>
                  <p className="place__region">{header.region}</p>
                </div>

                <div className="now">
                  <div className="now__icon" aria-hidden>
                    {currentDesc.icon}
                  </div>
                  <div className="now__main">
                    <div className="now__temp">
                      {fmtTemp(current?.temperature_2m)}
                      <span className="now__unit">{tempUnit}</span>
                    </div>
                    <div className="now__desc">{currentDesc.label}</div>
                  </div>
                </div>

                <div className="stats">
                  <div className="stat">
                    <div className="stat__label">Feels like</div>
                    <div className="stat__value">{fmtTemp(current?.apparent_temperature)}</div>
                  </div>
                  <div className="stat">
                    <div className="stat__label">Humidity</div>
                    <div className="stat__value">
                      {current?.relative_humidity_2m != null
                        ? `${clamp(current.relative_humidity_2m, 0, 100)}%`
                        : "—"}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat__label">Wind</div>
                    <div className="stat__value">{fmtWind(current?.wind_speed_10m, units)}</div>
                  </div>
                </div>
              </div>

              <div className="hero__right">
                <div className="panel">
                  <div className="panel__head">
                    <span>7‑day outlook</span>
                    <span className="panel__sub">{daily?.time?.[0] === todayKey() ? "Starts today" : ""}</span>
                  </div>

                  {loading ? (
                    <div className="panel__body">
                      <div className="skeleton-row" />
                      <div className="skeleton-row" />
                      <div className="skeleton-row" />
                      <div className="skeleton-row" />
                    </div>
                  ) : error ? (
                    <div className="panel__body">
                      <div className="alert alert--error">{error}</div>
                    </div>
                  ) : data && daily ? (
                    <div className="panel__body">
                      {daily.time.map((t, idx) => {
                        const d = new Date(t);
                        const day = d.toLocaleDateString(undefined, { weekday: "short" });
                        const dc = describeWeather(daily.weather_code[idx]);
                        return (
                          <div className="day" key={t}>
                            <div className="day__left">
                              <div className="day__name">{day}</div>
                              <div className="day__meta">{dc.label}</div>
                            </div>
                            <div className="day__mid" aria-hidden>
                              {dc.icon}
                            </div>
                            <div className="day__right">
                              <span className="day__hi">{fmtTemp(daily.temperature_2m_max[idx])}</span>
                              <span className="day__lo">{fmtTemp(daily.temperature_2m_min[idx])}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="panel__body">
                      <div className="muted">Type a city to get started.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <span>
            Data by Open‑Meteo. Built with React + Express. No API key required.
          </span>
        </footer>
      </main>
    </div>
  );
}

