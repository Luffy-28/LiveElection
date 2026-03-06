import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useElectionData } from "../hooks/useElectionData";
import { partyColor, partyEn, partyShort } from "../constants/parties";

/* ─── Party config ─────────────────────────────────────────── */

/* Province fill colours — matching the Kantipur screenshot exactly */
const PROVINCE_COLORS = {
  1: "#F4A4A4", // Koshi       — salmon pink
  2: "#93C5FD", // Madhesh     — sky blue
  3: "#86EFAC", // Bagmati     — mint green
  4: "#FCD34D", // Gandaki     — golden yellow
  5: "#F9A8D4", // Lumbini     — rose pink
  6: "#FDE68A", // Karnali     — pale yellow
  7: "#C4B5FD", // Sudurpashchim — lavender
};
const PROVINCE_NAMES = [
  "",
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
];

/* District → Province (all 77) */
const DIST_PROV = {
  TAPLEJUNG: 1,
  PANCHTHAR: 1,
  ILAM: 1,
  JHAPA: 1,
  MORANG: 1,
  SUNSARI: 1,
  DHANKUTA: 1,
  TERHATHUM: 1,
  SANKHUWASABHA: 1,
  BHOJPUR: 1,
  SOLUKHUMBU: 1,
  OKHALDHUNGA: 1,
  KHOTANG: 1,
  UDAYAPUR: 1,
  SAPTARI: 2,
  SIRAHA: 2,
  DHANUSHA: 2,
  MAHOTTARI: 2,
  SARLAHI: 2,
  RAUTAHAT: 2,
  BARA: 2,
  PARSA: 2,
  SINDHULI: 3,
  RAMECHHAP: 3,
  DOLAKHA: 3,
  SINDHUPALCHOK: 3,
  KAVREPALANCHOK: 3,
  LALITPUR: 3,
  BHAKTAPUR: 3,
  KATHMANDU: 3,
  NUWAKOT: 3,
  RASUWA: 3,
  DHADING: 3,
  MAKWANPUR: 3,
  CHITWAN: 3,
  GORKHA: 4,
  MANANG: 4,
  MUSTANG: 4,
  MYAGDI: 4,
  KASKI: 4,
  LAMJUNG: 4,
  TANAHUN: 4,
  NAWALPUR: 4,
  SYANGJA: 4,
  PARBAT: 4,
  BAGLUNG: 4,
  KAPILVASTU: 5,
  ARGHAKHANCHI: 5,
  GULMI: 5,
  PALPA: 5,
  NAWALPARASI: 5,
  RUPANDEHI: 5,
  ROLPA: 5,
  PYUTHAN: 5,
  DANG: 5,
  BANKE: 5,
  BARDIYA: 5,
  DOLPA: 6,
  MUGU: 6,
  HUMLA: 6,
  JUMLA: 6,
  KALIKOT: 6,
  DAILEKH: 6,
  JAJARKOT: 6,
  "RUKUM WEST": 6,
  "RUKUM EAST": 5,
  SALYAN: 6,
  SURKHET: 6,
  KANCHANPUR: 7,
  KAILALI: 7,
  ACHHAM: 7,
  DOTI: 7,
  BAJHANG: 7,
  BAJURA: 7,
  DADELDHURA: 7,
  BAITADI: 7,
  DARCHULA: 7,
};

function distKey(name) {
  return (name || "")
    .toUpperCase()
    .replace("NAWALPARASI (BARDAGHAT SUSTA EAST)", "NAWALPARASI")
    .replace("NAWALPARASI (BARDAGHAT SUSTA WEST)", "NAWALPARASI")
    .replace("RUKUM (EAST)", "RUKUM EAST")
    .replace("RUKUM (WEST)", "RUKUM WEST")
    .trim();
}

function pc(n) { return partyColor(n); }
function pe(n) { return partyEn(n); }
function ps(n) { return partyShort(n); }

/* ─── Geo projection ───────────────────────────────────────── */
const VW = 1000,
  VH = 460;
const LON0 = 79.9,
  LON1 = 88.3,
  LAT0 = 26.1,
  LAT1 = 30.65;
function proj([lon, lat]) {
  return [
    ((lon - LON0) / (LON1 - LON0)) * VW,
    VH - ((lat - LAT0) / (LAT1 - LAT0)) * VH,
  ];
}
function ringToD(ring) {
  return (
    ring
      .map(([lon, lat], i) => {
        const [x, y] = proj([lon, lat]);
        return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join("") + "Z"
  );
}
function geomToD(geom) {
  if (!geom) return "";
  const rings =
    geom.type === "Polygon" ? geom.coordinates : geom.coordinates.flat();
  return rings.map(ringToD).join(" ");
}
function geomCentroid(geom) {
  const pts =
    geom.type === "Polygon" ? geom.coordinates[0] : geom.coordinates[0][0];
  const n = pts.length;
  let sx = 0,
    sy = 0;
  pts.forEach(([lon, lat]) => {
    sx += lon;
    sy += lat;
  });
  const [x, y] = proj([sx / n, sy / n]);
  return [x, y];
}

/* ─── Tooltip component ────────────────────────────────────── */
function Tooltip({ feature, info, mouse }) {
  if (!feature) return null;
  const name = feature.properties?.DISTRICT || feature.properties?.name || "";
  const prov = DIST_PROV[distKey(name)] || 1;
  const provColor = PROVINCE_COLORS[prov];
  const lp = info?.leadingParty;
  const accentColor = lp ? partyColor(lp) || provColor : provColor;

  const style = {
    position: "fixed",
    left: mouse.x + 18,
    top: mouse.y - 12,
    pointerEvents: "none",
    zIndex: 9999,
    background: "white",
    border: `2px solid ${accentColor}`,
    borderRadius: "12px",
    padding: "0.9rem 1rem",
    minWidth: 210,
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    fontFamily: "Mukta, sans-serif",
    transform: mouse.x > window.innerWidth - 260 ? "translateX(-110%)" : "none",
  };

  return (
    <div style={style}>
      {/* District name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            background: provColor,
            border: "1px solid rgba(0,0,0,0.12)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontWeight: 800,
            fontSize: "1rem",
            color: "#111827",
            letterSpacing: "0.3px",
          }}
        >
          {name}
        </span>
      </div>
      <div style={{ fontSize: "0.68rem", color: "#9CA3AF", marginBottom: 8 }}>
        {PROVINCE_NAMES[prov]} Province · {info?.total || 0} constituencies
      </div>

      {/* Counts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 4,
          marginBottom: 8,
        }}
      >
        {[
          { v: info?.declared || 0, l: "Declared", c: "#059669" },
          { v: info?.counting || 0, l: "Counting", c: "#D97706" },
          { v: info?.pending || 0, l: "Pending", c: "#9CA3AF" },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              textAlign: "center",
              background: "#F9FAFB",
              borderRadius: 6,
              padding: "4px 0",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: "1.1rem",
                color: s.c,
                lineHeight: 1,
              }}
            >
              {s.v}
            </div>
            <div
              style={{
                fontSize: "0.58rem",
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* Leading party */}
      {lp ? (
        <div
          style={{
            background: `${accentColor}14`,
            border: `1px solid ${accentColor}40`,
            borderRadius: 8,
            padding: "6px 10px",
          }}
        >
          <div
            style={{ fontSize: "0.6rem", color: "#9CA3AF", marginBottom: 2 }}
          >
            {(info?.declared || 0) > 0 ? "Leading Party" : "Most Votes So Far"}
          </div>
          <div
            style={{ fontWeight: 700, color: accentColor, fontSize: "0.9rem" }}
          >
            {partyEn(lp)}
          </div>
          {info?.topCandidate && (
            <div
              style={{ fontSize: "0.68rem", color: "#6B7280", marginTop: 2 }}
            >
              {info.topCandidate.name} · {(info.topVotes || 0).toLocaleString()}{" "}
              votes
            </div>
          )}
        </div>
      ) : (
        <div
          style={{ fontSize: "0.72rem", color: "#9CA3AF", fontStyle: "italic" }}
        >
          No results yet
        </div>
      )}

      {/* Constituency list preview */}
      {(info?.constituencies || []).slice(0, 3).map((c, i) => {
        const leader = [...(c.candidates || [])].sort(
          (a, b) => (b.votes || 0) - (a.votes || 0),
        )[0];
        return (
          <div
            key={i}
            style={{
              marginTop: 4,
              paddingTop: 4,
              borderTop: "1px solid #F3F4F6",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.67rem",
              color: "#6B7280",
            }}
          >
            <span>{c.name}</span>
            <span
              style={{
                color: leader?.votes > 0 ? "#111827" : "#D1D5DB",
                fontWeight: 600,
              }}
            >
              {leader?.votes > 0
                ? `${leader.name?.split(" ")[0]} ${(leader.votes || 0).toLocaleString()}`
                : "—"}
            </span>
          </div>
        );
      })}
      {(info?.constituencies || []).length > 3 && (
        <div style={{ fontSize: "0.62rem", color: "#9CA3AF", marginTop: 3 }}>
          +{info.constituencies.length - 3} more constituencies
        </div>
      )}
    </div>
  );
}

/* ─── Main Map Page ────────────────────────────────────────── */
export default function MapPage() {
  const [geo, setGeo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(null); // feature object
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState("Map");

  const { data: constituencies } = useElectionData("/constituencies", 30000);
  const { data: summary } = useElectionData("/summary", 30000);

  /* Fetch GeoJSON from jsDelivr CDN (open CORS) */
  useEffect(() => {
    const URLS = [
      "https://cdn.jsdelivr.net/npm/nepal-geojson@1.0.4/generated-geojson/country-with-districts.geojson",
      "https://unpkg.com/nepal-geojson@1.0.4/generated-geojson/country-with-districts.geojson",
    ];
    (async () => {
      for (const url of URLS) {
        try {
          const r = await fetch(url);
          if (!r.ok) continue;
          const data = await r.json();
          setGeo(data);
          setLoading(false);
          return;
        } catch (e) {
          /* try next */
        }
      }
      // fallback — try mesaugat's github pages
      try {
        const r = await fetch(
          "https://mesaugat.github.io/geoJSON-Nepal/nepal-districts-new.geojson",
        );
        if (r.ok) {
          setGeo(await r.json());
          setLoading(false);
          return;
        }
      } catch (e) { }
      setError("Could not load map. Check internet connection.");
      setLoading(false);
    })();
  }, []);

  /* Build district info from constituency data */
  const districtMap = {};
  (constituencies || []).forEach((c) => {
    const k = distKey(c.district || "");
    if (!districtMap[k]) districtMap[k] = [];
    districtMap[k].push(c);
  });

  function getInfo(featureOrName) {
    const name =
      typeof featureOrName === "string"
        ? featureOrName
        : featureOrName?.properties?.DISTRICT ||
        featureOrName?.properties?.name ||
        "";
    const k = distKey(name);
    const constits = districtMap[k] || [];
    if (!constits.length) return null;

    let declared = 0,
      counting = 0;
    const partyWins = {};
    let topVotes = 0,
      topCandidate = null,
      leadingParty = null;

    constits.forEach((c) => {
      if (c.status === "declared") declared++;
      if (c.status === "counting") counting++;
      c.candidates?.forEach((cand) => {
        if (c.status === "declared" && cand.isWinner)
          partyWins[cand.partyName] = (partyWins[cand.partyName] || 0) + 1;
        if ((cand.votes || 0) > topVotes) {
          topVotes = cand.votes || 0;
          topCandidate = cand;
          leadingParty = cand.partyName;
        }
      });
    });
    const topWin = Object.entries(partyWins).sort((a, b) => b[1] - a[1])[0];
    return {
      constituencies: constits,
      total: constits.length,
      declared,
      counting,
      pending: constits.length - declared - counting,
      leadingParty: topWin?.[0] || (topVotes > 0 ? leadingParty : null),
      leadingSeats: topWin?.[1] || 0,
      topCandidate: topVotes > 0 ? topCandidate : null,
      topVotes,
    };
  }

  /* Fill color per tab */
  function getFill(feature) {
    const name = feature.properties?.DISTRICT || feature.properties?.name || "";
    const provId = DIST_PROV[distKey(name)] || 1;
    const baseColor = PROVINCE_COLORS[provId] || "#E5E7EB";
    const info = getInfo(feature);

    if (activeTab === "Map") {
      if (info?.leadingParty && partyColor(info.leadingParty))
        return partyColor(info.leadingParty);
      return baseColor;
    }
    if (activeTab === "Heat Map") {
      const votes =
        info?.constituencies?.reduce(
          (s, c) => s + (c.totalVotesCounted || 0),
          0,
        ) || 0;
      if (votes > 40000) return "#EF4444";
      if (votes > 15000) return "#F97316";
      if (votes > 3000) return "#FBBF24";
      return baseColor;
    }
    if (activeTab === "Competitive Area") {
      const hasActive = info && (info.counting > 0 || info.declared > 0);
      return hasActive ? "#8B5CF6" : baseColor;
    }
    // Seat Map
    const seats = info?.leadingSeats || 0;
    if (seats >= 3) return "#DC2626";
    if (seats >= 2) return "#F59E0B";
    if (seats >= 1) return "#10B981";
    return baseColor;
  }

  const topParties = (summary?.parties || [])
    .filter((p) => (p.seatsDeclared || 0) + (p.seatsLeading || 0) > 0)
    .slice(0, 8);

  const TABS = ["Map", "Heat Map", "Competitive Area", "Seat Map"];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F3F4F6",
        fontFamily: "Mukta, sans-serif",
        color: "#111827",
      }}
    >
      {/* ─ Tab bar (matching screenshot) ─ */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #E5E7EB",
          padding: "0 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 52,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 0,
              height: "100%",
              alignItems: "stretch",
            }}
          >
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "none",
                  border: "none",
                  borderLeft: i === 0 ? "1px solid #E5E7EB" : "none",
                  borderRight: i === 0 ? "1px solid #E5E7EB" : "none",
                  borderBottom:
                    activeTab === tab
                      ? "2px solid #111827"
                      : "2px solid transparent",
                  padding: "0 1.25rem",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  color: activeTab === tab ? "#111827" : "#9CA3AF",
                  fontFamily: "Mukta, sans-serif",
                  transition: "color 0.15s",
                  letterSpacing: "0.2px",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <Link
            to="/constituencies"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
              color: "#374151",
              fontWeight: 700,
              fontSize: "0.88rem",
            }}
          >
            Total Parties : {(summary?.parties || []).length || 67} →
          </Link>
        </div>
      </div>

      {/* ─ Main layout ─ */}
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "1.25rem 1.5rem",
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        {/* ─ MAP panel ─ */}
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            border: "1px solid #E5E7EB",
            overflow: "hidden",
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          }}
        >
          {loading && (
            <div
              style={{ padding: "6rem", textAlign: "center", color: "#9CA3AF" }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: "3px solid #E5E7EB",
                  borderTopColor: "#3B82F6",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 1rem",
                }}
              />
              Loading Nepal district map…
            </div>
          )}

          {error && (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                ⚠️
              </div>
              <div style={{ color: "#EF4444", fontWeight: 600 }}>{error}</div>
              <div
                style={{
                  color: "#9CA3AF",
                  fontSize: "0.8rem",
                  marginTop: "0.5rem",
                }}
              >
                Map needs internet to load district boundaries from CDN
              </div>
            </div>
          )}

          {geo && (
            <>
              <svg
                viewBox={`0 0 ${VW} ${VH}`}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  cursor: "crosshair",
                }}
                onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHovered(null)}
              >
                <defs>
                  <filter id="district-shadow">
                    <feDropShadow
                      dx="0"
                      dy="1"
                      stdDeviation="1.5"
                      floodColor="rgba(0,0,0,0.2)"
                    />
                  </filter>
                </defs>

                {geo.features.map((feat, idx) => {
                  const name =
                    feat.properties?.DISTRICT || feat.properties?.name || "";
                  const isHov = hovered === feat;
                  const fill = getFill(feat);
                  const info = getInfo(feat);
                  const [cx, cy] = geomCentroid(feat.geometry);
                  const isCounting = (info?.counting || 0) > 0;

                  return (
                    <g key={idx}>
                      <path
                        d={geomToD(feat.geometry)}
                        fill={fill}
                        fillOpacity={isHov ? 1 : 0.9}
                        stroke="white"
                        strokeWidth={isHov ? 2.5 : 0.7}
                        style={{
                          transition: "fill-opacity 0.12s, stroke-width 0.12s",
                          cursor: "pointer",
                          filter: isHov ? "brightness(1.08)" : "none",
                        }}
                        onMouseEnter={() => setHovered(feat)}
                      />
                      {/* District label */}
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={isHov ? 9.5 : 7}
                        fontFamily="Mukta, sans-serif"
                        fontWeight={isHov ? "700" : "600"}
                        fill="#1F2937"
                        stroke="white"
                        strokeWidth={isHov ? 2.5 : 1.8}
                        paintOrder="stroke"
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {name}
                      </text>
                      {/* Live counting pulse dot */}
                      {isCounting && (
                        <circle
                          cx={cx + 14}
                          cy={cy - 8}
                          r="3.5"
                          fill="#D97706"
                          opacity="0.85"
                        >
                          <animate
                            attributeName="r"
                            values="3.5;6;3.5"
                            dur="1.4s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.85;0.2;0.85"
                            dur="1.4s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Province legend */}
              <div
                style={{
                  padding: "0.75rem 1.1rem",
                  borderTop: "1px solid #F3F4F6",
                  display: "flex",
                  gap: "0.65rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                  background: "#FAFAFA",
                }}
              >
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "#9CA3AF",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    marginRight: 4,
                  }}
                >
                  Province
                </span>
                {Object.entries(PROVINCE_COLORS).map(([id, color]) => (
                  <div
                    key={id}
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <div
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 3,
                        background: color,
                        border: "1px solid rgba(0,0,0,0.1)",
                      }}
                    />
                    <span style={{ fontSize: "0.67rem", color: "#6B7280" }}>
                      {PROVINCE_NAMES[id]}
                    </span>
                  </div>
                ))}
                {activeTab !== "Map" && (
                  <div
                    style={{
                      marginLeft: "auto",
                      fontSize: "0.67rem",
                      color: "#9CA3AF",
                    }}
                  >
                    {activeTab === "Heat Map" &&
                      "🔴 High · 🟠 Med · 🟡 Low · Gray = no votes"}
                    {activeTab === "Competitive Area" &&
                      "🟣 Active counting · Gray = pending"}
                    {activeTab === "Seat Map" &&
                      "🔴 3+ seats · 🟡 2 seats · 🟢 1 seat"}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ─ Sidebar ─ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Hovered district card */}
          <div
            style={{
              background: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              overflow: "hidden",
              minHeight: 160,
              boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            }}
          >
            {hovered ? (
              (() => {
                const name =
                  hovered.properties?.DISTRICT ||
                  hovered.properties?.name ||
                  "";
                const prov = DIST_PROV[distKey(name)] || 1;
                const info = getInfo(hovered);
                const lp = info?.leadingParty;
                const accentColor = lp
                  ? partyColor(lp) || PROVINCE_COLORS[prov]
                  : PROVINCE_COLORS[prov];
                return (
                  <>
                    <div
                      style={{
                        background: PROVINCE_COLORS[prov],
                        padding: "0.75rem 1rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "1.1rem",
                            color: "#111827",
                          }}
                        >
                          {name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "rgba(0,0,0,0.5)",
                          }}
                        >
                          {PROVINCE_NAMES[prov]} Province
                        </div>
                      </div>
                      <Link
                        to={`/constituencies?province=${PROVINCE_NAMES[prov]}`}
                        style={{
                          fontSize: "0.68rem",
                          color: "#111827",
                          opacity: 0.7,
                          textDecoration: "none",
                          border: "1px solid rgba(0,0,0,0.15)",
                          borderRadius: 6,
                          padding: "3px 8px",
                          background: "rgba(255,255,255,0.5)",
                        }}
                      >
                        View →
                      </Link>
                    </div>
                    <div style={{ padding: "0.85rem 1rem" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 6,
                          marginBottom: 10,
                        }}
                      >
                        {[
                          {
                            v: info?.declared || 0,
                            l: "Declared",
                            c: "#059669",
                          },
                          {
                            v: info?.counting || 0,
                            l: "Counting",
                            c: "#D97706",
                          },
                          { v: info?.pending || 0, l: "Pending", c: "#9CA3AF" },
                        ].map((s) => (
                          <div
                            key={s.l}
                            style={{
                              textAlign: "center",
                              background: "#F9FAFB",
                              borderRadius: 8,
                              padding: "6px 0",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: "1.2rem",
                                color: s.c,
                              }}
                            >
                              {s.v}
                            </div>
                            <div
                              style={{
                                fontSize: "0.58rem",
                                color: "#9CA3AF",
                                textTransform: "uppercase",
                              }}
                            >
                              {s.l}
                            </div>
                          </div>
                        ))}
                      </div>
                      {lp ? (
                        <div
                          style={{
                            background: `${accentColor}12`,
                            border: `1px solid ${accentColor}30`,
                            borderRadius: 8,
                            padding: "7px 10px",
                          }}
                        >
                          <div style={{ fontSize: "0.6rem", color: "#9CA3AF" }}>
                            Leading
                          </div>
                          <div
                            style={{
                              fontWeight: 700,
                              color: accentColor,
                              fontSize: "0.88rem",
                            }}
                          >
                            {partyEn(lp)}
                          </div>
                          {info?.topCandidate && (
                            <div
                              style={{
                                fontSize: "0.65rem",
                                color: "#6B7280",
                                marginTop: 2,
                              }}
                            >
                              {info.topCandidate.name} ·{" "}
                              {(info.topVotes || 0).toLocaleString()} votes
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            color: "#D1D5DB",
                            fontSize: "0.78rem",
                            fontStyle: "italic",
                            textAlign: "center",
                            padding: "0.5rem",
                          }}
                        >
                          No results yet
                        </div>
                      )}
                      <div style={{ marginTop: 8 }}>
                        {(info?.constituencies || [])
                          .slice(0, 4)
                          .map((c, i) => {
                            const topCand = [...(c.candidates || [])].sort(
                              (a, b) => (b.votes || 0) - (a.votes || 0),
                            )[0];
                            return (
                              <Link
                                key={i}
                                to={`/constituencies/${c.constituencyId}`}
                                style={{
                                  textDecoration: "none",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "4px 0",
                                  borderTop: "1px solid #F3F4F6",
                                  fontSize: "0.7rem",
                                }}
                              >
                                <span style={{ color: "#6B7280" }}>
                                  {c.name}
                                </span>
                                <span
                                  style={{
                                    color:
                                      topCand?.votes > 0
                                        ? "#111827"
                                        : "#D1D5DB",
                                    fontWeight: 600,
                                    fontSize: "0.67rem",
                                  }}
                                >
                                  {topCand?.votes > 0
                                    ? `${(topCand.votes || 0).toLocaleString()}`
                                    : "—"}
                                </span>
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  </>
                );
              })()
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 200,
                  color: "#D1D5DB",
                  gap: "0.5rem",
                }}
              >
                <div style={{ fontSize: "2.5rem" }}>🗺️</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                  Hover over a district
                </div>
                <div style={{ fontSize: "0.7rem", color: "#E5E7EB" }}>
                  to see results
                </div>
              </div>
            )}
          </div>

          {/* Party standings */}
          <div
            style={{
              background: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "1rem",
              boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "0.68rem",
                color: "#9CA3AF",
                fontWeight: 700,
                letterSpacing: "1px",
                marginBottom: "0.75rem",
                textTransform: "uppercase",
              }}
            >
              Party Standings
            </div>
            {topParties.length === 0 ? (
              <div
                style={{
                  color: "#D1D5DB",
                  fontSize: "0.8rem",
                  textAlign: "center",
                  padding: "1rem",
                }}
              >
                Results will appear as counting begins
              </div>
            ) : (
              topParties.map((p, i) => {
                const color = partyColor(p.partyName) || "#6B7280";
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0.45rem 0",
                      borderBottom: "1px solid #F9FAFB",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        color:
                          ["#F59E0B", "#9CA3AF", "#CD7F32"][i] || "#D1D5DB",
                        minWidth: 18,
                        textAlign: "center",
                      }}
                    >
                      {i + 1}
                    </span>
                    <div
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 2,
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: "0.78rem",
                        color: "#374151",
                        fontWeight: 600,
                      }}
                    >
                      {partyEn(p.partyName)}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: "1rem", color }}>
                      {p.seatsDeclared || 0}
                    </span>
                    {(p.seatsLeading || 0) > 0 && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: "#D97706",
                          fontWeight: 700,
                        }}
                      >
                        +{p.seatsLeading}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick stats */}
          <div
            style={{
              background: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "1rem",
              boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {[
                {
                  v: summary?.stats?.declaredSeats || 0,
                  l: "Declared",
                  c: "#059669",
                },
                {
                  v: summary?.stats?.countingSeats || 0,
                  l: "Counting",
                  c: "#D97706",
                },
                {
                  v: summary?.stats?.pendingSeats || 0,
                  l: "Pending",
                  c: "#9CA3AF",
                },
                { v: 165, l: "Total FPTP", c: "#3B82F6" },
              ].map((s) => (
                <div
                  key={s.l}
                  style={{
                    background: "#F9FAFB",
                    borderRadius: 10,
                    padding: "0.65rem",
                    textAlign: "center",
                    borderTop: `3px solid ${s.c}`,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "1.6rem",
                      color: s.c,
                      lineHeight: 1,
                    }}
                  >
                    {s.v}
                  </div>
                  <div
                    style={{
                      fontSize: "0.62rem",
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginTop: 2,
                    }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Counting districts live */}
          {geo &&
            (() => {
              const counting = geo.features.filter((f) => {
                const info = getInfo(f);
                return (info?.counting || 0) > 0;
              });
              if (!counting.length) return null;
              return (
                <div
                  style={{
                    background: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    padding: "1rem",
                    boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#D97706",
                      }}
                    ></span>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "#9CA3AF",
                        fontWeight: 700,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                      }}
                    >
                      Live Counting ({counting.length})
                    </span>
                  </div>
                  {counting.slice(0, 6).map((f, i) => {
                    const name =
                      f.properties?.DISTRICT || f.properties?.name || "";
                    const info = getInfo(f);
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.72rem",
                          padding: "3px 0",
                          borderBottom: "1px solid #F9FAFB",
                          color: "#374151",
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{name}</span>
                        <span style={{ color: "#D97706" }}>
                          {info?.counting} counting
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Floating tooltip */}
      <Tooltip
        feature={hovered}
        info={hovered ? getInfo(hovered) : null}
        mouse={mouse}
      />
    </div>
  );
}
