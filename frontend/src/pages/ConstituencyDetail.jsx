import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useElectionData } from '../hooks/useElectionData';
import { useApp } from '../context/AppContext';
import { T, PROVINCE_NAMES_NP } from '../constants/translations';
import { PartyFlag, partyColor, partyEn, PARTY_EN } from '../constants/parties';

const CANDIDATE_PHOTO_BASE = '/api/photo';

const COLORS = [
  '#DC143C',
  '#1565C0',
  '#E53935',
  '#FF6F00',
  '#6A1B9A',
  '#455A64',
  '#2E7D32',
  '#F57C00',
  '#7B1FA2',
  '#546E7A',
  '#43A047',
  '#FB8C00',
];



function candidatePhotoUrl(candidateId) {
  return `${CANDIDATE_PHOTO_BASE}/${candidateId}`;
}

function partyLogoUrl(partyName) { return null; } // now using PartyFlag component

function partyDisplayName(partyName) { return partyEn(partyName); }

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

function avatarBg(name = '') {
  const colors = ['#1E3A5F', '#064E3B', '#78350F', '#4C1D95', '#7F1D1D', '#0F4C5C', '#1E3A8A', '#14532D'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

const CandidatePhoto = ({ candidateId, name, size = 54 }) => {
  const [failed, setFailed] = React.useState(false);
  const bg = avatarBg(name);

  if (!candidateId || failed) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.9)',
          fontWeight: 700,
          fontSize: size * 0.28,
          flexShrink: 0,
        }}
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      src={candidatePhotoUrl(candidateId)}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        background: bg,
      }}
    />
  );
};

// Uses shared PartyFlag from constants/parties.js
const PartyLogo = ({ partyName, size = 24 }) => (
  <PartyFlag name={partyName} size={size} />
);

const ConstituencyDetail = () => {
  const { dark, lang } = useApp();
  const t = T[lang];
  const { id } = useParams();
  const { data: c, loading } = useElectionData(`/constituencies/${id}`, 15000);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-ring" />
        <span style={{ color: 'var(--nepal-muted)' }}>Loading constituency…</span>
      </div>
    );
  }

  if (!c) {
    return (
      <Container className="mt-4">
        <p>Constituency not found.</p>
        <Link to="/constituencies" style={{ color: 'var(--nepal-crimson)' }}>
          ← Back
        </Link>
      </Container>
    );
  }

  const sortedCandidates = [...(c.candidates || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const totalVotes = c.totalVotesCounted || 0;
  const leader = sortedCandidates[0];

  const normalizedCandidates = sortedCandidates.map((cand, i) => ({
    ...cand,
    rank: i + 1,
    votes: cand.votes || 0,
    partyName: cand.partyName || cand.party || 'Independent',
    partyLabel: partyDisplayName(cand.partyName || cand.party || 'Independent'),
    pct: totalVotes > 0 ? ((cand.votes || 0) / totalVotes) * 100 : 0,
  }));

  const pieData = normalizedCandidates
    .filter((cand) => cand.votes > 0)
    .map((cand, i) => ({
      name: cand.partyLabel,
      partyName: cand.partyName,
      value: cand.votes,
      pct: cand.pct,
      color: COLORS[i % COLORS.length],
    }));

  const winnerCandidate = normalizedCandidates.find((x) => x.isWinner) || normalizedCandidates[0];

  const statusBadge = {
    declared: <span className="status-badge status-declared">✓ Result Declared</span>,
    counting: <span className="status-badge status-counting">⟳ Counting in Progress</span>,
    pending: <span className="status-badge status-pending">○ Pending</span>,
  }[c.status] || <span className="status-badge status-pending">○ Pending</span>;

  return (
    <Container className="mt-4">
      <Link
        to="/constituencies"
        style={{ color: 'var(--nepal-muted)', textDecoration: 'none', fontSize: '0.85rem' }}
      >
        ← Back to all constituencies
      </Link>

      <div
        style={{
          background: 'var(--nepal-card)',
          border: '1px solid var(--nepal-border)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginTop: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span
                style={{
                  fontFamily: 'Bebas Neue',
                  fontSize: '1.5rem',
                  color: 'var(--nepal-crimson)',
                }}
              >
                Constituency #{c.constituencyId}
              </span>
              {statusBadge}
            </div>

            <h2
              style={{
                fontFamily: 'Bebas Neue',
                letterSpacing: '2px',
                marginBottom: '0.25rem',
              }}
            >
              {lang === 'np' ? (c.nameNp || c.name) : (c.name || c.constituencyName)}
            </h2>

            <p style={{ color: 'var(--nepal-muted)', fontSize: '0.85rem', marginBottom: 0 }}>
              {c.province} Province · {c.district} District
            </p>
          </div>

          <div className="text-end">
            <div style={{ color: 'var(--nepal-muted)', fontSize: '0.75rem' }}>{t.detailTotalVotes}</div>
            <div
              style={{
                fontFamily: 'Bebas Neue',
                fontSize: '1.8rem',
                color: 'var(--nepal-white)',
              }}
            >
              {totalVotes.toLocaleString()}
            </div>
          </div>
        </div>

        {winnerCandidate && (c.status === 'declared' || c.status === 'counting') && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.9rem 1rem',
              background:
                c.status === 'declared' ? 'rgba(35,134,54,0.1)' : 'rgba(245,158,11,0.1)',
              border:
                c.status === 'declared'
                  ? '1px solid var(--nepal-green)'
                  : '1px solid var(--nepal-accent)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
            }}
          >
            <CandidatePhoto
              candidateId={winnerCandidate.candidateId}
              name={winnerCandidate.name}
              size={58}
            />

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>
                {winnerCandidate.name}{' '}
                {c.status === 'declared' ? '🏆' : '📊'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--nepal-muted)' }}>
                {winnerCandidate.partyLabel} · {winnerCandidate.votes.toLocaleString()} votes ·{' '}
                {winnerCandidate.pct.toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>

      <Row className="g-4">
        <Col lg={7}>
          <h5
            style={{
              fontFamily: 'Bebas Neue',
              letterSpacing: '2px',
              marginBottom: '1rem',
            }}
          >
            {t.detailCandidates}
          </h5>

          {normalizedCandidates.map((cand, i) => {
            const isWinner = c.status === 'declared' && (cand.isWinner || i === 0);
            const isLeading = c.status === 'counting' && i === 0 && !isWinner;

            return (
              <div
                key={cand.candidateId || `${cand.name}-${i}`}
                className={`candidate-row ${isWinner ? 'winner' : isLeading ? 'leading' : ''}`}
                style={{
                  display: 'flex',
                  gap: '0.9rem',
                  alignItems: 'center',
                  padding: '0.95rem 1rem',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Bebas Neue',
                    fontSize: '1.3rem',
                    color: isWinner
                      ? '#FACC15'
                      : isLeading
                        ? 'var(--nepal-accent)'
                        : 'var(--nepal-muted)',
                    minWidth: '28px',
                    textAlign: 'center',
                  }}
                >
                  {cand.rank}
                </div>

                <CandidatePhoto candidateId={cand.candidateId} name={cand.name} size={54} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="d-flex justify-content-between align-items-center mb-1 gap-2">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--nepal-white)' }}>{lang === 'np' && cand.nameNp ? cand.nameNp : cand.name}</div>
                      {!!cand.nameNp && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--nepal-muted)' }}>
                          {cand.nameNp}
                        </div>
                      )}
                    </div>

                    <div className="text-end">
                      <span style={{ fontFamily: 'Bebas Neue', fontSize: '1.1rem' }}>
                        {cand.votes.toLocaleString()}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--nepal-muted)',
                          marginLeft: '4px',
                        }}
                      >
                        ({cand.pct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                    <PartyLogo
                      partyName={cand.partyName}
                      size={20}
                      color={COLORS[i % COLORS.length]}
                    />
                    <span
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--nepal-muted)',
                        fontWeight: 500,
                      }}
                    >
                      {cand.partyLabel}
                    </span>
                  </div>

                  <div
                    style={{
                      height: '6px',
                      background: 'var(--nepal-border)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      className="vote-bar"
                      style={{
                        width: `${cand.pct}%`,
                        height: '100%',
                        background: isWinner
                          ? '#FACC15'
                          : isLeading
                            ? 'var(--nepal-accent)'
                            : COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>

                {(isWinner || isLeading) && <span>{isWinner ? '🏆' : '📊'}</span>}
              </div>
            );
          })}
        </Col>

        <Col lg={5}>
          {pieData.length > 0 && (
            <div
              style={{
                background: 'var(--nepal-card)',
                border: '1px solid var(--nepal-border)',
                borderRadius: '12px',
                padding: '1.25rem',
              }}
            >
              <h6
                style={{
                  fontFamily: 'Bebas Neue',
                  letterSpacing: '2px',
                  marginBottom: '1rem',
                }}
              >
                {t.detailVoteShare}
              </h6>

              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      background: dark ? '#1C2128' : '#FFFFFF',
                      border: '1px solid var(--nepal-border)',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                    }}
                    formatter={(value) => [Number(value).toLocaleString(), 'Votes']}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-3">
                {pieData.map((entry, i) => (
                  <div
                    key={`${entry.partyName}-${i}`}
                    className="d-flex align-items-center gap-2 mb-2"
                    style={{
                      paddingBottom: '0.45rem',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <PartyLogo
                      partyName={entry.partyName}
                      size={24}
                      color={entry.color}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--nepal-white)',
                          lineHeight: 1.2,
                          fontWeight: 500,
                        }}
                      >
                        {entry.name}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--nepal-muted)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.pct.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              background: 'var(--nepal-card)',
              border: '1px solid var(--nepal-border)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginTop: '1rem',
            }}
          >
            <h6
              style={{
                fontFamily: 'Bebas Neue',
                letterSpacing: '2px',
                marginBottom: '1rem',
              }}
            >
              {t.detailInfo}
            </h6>

            {[
              { label: t.detailProvince, value: lang === 'np' ? (PROVINCE_NAMES_NP[c.province] || c.province) : c.province },
              { label: t.detailDistrict, value: c.district },
              { label: t.detailTotalCandidates, value: c.candidates?.length || 0 },
              { label: t.detailVotesCounted, value: totalVotes.toLocaleString() },
              {
                label: t.detailStatus,
                value: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : '—',
              },
              {
                label: t.detailLastUpdated,
                value: c.lastUpdated ? new Date(c.lastUpdated).toLocaleString() : '—',
              },
            ].map((row) => (
              <div
                key={row.label}
                className="d-flex justify-content-between py-2"
                style={{
                  borderBottom: '1px solid var(--nepal-border)',
                  fontSize: '0.82rem',
                }}
              >
                <span style={{ color: 'var(--nepal-muted)' }}>{row.label}</span>
                <span style={{ fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ConstituencyDetail;