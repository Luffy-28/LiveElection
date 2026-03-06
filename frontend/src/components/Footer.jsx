import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => (
  <footer className="nepal-footer">
    <Container>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <span style={{ color: 'var(--nepal-muted)', fontSize: '0.8rem' }}>
            🇳🇵 Nepal Election Dashboard 2082 · Data sourced from{' '}
            <a href="https://result.election.gov.np" target="_blank" rel="noreferrer"
              style={{ color: 'var(--nepal-crimson)' }}>
              Election Commission of Nepal
            </a>
          </span>
        </div>
        <div style={{ color: 'var(--nepal-muted)', fontSize: '0.75rem' }}>
          Auto-refreshes every 30 seconds · Not affiliated with ECN
        </div>
      </div>
    </Container>
  </footer>
);

export default Footer;
