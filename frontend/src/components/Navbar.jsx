import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useApp } from '../context/AppContext';

const Navbar = () => {
  const location = useLocation();
  const { dark, setDark, lang, setLang } = useApp();

  const toggleBg = dark ? '#1F2937' : '#E5E7EB';
  const toggleMuted = dark ? '#6B7280' : '#9CA3AF';

  return (
    <>
      <div className="flag-strip" />
      <nav className="nepal-navbar" style={{ background: dark ? undefined : '#ffffff', borderBottom: dark ? undefined : '1px solid #E5E7EB' }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center">

            {/* Brand */}
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div className="navbar-brand-content">
                <span className="flag-emoji">🇳🇵</span>
                <div className="brand-text">
                  <span className="brand-title" style={{ color: dark ? undefined : '#111827' }}>
                    {lang === 'np' ? 'नेपाल भोट २०८२' : 'Nepal Votes 2082'}
                  </span>
                  <span className="brand-subtitle" style={{ color: dark ? undefined : '#6B7280' }}>
                    {lang === 'np' ? 'लाइभ चुनाव ड्यासबोर्ड' : 'Live Election Dashboard'}
                  </span>
                </div>
                <span className="live-badge">● LIVE</span>
              </div>
            </Link>

            <div className="d-flex align-items-center gap-2">
              {/* Nav links */}
              <div className="d-flex gap-1">
                {[
                  { to: '/', label: lang === 'np' ? 'ड्यासबोर्ड' : 'Dashboard', match: p => p === '/' },
                  { to: '/constituencies', label: lang === 'np' ? 'निर्वाचन क्षेत्र' : 'Constituencies', match: p => p.startsWith('/constituencies') },
                  { to: '/provinces', label: lang === 'np' ? 'प्रदेश' : 'Provinces', match: p => p === '/provinces' },
                  //  { to: '/map', label: lang === 'np' ? 'नक्सा' : 'Map', match: p => p === '/map' },
                ].map(({ to, label, match }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`nav-link-custom ${match(location.pathname) ? 'active' : ''}`}
                    style={{ color: dark ? undefined : (match(location.pathname) ? '#111827' : '#6B7280') }}
                  >
                    {label}
                  </Link>
                ))}
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 22, background: dark ? '#374151' : '#D1D5DB', margin: '0 4px' }} />

              {/* Language toggle */}
              <div style={{ display: 'flex', background: toggleBg, borderRadius: '8px', padding: '3px', gap: '2px' }}>
                {['en', 'np'].map(l => (
                  <button key={l} onClick={() => setLang(l)} style={{
                    background: lang === l ? '#2563EB' : 'transparent',
                    border: 'none',
                    color: lang === l ? 'white' : toggleMuted,
                    borderRadius: '6px', padding: '3px 10px', fontSize: '0.72rem',
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'Mukta, sans-serif',
                    transition: 'all 0.15s', lineHeight: 1.6,
                  }}>
                    {l === 'en' ? 'EN' : 'नेप'}
                  </button>
                ))}
              </div>

              {/* Dark / Light toggle */}
              <div style={{ display: 'flex', background: toggleBg, borderRadius: '8px', padding: '3px', gap: '2px' }}>
                {[{ val: true, icon: '🌙' }, { val: false, icon: '☀️' }].map(({ val, icon }) => (
                  <button key={String(val)} onClick={() => setDark(val)} style={{
                    background: dark === val ? (val ? '#374151' : '#FFFFFF') : 'transparent',
                    border: 'none',
                    color: dark === val ? (val ? '#F9FAFB' : '#374151') : toggleMuted,
                    borderRadius: '6px', padding: '3px 8px', fontSize: '0.85rem',
                    cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1.4,
                    boxShadow: dark === val ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                  }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </Container>
      </nav>
    </>
  );
};

export default Navbar;
