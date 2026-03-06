import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useElectionData } from '../hooks/useElectionData';

const PROVINCE_COLORS = {
  'Koshi': '#FF6B6B',
  'Madhesh': '#FFC107',
  'Bagmati': '#4CAF50',
  'Gandaki': '#2196F3',
  'Lumbini': '#9C27B0',
  'Karnali': '#00BCD4',
  'Sudurpashchim': '#FF5722'
};

const PROVINCE_EMOJIS = {
  'Koshi': '🏔️',
  'Madhesh': '🌾',
  'Bagmati': '🏛️',
  'Gandaki': '🌊',
  'Lumbini': '🕌',
  'Karnali': '🏞️',
  'Sudurpashchim': '🌿'
};

const Provinces = () => {
  const { data: provinces, loading } = useElectionData('/provinces', 30000);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-ring" />
        <span style={{ color: 'var(--nepal-muted)' }}>Loading provinces…</span>
      </div>
    );
  }

  return (
    <Container className="mt-4">
      <h4 style={{ fontFamily: 'Bebas Neue', letterSpacing: '2px', marginBottom: '0.5rem' }}>
        PROVINCE-WISE RESULTS
      </h4>
      <p style={{ color: 'var(--nepal-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Nepal's 7 provinces — {(provinces || []).reduce((s, p) => s + (p.total || 0), 0)} FPTP constituencies
      </p>

      <Row className="g-3">
        {(provinces || []).map(prov => {
          const color = PROVINCE_COLORS[prov.name] || '#607D8B';
          const emoji = PROVINCE_EMOJIS[prov.name] || '🗺️';
          const pct = prov.total > 0 ? Math.round((prov.declared / prov.total) * 100) : 0;

          // Top parties
          const topParties = Object.entries(prov.partyBreakdown || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

          return (
            <Col key={prov.name} lg={6}>
              <Link
                to={`/constituencies?province=${prov.name}`}
                className="province-card"
                style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: '1.5rem' }}>{emoji}</span>
                      <span className="province-name" style={{ color }}>{prov.name}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--nepal-muted)', marginLeft: '2rem' }}>
                      Province
                    </div>
                  </div>
                  <div className="text-end">
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem' }}>
                      {prov.declared}/{prov.total}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--nepal-muted)' }}>seats declared</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="province-progress mb-2">
                  <div className="province-progress-fill" style={{ width: `${pct}%`, background: color }} />
                </div>

                {/* Stats row */}
                <div className="d-flex gap-3 mb-2">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.1rem', color: '#3FB950' }}>
                      {prov.declared}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--nepal-muted)', textTransform: 'uppercase' }}>Declared</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.1rem', color: 'var(--nepal-accent)' }}>
                      {prov.counting}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--nepal-muted)', textTransform: 'uppercase' }}>Counting</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.1rem', color: 'var(--nepal-muted)' }}>
                      {prov.pending}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--nepal-muted)', textTransform: 'uppercase' }}>Pending</div>
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--nepal-muted)' }}>Progress</div>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.3rem', color }}>{pct}%</div>
                  </div>
                </div>

                {/* Leading parties */}
                {topParties.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--nepal-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Leading parties
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      {topParties.map(([party, seats]) => (
                        <span key={party} style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          background: 'var(--nepal-dark)',
                          border: '1px solid var(--nepal-border)',
                          borderRadius: '12px',
                          color: 'var(--nepal-white)'
                        }}>
                          {party.split(' ').map(w => w[0]).join('')}: <strong>{seats}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '0.7rem', color: color, marginTop: '0.75rem', fontWeight: 600 }}>
                  View all {prov.total} constituencies →
                </div>
              </Link>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default Provinces;
