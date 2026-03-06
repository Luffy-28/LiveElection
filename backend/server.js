require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const axios = require('axios');
const https = require('https');
const photoCache = new Map();

const app = express();

// ─── CORS: allow any localhost port (3000, 3001, etc.) ───────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ─── Schemas ─────────────────────────────────────────────────────────
const constituencySchema = new mongoose.Schema({
  code: { type: String, unique: true },
  constituencyId: Number,
  name: String,
  nameNp: String,
  province: String,
  district: String,
  districtNp: String,
  status: { type: String, default: 'PENDING' },
  candidates: [{
    candidateId: Number,
    name: String,
    nameNp: String,
    partyName: String,
    partyId: String,
    votes: { type: Number, default: 0 },
    gender: String,
    isWinner: Boolean,
    isLeading: Boolean
  }],
  totalVotesCounted: { type: Number, default: 0 },
  totalVoters: Number,
  lastUpdated: Date
});

const partySummarySchema = new mongoose.Schema({
  partyName: String,
  partyShortName: String,
  color: String,
  seatsDeclared: { type: Number, default: 0 },
  seatsLeading: { type: Number, default: 0 },
  totalVotes: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const metaSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed,
  lastUpdated: { type: Date, default: Date.now }
});

const Constituency = mongoose.model('Constituency', constituencySchema);
const PartySummary = mongoose.model('PartySummary', partySummarySchema);
const Meta = mongoose.model('Meta', metaSchema);

// ─── Party Colors ─────────────────────────────────────────────────────
const PARTY_COLORS = {
  'नेपाली काँग्रेस': '#1565C0',
  'नेकपा (एकीकृत समाजवादी)': '#C62828',
  'नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)': '#E53935',
  'नेकपा (माओवादी केन्द्र)': '#B71C1C',
  'राष्ट्रिय स्वतन्त्र पार्टी': '#FF6F00',
  'राष्ट्रिय प्रजातन्त्र पार्टी': '#6A1B9A',
  'जनता समाजवादी पार्टी, नेपाल': '#1B5E20',
  'स्वतन्त्र': '#455A64',
  'default': '#607D8B'
};

const PARTY_SHORT = {
  'नेपाली काँग्रेस': 'NC',
  'नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)': 'UML',
  'नेकपा (माओवादी केन्द्र)': 'Maoist',
  'राष्ट्रिय स्वतन्त्र पार्टी': 'RSP',
  'राष्ट्रिय प्रजातन्त्र पार्टी': 'RPP',
  'जनता समाजवादी पार्टी, नेपाल': 'JSP',
  'नेकपा (एकीकृत समाजवादी)': 'UML-S',
  'स्वतन्त्र': 'IND',
};

function partyColor(name) { return PARTY_COLORS[name] || PARTY_COLORS['default']; }
function partyShort(name) { return PARTY_SHORT[name] || (name ? name.replace(/[()]/g, '').split(' ').map(w => w[0]).join('').substring(0, 5) : '?'); }

// ─── Data source ──────────────────────────────────────────────────────
const DATA_URL = process.env.DATA_URL;

async function fetchAndSync() {
  console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Fetching from data source...`);
  try {
    const res = await axios.get(DATA_URL, {
      timeout: 30000,
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' },
      params: { _t: Date.now() }
    });

    const constituencies = res.data;
    if (!Array.isArray(constituencies) || constituencies.length === 0) {
      console.warn('⚠️  Empty or invalid data received');
      return;
    }

    console.log(`📡 Received ${constituencies.length} constituencies`);
    let updated = 0;

    for (let i = 0; i < constituencies.length; i++) {
      const c = constituencies[i];
      const totalVotes = (c.candidates || []).reduce((s, cand) => s + (cand.votes || 0), 0);
      const sorted = [...(c.candidates || [])].sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const enriched = sorted.map((cand, idx) => ({
        ...cand,
        votes: cand.votes || 0,
        isLeading: idx === 0 && totalVotes > 0 && !cand.isWinner,
        isWinner: cand.isWinner || false
      }));
      const hasWinner = enriched.some(c => c.isWinner);
      const status = c.status === 'DECLARED' || hasWinner ? 'declared'
        : (totalVotes > 0 || c.status === 'COUNTING') ? 'counting' : 'pending';

      await Constituency.findOneAndUpdate(
        { code: c.code },
        {
          code: c.code, constituencyId: i + 1, name: c.name, nameNp: c.nameNp,
          province: c.province, district: c.district, districtNp: c.districtNp,
          status, candidates: enriched, totalVotesCounted: totalVotes,
          totalVoters: c.totalVoters || 0,
          lastUpdated: c.lastUpdated ? new Date(c.lastUpdated) : new Date()
        },
        { upsert: true }
      );
      updated++;
    }

    await rebuildPartySummary();
    await Meta.findOneAndUpdate({ key: 'lastSync' }, { key: 'lastSync', value: new Date(), lastUpdated: new Date() }, { upsert: true });
    await Meta.findOneAndUpdate({ key: 'dataSource' }, { key: 'dataSource', value: DATA_URL, lastUpdated: new Date() }, { upsert: true });

    const declared = await Constituency.countDocuments({ status: 'declared' });
    const counting = await Constituency.countDocuments({ status: 'counting' });
    console.log(`✅ Synced ${updated} constituencies | Declared: ${declared} | Counting: ${counting}`);
  } catch (err) {
    console.error('❌ Fetch failed:', err.message);
  }
}

async function rebuildPartySummary() {
  const all = await Constituency.find({});
  const partyIdMap = {};

  for (const constituency of all) {
    const candidates = constituency.candidates || [];
    const withVotes = candidates.filter(c => (c.votes || 0) > 0);
    const sorted = [...withVotes].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    const leadingCandId = constituency.status === 'counting' && sorted.length > 0 ? sorted[0].candidateId : null;

    for (const cand of candidates) {
      const key = cand.partyId || cand.partyName || 'independent';
      if (!partyIdMap[key]) {
        partyIdMap[key] = { partyName: cand.partyName || 'Independent', seatsDeclared: 0, seatsLeading: 0, totalVotes: 0 };
      }
      partyIdMap[key].totalVotes += cand.votes || 0;
      if (constituency.status === 'declared' && cand.isWinner) partyIdMap[key].seatsDeclared++;
      if (leadingCandId && cand.candidateId === leadingCandId) partyIdMap[key].seatsLeading++;
    }
  }

  await PartySummary.deleteMany({});
  for (const data of Object.values(partyIdMap)) {
    await PartySummary.create({
      partyName: data.partyName, partyShortName: partyShort(data.partyName),
      color: partyColor(data.partyName), seatsDeclared: data.seatsDeclared,
      seatsLeading: data.seatsLeading, totalVotes: data.totalVotes, lastUpdated: new Date()
    });
  }

  const totD = Object.values(partyIdMap).reduce((s, p) => s + p.seatsDeclared, 0);
  const totL = Object.values(partyIdMap).reduce((s, p) => s + p.seatsLeading, 0);
  console.log(`📊 Party summary: ${Object.keys(partyIdMap).length} parties | ${totD} declared | ${totL} leading`);
}

// ─── Routes ───────────────────────────────────────────────────────────
app.get('/api/summary', async (req, res) => {
  try {
    const allParties = await PartySummary.find({}).sort({ seatsDeclared: -1, seatsLeading: -1, totalVotes: -1 });
    const parties = allParties.filter(p => (p.seatsDeclared || 0) > 0 || (p.seatsLeading || 0) > 0 || (p.totalVotes || 0) > 0);
    const declared = await Constituency.countDocuments({ status: 'declared' });
    const counting = await Constituency.countDocuments({ status: 'counting' });
    const total = await Constituency.countDocuments();
    const lastMeta = await Meta.findOne({ key: 'lastSync' });
    res.json({
      parties,
      stats: {
        totalConstituencies: total || 165, declaredSeats: declared, countingSeats: counting,
        pendingSeats: Math.max(0, (total || 165) - declared - counting),
        totalSeats: 275, lastUpdated: lastMeta?.value || null, dataSource: DATA_URL
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/", (req, res) => {
  res.send("Nepal Election API is running");
});

app.get('/api/constituencies', async (req, res) => {
  try {
    const { province, status, search } = req.query;
    const filter = {};
    if (province) filter.province = { $regex: province, $options: 'i' };
    if (status) filter.status = status;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { nameNp: { $regex: search, $options: 'i' } },
      { district: { $regex: search, $options: 'i' } }
    ];
    const results = await Constituency.find(filter).sort({ constituencyId: 1 });
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/constituencies/:id', async (req, res) => {
  try {
    const isNum = !isNaN(req.params.id);
    const result = isNum
      ? await Constituency.findOne({ constituencyId: parseInt(req.params.id) })
      : await Constituency.findOne({ code: req.params.id });
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/provinces', async (req, res) => {
  try {
    const provinces = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];
    const data = await Promise.all(provinces.map(async (prov) => {
      const all = await Constituency.find({ province: { $regex: prov, $options: 'i' } });
      const declared = all.filter(c => c.status === 'declared').length;
      const counting = all.filter(c => c.status === 'counting').length;
      const partySeats = {};
      all.filter(c => c.status === 'declared').forEach(c => {
        const w = c.candidates.find(x => x.isWinner);
        if (w) partySeats[w.partyName] = (partySeats[w.partyName] || 0) + 1;
      });
      const top = Object.entries(partySeats).sort((a, b) => b[1] - a[1])[0];
      return {
        name: prov, total: all.length, declared, counting,
        pending: all.length - declared - counting,
        leadingParty: top?.[0] || null, leadingSeats: top?.[1] || 0, partyBreakdown: partySeats
      };
    }));
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Image proxy — ECN blocks direct browser requests ─────────────────

app.get('/api/photo/:candidateId', async (req, res) => {
  const { candidateId } = req.params;

  try {
    if (!/^\d+$/.test(candidateId)) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    const url = `https://result.election.gov.np/Images/Candidate/${candidateId}.jpg`;


    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 20000,
      httpsAgent: new https.Agent({
        keepAlive: false,
        rejectUnauthorized: true,
      }),
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://result.election.gov.np/',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ne;q=0.8',
      },
      validateStatus: (status) => status < 500,
    });

    if (response.status !== 200) {
      return res.status(404).json({
        error: 'Photo not found on source server',
        candidateId,
        upstreamStatus: response.status,
      });
    }

    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');

    response.data.pipe(res);
  } catch (err) {
    console.error('Photo fetch error:', {
      candidateId,
      status: err.response?.status,
      code: err.code,
      message: err.message,
    });

    return res.status(502).json({
      error: 'Upstream photo server connection failed',
      candidateId,
      code: err.code || null,
      message: err.message,
    });
  }
});

app.post('/api/sync', async (req, res) => {
  fetchAndSync();
  res.json({ success: true, message: 'Sync triggered', source: DATA_URL });
});

app.get('/api/health', async (req, res) => {
  const lastMeta = await Meta.findOne({ key: 'lastSync' });
  const count = await Constituency.countDocuments();
  const declared = await Constituency.countDocuments({ status: 'declared' });
  const counting = await Constituency.countDocuments({ status: 'counting' });
  res.json({ status: 'ok', constituencies: count, declared, counting, lastSync: lastMeta?.value, dataUrl: DATA_URL });
});

// ─── Clear stale/fake data ─────────────────────────────────────────────
app.post('/api/clear-db', async (req, res) => {
  try {
    await Constituency.deleteMany({});
    await PartySummary.deleteMany({});
    await Meta.deleteMany({});
    console.log('🗑️  DB cleared');
    res.json({ success: true, message: 'Database cleared. Will resync on next fetch.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Cron: every 30 seconds ───────────────────────────────────────────
cron.schedule('*/300 * * * * *', () => fetchAndSync().catch(console.error));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Nepal Election API running on port ${PORT}`);
  setTimeout(() => fetchAndSync().catch(console.error), 3500);
});