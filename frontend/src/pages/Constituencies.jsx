import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useElectionData } from '../hooks/useElectionData';
import { PartyFlag, partyColor, partyEn, PARTY_COLORS } from '../constants/parties';
import { useApp } from '../context/AppContext';

/* ── i18n ────────────────────────────────────────────────────── */
const T = {
  en: {
    title: 'Candidates', year: '2082', subtitle: 'All candidates across 165 constituencies',
    search: 'Search by name, constituency, district or party…',
    allProvinces: 'All Provinces', allDistricts: 'All Districts',
    allConstituencies: 'All Constituencies', allParties: 'All Parties',
    all: 'All', declared: 'Declared', counting: 'Counting', pending: 'Pending',
    favourites: '★ Favourites', male: '♂ Male', female: '♀ Female',
    sort: 'Sort:', votes: 'Votes', nameAZ: 'Name A–Z', constituency: 'Constituency',
    showing: 'Showing', candidates: 'candidates', withVotes: 'with votes',
    noResults: 'No candidates found', loading: 'Loading candidates…',
    winner: 'Winner', leading: 'Leading', province: 'Province',
    addFav: 'Add to favourites', removeFav: 'Remove from favourites',
    noFavs: 'No favourites yet', noFavsHint: 'Click ★ on any candidate card to save them here',
    showMore: 'Show more', darkMode: 'Dark', lightMode: 'Light',
  },
  np: {
    title: 'उम्मेदवारहरू', year: '२०८२', subtitle: 'सबै १६५ निर्वाचन क्षेत्रका उम्मेदवारहरू',
    search: 'नाम, निर्वाचन क्षेत्र, जिल्ला वा दल खोज्नुहोस्…',
    allProvinces: 'सबै प्रदेश', allDistricts: 'सबै जिल्ला',
    allConstituencies: 'सबै क्षेत्र', allParties: 'सबै दल',
    all: 'सबै', declared: 'घोषित', counting: 'मतगणना', pending: 'बाँकी',
    favourites: '★ मनपर्ने', male: '♂ पुरुष', female: '♀ महिला',
    sort: 'क्रम:', votes: 'मत', nameAZ: 'नाम अ–ज', constituency: 'क्षेत्र',
    showing: 'देखाइएको', candidates: 'उम्मेदवार', withVotes: 'मत सहित',
    noResults: 'कुनै उम्मेदवार फेला परेन', loading: 'लोड हुँदैछ…',
    winner: 'विजयी', leading: 'अग्रणी', province: 'प्रदेश',
    addFav: 'मनपर्नेमा थप्नुहोस्', removeFav: 'मनपर्नेबाट हटाउनुहोस्',
    noFavs: 'अझै मनपर्ने छैन', noFavsHint: '★ थिचेर उम्मेदवार बचत गर्नुहोस्',
    showMore: 'थप देखाउनुहोस्', darkMode: 'डार्क', lightMode: 'लाइट',
  }
};

/* ── Province config ─────────────────────────────────────────── */
const PROVINCES_EN = ['All Provinces', 'Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];
const PROVINCES_NP = ['सबै प्रदेश', 'कोशी', 'मधेश', 'बागमती', 'गण्डकी', 'लुम्बिनी', 'कर्णाली', 'सुदूरपश्चिम'];
const PROVINCE_COLORS = {
  Koshi: '#3B82F6', Madhesh: '#F59E0B', Bagmati: '#10B981',
  Gandaki: '#6366F1', Lumbini: '#EC4899', Karnali: '#14B8A6', Sudurpashchim: '#F97316'
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
function photoUrl(id) {
  if (!id) return "";
  return `${API_BASE_URL}/api/photo/${id}`;
}
function pc(n) { return partyColor(n); }
function pe(n) { return partyEn(n); }
function avatarBg(name) {
  const colors = ['#1E3A5F', '#064E3B', '#78350F', '#4C1D95', '#7F1D1D', '#0F4C5C', '#1E3A8A', '#14532D'];
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}
function initials(name) {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0].substring(0, 2).toUpperCase();
}
function flattenCandidates(constituencies) {
  const out = [];
  for (const c of constituencies) {
    for (const cand of (c.candidates || [])) {
      out.push({
        ...cand, constituencyId: c.constituencyId, constituencyName: c.name,
        constituencyNameNp: c.nameNp, province: c.province, district: c.district,
        constituencyStatus: c.status
      });
    }
  }
  return out;
}

/* ── Photo component ─────────────────────────────────────────── */
const CandidatePhoto = ({ candidateId, name, size, fallbackBg }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [candidateId]);

  const src = photoUrl(candidateId);

  if (failed || !candidateId) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: fallbackBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.3 + "px",
          fontWeight: 700,
          color: "rgba(255,255,255,0.85)",
          fontFamily: "Mukta, sans-serif",
        }}
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => {
        console.log("Image failed:", src, "candidateId:", candidateId);
        setFailed(true);
      }}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
};

/* ── Candidate Card ──────────────────────────────────────────── */
const CandidateCard = ({ candidate, isFav, onToggleFav, dark, lang }) => {
  const t = T[lang];
  const color = pc(candidate.partyName);
  const isWinner = candidate.isWinner;
  const isLeading = candidate.isLeading && !isWinner;
  const hasVotes = (candidate.votes || 0) > 0;
  const bg = avatarBg(candidate.name);

  const cardBg = dark
    ? (isWinner ? 'linear-gradient(135deg,#0D2818,#0F1F2E)' : '#111827')
    : (isWinner ? 'linear-gradient(135deg,#ECFDF5,#EFF6FF)' : '#FFFFFF');
  const cardBorder = dark
    ? (isWinner ? 'rgba(16,185,129,0.35)' : '#1F2937')
    : (isWinner ? 'rgba(16,185,129,0.5)' : '#E5E7EB');
  const namecol = dark ? '#F9FAFB' : '#111827';
  const subcol = dark ? '#6B7280' : '#9CA3AF';
  const constcol = dark ? '#4B5563' : '#9CA3AF';

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* Favourite button */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleFav(candidate.candidateId); }}
        title={isFav ? t.removeFav : t.addFav}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 10,
          background: isFav ? '#F59E0B' : (dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'),
          border: `1px solid ${isFav ? '#F59E0B' : (dark ? '#374151' : '#E5E7EB')}`,
          borderRadius: '50%', width: 30, height: 30, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem', transition: 'all 0.15s', color: isFav ? 'white' : (dark ? '#6B7280' : '#9CA3AF'),
        }}
      >{isFav ? '★' : '☆'}</button>

      <Link to={`/constituencies/${candidate.constituencyId}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        <div
          style={{
            background: cardBg, border: `1px solid ${cardBorder}`,
            borderRadius: '14px', padding: '1.1rem 1rem 1rem',
            transition: 'all 0.18s', position: 'relative', overflow: 'hidden',
            cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column',
            boxSizing: 'border-box',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}28`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
        >
          {/* Winner/Leading strip */}
          {isWinner && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#10B981,#34D399)' }} />}
          {isLeading && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#F59E0B,#FCD34D)' }} />}

          {/* Status badge top-left */}
          {(isWinner || isLeading) && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: isWinner ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
              border: `1px solid ${isWinner ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
              color: isWinner ? '#10B981' : '#F59E0B',
              fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
              letterSpacing: '0.5px', textTransform: 'uppercase'
            }}>
              {isWinner ? (lang === 'np' ? t.winner : '🏆 ' + t.winner) : '▲ ' + t.leading}
            </div>
          )}

          {/* Photo + Name row */}
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginTop: (isWinner || isLeading) ? '1.4rem' : '0.2rem', marginBottom: '0.85rem' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 68, height: 68, borderRadius: '50%', background: bg,
                border: `3px solid ${isWinner ? '#10B981' : isLeading ? '#F59E0B' : (dark ? '#1F2937' : '#E5E7EB')}`,
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CandidatePhoto candidateId={candidate.candidateId} name={candidate.name} size={68} fallbackBg={bg} />
              </div>
              {/* Party flag mini badge */}
              <div style={{ position: 'absolute', bottom: -2, right: -4, borderRadius: '4px', overflow: 'hidden', border: `2px solid ${dark ? '#111827' : '#fff'}` }}>
                <PartyFlag name={candidate.partyName} size={22} />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: namecol, lineHeight: 1.25, marginBottom: '2px', paddingRight: '28px' }}>
                {lang === 'np' ? (candidate.nameNp || candidate.name) : candidate.name}
              </div>
              <div style={{ fontSize: '0.68rem', color: subcol, marginBottom: '5px', fontFamily: 'Mukta, sans-serif' }}>
                {lang === 'np' ? candidate.name : candidate.nameNp}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <PartyFlag name={candidate.partyName} size={28} />
                <span style={{ fontSize: '0.65rem', color: dark ? '#9CA3AF' : '#6B7280', lineHeight: 1.3 }}>
                  {pe(candidate.partyName)}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
            <span style={{
              background: `${PROVINCE_COLORS[candidate.province] || '#6B7280'}18`,
              color: PROVINCE_COLORS[candidate.province] || '#6B7280',
              border: `1px solid ${PROVINCE_COLORS[candidate.province] || '#6B7280'}35`,
              fontSize: '0.6rem', fontWeight: 600, padding: '2px 7px', borderRadius: '4px'
            }}>
              {lang === 'np' ? PROVINCES_NP[PROVINCES_EN.indexOf(candidate.province)] || candidate.province : candidate.province}
            </span>
            <span style={{
              background: dark ? '#1F2937' : '#F3F4F6', color: dark ? '#9CA3AF' : '#6B7280',
              fontSize: '0.6rem', padding: '2px 7px', borderRadius: '4px'
            }}>{candidate.district}</span>
          </div>

          {/* Constituency */}
          <div style={{ fontSize: '0.7rem', color: constcol, marginBottom: '0.7rem', fontStyle: 'italic', flex: 1 }}>
            {lang === 'np' ? (candidate.constituencyNameNp || candidate.constituencyName) : candidate.constituencyName}
          </div>

          {/* Votes + gender */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '0.62rem', color: dark ? '#6B7280' : '#9CA3AF' }}>{t.votes}</span>
              <span style={{
                fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem',
                color: hasVotes ? (isWinner ? '#10B981' : isLeading ? '#F59E0B' : color) : (dark ? '#374151' : '#D1D5DB'),
                letterSpacing: '1px'
              }}>
                {hasVotes ? (candidate.votes || 0).toLocaleString() : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              {candidate.gender && (
                <span style={{ fontSize: '0.62rem', color: candidate.gender === 'F' ? '#EC4899' : '#60A5FA' }}>
                  {candidate.gender === 'F' ? t.female : t.male}
                </span>
              )}
              <span style={{
                background: candidate.constituencyStatus === 'declared' ? 'rgba(16,185,129,0.12)'
                  : candidate.constituencyStatus === 'counting' ? 'rgba(251,191,36,0.12)' : 'rgba(107,114,128,0.12)',
                color: candidate.constituencyStatus === 'declared' ? '#10B981'
                  : candidate.constituencyStatus === 'counting' ? '#FBBF24' : '#9CA3AF',
                border: `1px solid ${candidate.constituencyStatus === 'declared' ? 'rgba(16,185,129,0.3)'
                  : candidate.constituencyStatus === 'counting' ? 'rgba(251,191,36,0.3)' : 'rgba(107,114,128,0.3)'}`,
                fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px',
                textTransform: 'uppercase', letterSpacing: '0.4px'
              }}>
                {candidate.constituencyStatus === 'declared' ? t.declared
                  : candidate.constituencyStatus === 'counting' ? t.counting : t.pending}
              </span>
            </div>
          </div>

          {/* Vote bar */}
          {hasVotes && (
            <div style={{ marginTop: '0.5rem', height: '3px', background: dark ? '#1F2937' : '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min((candidate.votes / 15000) * 100, 100)}%`,
                background: isWinner ? '#10B981' : color, borderRadius: '2px', transition: 'width 0.8s ease'
              }} />
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────────── */
const Constituencies = () => {
  const [province, setProvince] = useState('All Provinces');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [constituencyFilter, setConstituencyFilter] = useState('All Constituencies');
  const [partyFilter, setPartyFilter] = useState('All Parties');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Votes');
  const [genderFilter, setGenderFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('All');  // All | Favourites
  const [favourites, setFavourites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nepElecFavs') || '[]'); } catch { return []; }
  });
  const [visibleCount, setVisibleCount] = useState(60);
  const { dark, lang } = useApp();
  const t = T[lang];

  // Persist favourites
  useEffect(() => {
    localStorage.setItem('nepElecFavs', JSON.stringify(favourites));
  }, [favourites]);

  const toggleFav = useCallback((id) => {
    setFavourites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const { data: constituencies, loading } = useElectionData('/constituencies', 30000);

  const allCandidates = useMemo(() => constituencies ? flattenCandidates(constituencies) : [], [constituencies]);

  // Build dropdown options dynamically from data
  const districtOptions = useMemo(() => {
    const prov = province === 'All Provinces' ? null : province;
    const set = new Set(allCandidates.filter(c => !prov || c.province === prov).map(c => c.district).filter(Boolean));
    return ['All Districts', ...[...set].sort()];
  }, [allCandidates, province]);

  const constituencyOptions = useMemo(() => {
    const prov = province === 'All Provinces' ? null : province;
    const dist = districtFilter === 'All Districts' ? null : districtFilter;
    const set = new Set(allCandidates
      .filter(c => (!prov || c.province === prov) && (!dist || c.district === dist))
      .map(c => c.constituencyName).filter(Boolean));
    return ['All Constituencies', ...[...set].sort()];
  }, [allCandidates, province, districtFilter]);

  const partyOptions = useMemo(() => {
    const set = new Set(allCandidates.map(c => c.partyName).filter(Boolean));
    return ['All Parties', ...[...set].sort()];
  }, [allCandidates]);

  const counts = useMemo(() => ({
    total: allCandidates.length,
    withVotes: allCandidates.filter(c => (c.votes || 0) > 0).length,
    declared: constituencies?.filter(c => c.status === 'declared').length || 0,
    counting: constituencies?.filter(c => c.status === 'counting').length || 0,
    pending: constituencies?.filter(c => c.status === 'pending').length || 0,
    favs: favourites.length,
  }), [allCandidates, constituencies, favourites]);

  const filtered = useMemo(() => {
    let list = [...allCandidates];
    if (activeTab === 'Favourites') list = list.filter(c => favourites.includes(c.candidateId));
    if (province !== 'All Provinces') list = list.filter(c => c.province === province);
    if (districtFilter !== 'All Districts') list = list.filter(c => c.district === districtFilter);
    if (constituencyFilter !== 'All Constituencies') list = list.filter(c => c.constituencyName === constituencyFilter);
    if (partyFilter !== 'All Parties') list = list.filter(c => c.partyName === partyFilter);
    if (statusFilter === 'Declared') list = list.filter(c => c.constituencyStatus === 'declared');
    else if (statusFilter === 'Counting') list = list.filter(c => c.constituencyStatus === 'counting');
    else if (statusFilter === 'Pending') list = list.filter(c => c.constituencyStatus === 'pending');
    if (genderFilter === 'Male') list = list.filter(c => c.gender === 'M');
    else if (genderFilter === 'Female') list = list.filter(c => c.gender === 'F');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(q) || (c.nameNp || '').includes(search) ||
        (c.constituencyName || '').toLowerCase().includes(q) ||
        (c.district || '').toLowerCase().includes(q) || (c.partyName || '').includes(search)
      );
    }
    if (sortBy === 'Votes') list.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    else if (sortBy === 'Name A–Z') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'Constituency') list.sort((a, b) => (a.constituencyId || 0) - (b.constituencyId || 0));
    return list;
  }, [allCandidates, activeTab, province, districtFilter, constituencyFilter, partyFilter,
    statusFilter, genderFilter, search, sortBy, favourites]);

  // Reset visible count when filters change
  useEffect(() => setVisibleCount(60), [filtered]);

  // Theme vars
  const bg = dark ? '#0B0F1A' : '#F3F4F6';
  const card = dark ? '#111827' : '#FFFFFF';
  const border = dark ? '#1F2937' : '#E5E7EB';
  const text = dark ? '#F9FAFB' : '#111827';
  const muted = dark ? '#6B7280' : '#9CA3AF';
  const inputBg = dark ? '#111827' : '#FFFFFF';

  const btnActive = { background: '#2563EB', border: '1px solid #2563EB', color: 'white', borderRadius: '8px', padding: '0.42rem 0.9rem', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Mukta, sans-serif', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' };
  const btnInactive = { ...btnActive, background: dark ? '#111827' : '#F9FAFB', borderColor: border, color: muted };
  const selStyle = { background: dark ? '#111827' : '#fff', border: `1px solid ${border}`, color: text, borderRadius: '8px', padding: '0.45rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer', outline: 'none', fontFamily: 'Mukta, sans-serif' };

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Mukta, sans-serif', transition: 'background 0.2s, color 0.2s' }}>

      {/* Hero */}
      <div style={{ background: dark ? 'linear-gradient(180deg,#111827 0%,#0B0F1A 100%)' : 'linear-gradient(180deg,#EFF6FF 0%,#F3F4F6 100%)', borderBottom: `1px solid ${border}`, padding: '2rem 0 1.25rem' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.5rem' }}>

          {/* Top bar: title + toggles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)', color: '#60A5FA', fontSize: '0.7rem', fontWeight: 700, padding: '3px 12px', borderRadius: '20px', letterSpacing: '1px', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                {counts.total.toLocaleString()} {t.candidates}
              </div>
              <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(1.8rem,4vw,3rem)', letterSpacing: '3px', color: text, marginBottom: '0.25rem', lineHeight: 1 }}>
                {t.title} <span style={{ color: '#3B82F6' }}>{t.year}</span>
              </h1>
              <p style={{ color: muted, fontSize: '0.82rem', margin: 0 }}>{t.subtitle}</p>
            </div>


          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.25rem 1.5rem' }}>

        {/* Search */}
        <input type="text" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', background: inputBg, border: `1px solid ${border}`, borderRadius: '10px',
            padding: '0.75rem 1.1rem', color: text, fontSize: '0.88rem', outline: 'none',
            fontFamily: 'Mukta, sans-serif', marginBottom: '0.85rem', boxSizing: 'border-box', transition: 'border 0.15s'
          }}
          onFocus={e => e.target.style.borderColor = '#3B82F6'}
          onBlur={e => e.target.style.borderColor = border}
        />

        {/* Dropdowns — all 4 working */}
        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
          {/* Province */}
          <select value={province} onChange={e => { setProvince(e.target.value); setDistrictFilter('All Districts'); setConstituencyFilter('All Constituencies'); }} style={selStyle}>
            {PROVINCES_EN.map((p, i) => <option key={p} value={p}>{lang === 'np' ? PROVINCES_NP[i] : p}</option>)}
          </select>
          {/* District */}
          <select value={districtFilter} onChange={e => { setDistrictFilter(e.target.value); setConstituencyFilter('All Constituencies'); }} style={selStyle}>
            {districtOptions.map(d => <option key={d} value={d}>{d === 'All Districts' ? t.allDistricts : d}</option>)}
          </select>
          {/* Constituency */}
          <select value={constituencyFilter} onChange={e => setConstituencyFilter(e.target.value)} style={selStyle}>
            {constituencyOptions.map(c => <option key={c} value={c}>{c === 'All Constituencies' ? t.allConstituencies : c}</option>)}
          </select>
          {/* Party */}
          <select value={partyFilter} onChange={e => setPartyFilter(e.target.value)} style={selStyle}>
            {partyOptions.map(p => <option key={p} value={p}>{p === 'All Parties' ? t.allParties : pe(p)}</option>)}
          </select>
        </div>

        {/* Status + Fav tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.7rem', alignItems: 'center' }}>
          {[
            { l: t.all, v: 'All', n: counts.total, tab: 'All' },
            { l: t.declared, v: 'Declared', n: counts.declared, tab: 'All' },
            { l: t.counting, v: 'Counting', n: counts.counting, tab: 'All' },
            { l: t.pending, v: 'Pending', n: counts.pending, tab: 'All' },
          ].map(tb => (
            <button key={tb.v}
              onClick={() => { setActiveTab('All'); setStatusFilter(tb.v); }}
              style={(activeTab === 'All' && statusFilter === tb.v) ? btnActive : btnInactive}>
              {tb.l}
              <span style={{ background: (activeTab === 'All' && statusFilter === tb.v) ? 'rgba(255,255,255,0.2)' : dark ? '#1F2937' : '#E5E7EB', borderRadius: '10px', padding: '0 6px', fontSize: '0.7rem' }}>{tb.n}</span>
            </button>
          ))}
          {/* Favourites tab */}
          <button
            onClick={() => { setActiveTab('Favourites'); setStatusFilter('All'); }}
            style={activeTab === 'Favourites'
              ? { ...btnActive, background: '#F59E0B', borderColor: '#F59E0B' }
              : { ...btnInactive }}>
            {t.favourites}
            <span style={{ background: activeTab === 'Favourites' ? 'rgba(255,255,255,0.25)' : dark ? '#1F2937' : '#E5E7EB', borderRadius: '10px', padding: '0 6px', fontSize: '0.7rem' }}>{counts.favs}</span>
          </button>
        </div>

        {/* Gender + Sort row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[['All', t.all], ['Male', t.male], ['Female', t.female]].map(([v, l]) => (
              <button key={v} onClick={() => setGenderFilter(v)}
                style={{ ...(genderFilter === v ? btnActive : btnInactive), borderRadius: '6px', padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: muted }}>{t.sort}</span>
            {[['Votes', t.votes], ['Name A–Z', t.nameAZ], ['Constituency', t.constituency]].map(([v, l]) => (
              <button key={v} onClick={() => setSortBy(v)}
                style={{
                  background: sortBy === v ? (dark ? '#1F2937' : '#E5E7EB') : 'transparent',
                  border: `1px solid ${sortBy === v ? border : 'transparent'}`,
                  color: sortBy === v ? text : muted, borderRadius: '6px',
                  padding: '0.28rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer',
                  fontFamily: 'Mukta, sans-serif', transition: 'all 0.15s'
                }}>
                {l}{v === 'Votes' && sortBy === 'Votes' ? ' ↓' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Result count */}
        <div style={{ fontSize: '0.8rem', color: muted, marginBottom: '1rem' }}>
          {t.showing} <strong style={{ color: text }}>{Math.min(filtered.length, visibleCount).toLocaleString()}</strong> {t.candidates}
          {counts.withVotes > 0 && <> · <strong style={{ color: '#FBBF24' }}>{counts.withVotes.toLocaleString()} {t.withVotes}</strong></>}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '5rem', color: muted }}>
            <div style={{ width: 42, height: 42, border: `3px solid ${border}`, borderTopColor: '#EF4444', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
            {t.loading}
          </div>
        )}

        {/* Empty favourites */}
        {!loading && activeTab === 'Favourites' && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem', color: muted }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>★</div>
            <p style={{ fontWeight: 600, color: text, marginBottom: '0.4rem' }}>{t.noFavs}</p>
            <p style={{ color: muted, fontSize: '0.82rem' }}>{t.noFavsHint}</p>
          </div>
        )}

        {/* Empty search */}
        {!loading && activeTab !== 'Favourites' && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem', color: muted }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
            <p style={{ color: text }}>{t.noResults}</p>
          </div>
        )}

        {/* Grid — 3 per row */}
        {!loading && filtered.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {filtered.slice(0, visibleCount).map((cand, i) => (
                <CandidateCard
                  key={`${cand.candidateId}-${i}`}
                  candidate={cand}
                  isFav={favourites.includes(cand.candidateId)}
                  onToggleFav={toggleFav}
                  dark={dark}
                  lang={lang}
                />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button onClick={() => setVisibleCount(v => v + 60)}
                  style={{
                    background: '#2563EB', border: 'none', color: 'white', borderRadius: '10px',
                    padding: '0.7rem 2rem', fontSize: '0.88rem', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Mukta, sans-serif'
                  }}>
                  {t.showMore} ({filtered.length - visibleCount} {t.candidates})
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #111827; color: #F9FAFB; }
      `}</style>
    </div>
  );
};

export default Constituencies;
