import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useElectionData, useSyncTrigger } from '../hooks/useElectionData';
import { PartyFlag, partyColor, partyEn, partyShort, PARTY_COLORS, PARTY_EN, PARTY_SHORT } from '../constants/parties';









const PROVINCE_COLORS = {
  Koshi: '#3B82F6',
  Madhesh: '#F59E0B',
  Bagmati: '#10B981',
  Gandaki: '#6366F1',
  Lumbini: '#EC4899',
  Karnali: '#14B8A6',
  Sudurpashchim: '#F97316'
};

const MAJORITY = 138;
const TOTAL_FPTP = 165;
const TOTAL_SEATS = 275;

function pc(name) { return partyColor(name); }
function pe(name) { return partyEn(name); }
function ps(name) { return partyShort(name); }

/* ── Shared UI ─────────────────────────────────────────────── */
// PartyLogo now uses shared PartyFlag from constants/parties.js
const PartyLogo = ({ partyName, size = 24 }) => (
  <PartyFlag name={partyName} size={size} />
);

const StatBox = ({ value, label, color, sub }) => (
  <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', padding: '1.25rem 1rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color }} />
    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.4rem', color, lineHeight: 1, marginBottom: '2px' }}>{value}</div>
    <div style={{ fontSize: '0.68rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
    {sub && <div style={{ fontSize: '0.62rem', color: '#4B5563', marginTop: '3px' }}>{sub}</div>}
  </div>
);

/* ── Majority Bar ──────────────────────────────────────────── */
const MajorityBar = ({ parties }) => {
  const topParties = parties.slice(0, 6);
  const majorityPct = (MAJORITY / TOTAL_FPTP) * 100;

  return (
    <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 600 }}>SEAT DISTRIBUTION — FPTP (165 seats)</span>
        <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>Majority: {MAJORITY} seats</span>
      </div>

      <div style={{ height: '30px', background: '#1F2937', borderRadius: '7px', overflow: 'hidden', display: 'flex', position: 'relative', marginBottom: '0.75rem' }}>
        {topParties.map((p, i) => {
          const w = ((p.seatsDeclared || 0) / TOTAL_FPTP) * 100;
          if (w <= 0) return null;

          return (
            <div
              key={i}
              title={`${pe(p.partyName)}: ${p.seatsDeclared || 0}`}
              style={{
                width: `${w}%`,
                background: pc(p.partyName),
                transition: 'width 1s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {w > 4 && (
                <span style={{ fontSize: '0.62rem', color: 'white', fontWeight: 700 }}>
                  {p.seatsDeclared}
                </span>
              )}
            </div>
          );
        })}

        <div style={{ position: 'absolute', left: `${majorityPct}%`, top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.7)', zIndex: 2 }} />
        <div style={{ position: 'absolute', left: `${majorityPct}%`, top: '-20px', transform: 'translateX(-50%)', fontSize: '0.58rem', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
          ← {MAJORITY}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        {topParties
          .filter(p => (p.seatsDeclared || 0) > 0 || (p.seatsLeading || 0) > 0)
          .map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PartyLogo partyName={p.partyName} size={18} color={pc(p.partyName)} />
              <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{ps(p.partyName)}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

/* ── Party Row ─────────────────────────────────────────────── */
const PartyRow = ({ party, rank }) => {
  const color = pc(party.partyName);
  const declared = party.seatsDeclared || 0;
  const leading = party.seatsLeading || 0;
  const total = declared + leading;
  const barW = Math.min((total / MAJORITY) * 100, 100);
  const rankColors = ['#F59E0B', '#9CA3AF', '#CD7F32'];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.8rem 0.95rem',
        background: '#111827',
        border: '1px solid #1F2937',
        borderRadius: '10px',
        marginBottom: '0.5rem',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#1F2937')}
    >
      <span
        style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '1.3rem',
          color: rankColors[rank - 1] || '#4B5563',
          minWidth: '22px',
          textAlign: 'center',
        }}
      >
        {rank}
      </span>

      <PartyLogo partyName={party.partyName} size={28} color={color} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: '0.88rem',
            color: '#F9FAFB',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {pe(party.partyName)}
        </div>

        <div style={{ height: '4px', background: '#1F2937', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${barW}%`,
              background: color,
              borderRadius: '2px',
              transition: 'width 1s ease',
            }}
          />
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.5rem', color }}>
          {declared}
        </span>
        {leading > 0 && <span style={{ fontSize: '0.7rem', color: '#F59E0B', marginLeft: '4px' }}>+{leading}</span>}
        <div style={{ fontSize: '0.6rem', color: '#4B5563', textAlign: 'right' }}>seats won</div>
      </div>
    </div>
  );
};

/* ── Province Card ─────────────────────────────────────────── */
const ProvinceCard = ({ prov }) => {
  const color = PROVINCE_COLORS[prov.name] || '#6B7280';
  const pct = prov.total > 0 ? Math.round((prov.declared / prov.total) * 100) : 0;
  const topParty = Object.entries(prov.partyBreakdown || {}).sort((a, b) => b[1] - a[1])[0];

  return (
    <Link to={`/constituencies?province=${prov.name}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          background: '#111827',
          border: `1px solid #1F2937`,
          borderRadius: '10px',
          padding: '1rem',
          borderLeft: `3px solid ${color}`,
          transition: 'all 0.18s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.boxShadow = `0 4px 16px ${color}20`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#1F2937';
          e.currentTarget.style.borderLeftColor = color;
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
          <div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '1.5px', color: '#F9FAFB' }}>
              {prov.name}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#6B7280' }}>{prov.total} constituencies</div>
          </div>
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color }}>{pct}%</span>
        </div>

        <div style={{ height: '5px', background: '#1F2937', borderRadius: '3px', marginBottom: '0.6rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 1s ease' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
          <span style={{ color: '#10B981' }}>✓ {prov.declared} declared</span>
          <span style={{ color: '#F59E0B' }}>⟳ {prov.counting} counting</span>
          {topParty && <span style={{ color: '#9CA3AF' }}>{ps(topParty[0])}: {topParty[1]}</span>}
        </div>
      </div>
    </Link>
  );
};

/* ── Main Dashboard ────────────────────────────────────────── */
const Dashboard = () => {
  const { data: summary, loading } = useElectionData('/summary', 30000);
  const { data: provinces } = useElectionData('/provinces', 30000);
  const { syncing, triggerSync } = useSyncTrigger();

  const formatTime = d =>
    d
      ? new Date(d).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      : '—';

  if (loading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
          background: '#0B0F1A',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            border: '3px solid #1F2937',
            borderTopColor: '#DC2626',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ color: '#6B7280', fontFamily: 'Mukta, sans-serif' }}>Loading election results…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const { parties = [], stats = {} } = summary || {};
  const topParties = parties.slice(0, 8);

  const chartData = topParties
    .map(p => ({
      name: ps(p.partyName),
      fullName: pe(p.partyName),
      partyName: p.partyName,
      Declared: p.seatsDeclared || 0,
      Leading: p.seatsLeading || 0,
      color: pc(p.partyName),
    }))
    .filter(p => p.Declared + p.Leading > 0);

  const declared = stats.declaredSeats || 0;
  const counting = stats.countingSeats || 0;
  const pending = stats.pendingSeats || 0;
  const progressPct = TOTAL_FPTP > 0 ? Math.round((declared / TOTAL_FPTP) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#0B0F1A', fontFamily: 'Mukta, sans-serif' }}>
      <div
        style={{
          background: 'linear-gradient(180deg, #0F1923 0%, #0B0F1A 100%)',
          borderBottom: '1px solid #1F2937',
          padding: '2.5rem 0 2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: '5%',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '12rem',
            opacity: 0.04,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          🇳🇵
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.4)',
                color: '#EF4444',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '20px',
                letterSpacing: '1.5px',
                animation: 'livePulse 1.5s infinite',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
              LIVE
            </span>
            <span style={{ fontSize: '0.7rem', color: '#4B5563' }}>Refreshes every 30 seconds</span>
          </div>

          <h1
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: 'clamp(2rem, 5vw, 3.8rem)',
              letterSpacing: '4px',
              color: '#F9FAFB',
              lineHeight: 1.05,
              marginBottom: '0.4rem',
            }}
          >
            Nepal Election Results <span style={{ color: '#3B82F6' }}>2082</span>
            <span style={{ color: '#EF4444', marginLeft: '0.3rem' }}>(2026)</span>
          </h1>

          <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '1.25rem', maxWidth: 600 }}>
            Live vote count for Nepal&apos;s House of Representatives (Pratinidhi Sabha) General Election.
            Data from{' '}
            <a
              href="https://result.election.gov.np"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#3B82F6', textDecoration: 'none' }}
            >
              Election Commission of Nepal
            </a>.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: 200, maxWidth: 500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6B7280', marginBottom: '5px' }}>
                <span>Counting progress</span>
                <span style={{ color: '#F9FAFB', fontWeight: 600 }}>
                  {declared} / {TOTAL_FPTP} seats declared · {progressPct}%
                </span>
              </div>
              <div style={{ height: '8px', background: '#1F2937', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressPct}%`,
                    background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
                    borderRadius: '4px',
                    transition: 'width 1s ease',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              {stats.lastUpdated && (
                <span style={{ fontSize: '0.7rem', color: '#4B5563' }}>Updated {formatTime(stats.lastUpdated)}</span>
              )}

              <a
                href="https://result.election.gov.np"
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'transparent',
                  border: '1px solid #1F2937',
                  color: '#9CA3AF',
                  fontSize: '0.72rem',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                🔗 Official ECN
              </a>

              <button
                onClick={triggerSync}
                disabled={syncing}
                style={{
                  background: syncing ? '#1F2937' : 'transparent',
                  border: '1px solid #EF4444',
                  color: '#EF4444',
                  fontSize: '0.72rem',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (!syncing) {
                    e.currentTarget.style.background = '#EF4444';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = syncing ? '#1F2937' : 'transparent';
                  e.currentTarget.style.color = '#EF4444';
                }}
              >
                {syncing ? '⟳ Syncing…' : '⟳ Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '1.5rem' }}>
        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <StatBox value={declared} label="Seats Declared" color="#10B981" sub={`of ${TOTAL_FPTP} FPTP`} />
          <StatBox value={counting} label="Counting" color="#F59E0B" />
          <StatBox value={pending} label="Pending" color="#6B7280" />
          <StatBox value={TOTAL_SEATS} label="Total Seats" color="#3B82F6" sub="165 FPTP + 110 PR" />
        </div>

        {topParties.length > 0 && <MajorityBar parties={topParties} />}

        <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: '1.3rem',
                  letterSpacing: '2px',
                  color: '#F9FAFB',
                  margin: 0,
                }}
              >
                PARTY STANDINGS
              </h2>
              <Link to="/constituencies" style={{ fontSize: '0.75rem', color: '#3B82F6', textDecoration: 'none' }}>
                View all constituencies →
              </Link>
            </div>

            {topParties.length === 0 ? (
              <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#4B5563' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                <div>Results will appear here as counting begins</div>
                <div style={{ fontSize: '0.78rem', marginTop: '0.4rem', color: '#374151' }}>
                  Data source: {stats.dataSource}
                </div>
              </div>
            ) : (
              topParties.map((p, i) => <PartyRow key={p.partyName} party={p} rank={i + 1} />)
            )}

            {chartData.length > 0 && (
              <div
                style={{
                  background: '#111827',
                  border: '1px solid #1F2937',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginTop: '1rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, letterSpacing: '1px', marginBottom: '0.75rem' }}>
                  SEATS WON
                </div>

                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#1C2128',
                        border: '1px solid #1F2937',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                      }}
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      formatter={(value, name, props) => [value, props?.payload?.fullName || name]}
                    />
                    <Bar dataKey="Declared" radius={[4, 4, 0, 0]}>
                      {chartData.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.55rem', marginTop: '1rem' }}>
                  {chartData.map((item, i) => (
                    <div
                      key={`${item.partyName}-${i}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        padding: '0.45rem 0.55rem',
                        background: '#0F172A',
                        border: '1px solid #1F2937',
                        borderRadius: '8px',
                      }}
                    >
                      <PartyLogo partyName={item.partyName} size={22} color={item.color} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.73rem',
                            color: '#F9FAFB',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.fullName}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: 'Bebas Neue, sans-serif',
                          fontSize: '1rem',
                          color: item.color,
                          lineHeight: 1,
                        }}
                      >
                        {item.Declared}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', padding: '1.1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 700, letterSpacing: '1px', marginBottom: '0.75rem' }}>
                ELECTION OVERVIEW
              </div>
              {[
                ['Date', 'March 5, 2026 (Falgun 21, 2082)'],
                ['Total Seats', '275 (165 FPTP + 110 PR)'],
                ['Constituencies', '165 FPTP across 7 provinces'],
                ['Registered Voters', '~18.9 million'],
                ['Total Candidates', '3,406 from 68+ parties'],
                ['Majority Required', `${MAJORITY} seats`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0',
                    borderBottom: '1px solid #1F2937',
                    fontSize: '0.78rem',
                  }}
                >
                  <span style={{ color: '#6B7280' }}>{k}</span>
                  <span style={{ color: '#D1D5DB', fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '12px', padding: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 700, letterSpacing: '1px' }}>PROVINCES</div>
                <Link to="/provinces" style={{ fontSize: '0.7rem', color: '#3B82F6', textDecoration: 'none' }}>
                  View all →
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(provinces || []).map(prov => (
                  <ProvinceCard key={prov.name} prov={prov} />
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '0.85rem 1rem', marginTop: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#60A5FA', fontWeight: 600, marginBottom: '3px' }}>📡 DATA SOURCE</div>
              <div style={{ fontSize: '0.7rem', color: '#6B7280', lineHeight: 1.5 }}>
                Data fetched from the official{' '}
                <a href="https://result.election.gov.np" target="_blank" rel="noreferrer" style={{ color: '#3B82F6' }}>
                  Election Commission of Nepal
                </a>
                . Not affiliated with ECN or any political party.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes livePulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }

        @media (max-width: 900px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }

        @media (max-width: 600px) {
          .stat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;