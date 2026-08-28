const STORAGE_PLAYERS = 'salaryCapMock.players.v2';
const STORAGE_PERSONAS = 'salaryCapMock.personas.v1';

const ROSTER_TEMPLATE = [
  'QB','RB','RB','WR','WR','TE','FLEX','FLEX','OP','K','DST',
  'BE','BE','BE','BE','BE','BE','BE'
];

const HISTORICAL = {
  Alex:  { description: '3-year avg: QB $29 · RB $77 · WR $69 · TE $23. Consistently cheap at QB; stronger RB/TE allocation with high year-to-year RB variance.', pos: {QB:.74,RB:1.11,WR:.99,TE:1.28,K:.94,DST:.90}, targets:{QB:29.0,RB:77.3,WR:69.0,TE:22.7,K:1.0,DST:1.0}, sd:{QB:2.2,RB:33.2,WR:23.3,TE:11.8}, aggression:1.00, stars:.96, reserve:1.00 },
  Grant: { description: '3-year avg: QB $47 · RB $75 · WR $68 · TE $8. Repeated premium RB allocation, near-average WR, and restrained TE spend.', pos: {QB:.96,RB:1.09,WR:.98,TE:.83,K:.94,DST:.90}, targets:{QB:47.3,RB:75.0,WR:67.7,TE:8.0,K:1.0,DST:1.0}, sd:{QB:11.6,RB:16.9,WR:11.7,TE:4.3}, aggression:1.02, stars:1.01, reserve:1.00 },
  John:  { description: '3-year avg: QB $58 · RB $54 · WR $77 · TE $8. QB/WR-leaning profile with lighter RB and TE allocation; spending varies materially by year.', pos: {QB:1.08,RB:.90,WR:1.06,TE:.83,K:.94,DST:.90}, targets:{QB:58.0,RB:53.7,WR:76.7,TE:8.0,K:1.0,DST:1.0}, sd:{QB:9.9,RB:23.6,WR:19.7,TE:6.7}, aggression:.99, stars:.95, reserve:1.04 },
  Kevin: { description: '3-year avg: QB $54 · RB $32 · WR $89 · TE $23. The clearest WR-heavy / RB-light profile in the league, with willingness to pay at TE too.', pos: {QB:1.03,RB:.72,WR:1.16,TE:1.28,K:.94,DST:.90}, targets:{QB:54.0,RB:31.7,WR:89.0,TE:23.3,K:1.0,DST:1.0}, sd:{QB:12.3,RB:11.9,WR:27.3,TE:20.5}, aggression:1.04, stars:1.01, reserve:1.00 },
  Matt:  { description: '3-year avg: QB $41 · RB $103 · WR $52 · TE $1. Extreme and remarkably consistent RB-heavy build; effectively punts TE.', pos: {QB:.89,RB:1.28,WR:.85,TE:.72,K:.94,DST:.90}, targets:{QB:41.3,RB:103.3,WR:52.3,TE:1.0,K:1.0,DST:1.0}, sd:{QB:12.5,RB:7.1,WR:8.6,TE:0.0}, aggression:1.05, stars:1.02, reserve:1.00 },
  Jerry: { description: '3-year avg: QB $61 · RB $71 · WR $54 · TE $11. Stable QB/RB orientation with consistently lighter WR allocation.', pos: {QB:1.12,RB:1.06,WR:.87,TE:.99,K:.94,DST:.92}, targets:{QB:61.0,RB:71.3,WR:54.3,TE:11.0,K:1.0,DST:1.3}, sd:{QB:9.4,RB:7.9,WR:4.2,TE:5.7}, aggression:1.04, stars:1.02, reserve:1.00 },
  Steve: { description: '3-year avg: QB $60 · RB $49 · WR $80 · TE $10. QB/WR-heavy and RB-light on average, but one of the most volatile year-to-year spenders.', pos: {QB:1.10,RB:.85,WR:1.08,TE:.94,K:.94,DST:.90}, targets:{QB:59.7,RB:48.7,WR:79.7,TE:10.0,K:1.0,DST:1.0}, sd:{QB:18.9,RB:36.4,WR:16.4,TE:7.9}, aggression:1.03, stars:1.00, reserve:1.00 },
  Ricky: { description: '3-year avg: QB $57 · RB $51 · WR $84 · TE $6. Very stable premium QB/WR profile with light RB and especially light TE.', pos: {QB:1.07,RB:.87,WR:1.12,TE:.72,K:.94,DST:.92}, targets:{QB:56.7,RB:51.3,WR:84.0,TE:5.7,K:1.0,DST:1.3}, sd:{QB:2.9,RB:1.7,WR:2.8,TE:2.6}, aggression:1.06, stars:1.03, reserve:1.00 },
  Cole:  { description: '3-year avg: QB $48 · RB $66 · WR $64 · TE $16. More balanced and less top-heavy than the room; still somewhat conservative, but should deploy nearly all of his budget by the late auction.', pos: {QB:.96,RB:1.01,WR:.95,TE:1.26,K:1.02,DST:1.10}, targets:{QB:47.7,RB:65.7,WR:63.7,TE:16.0,K:1.7,DST:3.0}, sd:{QB:7.0,RB:9.0,WR:3.1,TE:1.6}, aggression:.97, stars:.94, reserve:1.03 }
};

const GENERIC_PERSONAS = {
  Conservative: { description:'Rarely chases above market and protects late-draft flexibility.', pos:{QB:1,RB:1,WR:1,TE:1,K:.9,DST:.9}, aggression:.90, stars:.90, reserve:1.10 },
  Balanced: { description:'Neutral position weights with moderate willingness to push values.', pos:{QB:1,RB:1,WR:1,TE:1,K:.9,DST:.9}, aggression:1.00, stars:1.00, reserve:1.00 },
  Aggressive: { description:'More likely to chase targets and bid above baseline.', pos:{QB:1,RB:1,WR:1,TE:1,K:.9,DST:.9}, aggression:1.12, stars:1.08, reserve:.94 },
  'Stars & Scrubs': { description:'Pushes hard on elite players and accepts a cheap bench.', pos:{QB:1,RB:1,WR:1,TE:1,K:.88,DST:.88}, aggression:1.08, stars:1.22, reserve:.90 },
  'RB Heavy': { description:'Pays premiums for RBs and discounts other positions.', pos:{QB:.96,RB:1.18,WR:.96,TE:.94,K:.9,DST:.9}, aggression:1.04, stars:1.07, reserve:.98 },
  'WR Heavy': { description:'Pays premiums for WRs and is more selective at RB.', pos:{QB:.97,RB:.91,WR:1.17,TE:.98,K:.9,DST:.9}, aggression:1.04, stars:1.06, reserve:.98 },
  'QB Aggressive': { description:'Treats superflex QB scarcity as a reason to pay up.', pos:{QB:1.20,RB:.96,WR:.96,TE:.95,K:.9,DST:.9}, aggression:1.07, stars:1.08, reserve:.96 },
  'Value Hunter': { description:'Avoids bidding wars and attacks players who fall below value.', pos:{QB:1,RB:1,WR:1,TE:1,K:.9,DST:.9}, aggression:.95, stars:.93, reserve:1.04 }
};

const TEAM_NAMES = ['Sam','Alex','Grant','John','Kevin','Matt','Jerry','Steve','Ricky','Cole'];
const POSITION_LIMITS = { QB:3, RB:6, WR:6, TE:3, K:1, DST:1 };
const CORE_POSITION_POOL = { QB:20, RB:24, WR:26, TE:10 };
const VALUE_ANCHOR_PROFILES = {
  espn:   { label:'ESPN-heavy', shift:.18 },
  hybrid: { label:'Hybrid', shift:0 },
  league: { label:'League-heavy', shift:-.18 }
};

let players = [];
let teams = [];
let personaSelections = {};
let nominationIndex = 0;
let activeAuction = null;
let draftStarted = false;
let timerInterval = null;
let botTickTimeout = null;
let countdown = 0;
let userPassed = false;
let auctionToken = 0;
let selectedRosterTeamName = 'Sam';
let draftPaused = false;
let draftActionTimeout = null;
let pendingDraftAction = null;
let premiumKickerBidders = new Set();
let rareHighPriceLimit = 1;
let rareHighPriceAuctionsUsed = 0;

const $ = (id) => document.getElementById(id);

function createTeams() {
  const created = TEAM_NAMES.map((name, index) => ({
    name,
    user: index === 0,
    budget: 200,
    roster: ROSTER_TEMPLATE.map(slot => ({ slot, player: null, price: 0 })),
    spentByPos: {QB:0,RB:0,WR:0,TE:0,K:0,DST:0},
    draftedCount: 0,
    rosterPace: index === 0 ? 'user' : 'standard',
    valueAnchor: index === 0 ? 'user' : 'hybrid'
  }));

  assignRosterPacingProfiles(created);
  assignValueAnchorProfiles(created);
  assignDraftRarityProfiles(created);
  return created;
}

function assignDraftRarityProfiles(teamList=teams) {
  const npcs = teamList.filter(t => !t.user);
  const shuffled = [...npcs].sort(() => Math.random() - .5);
  const kickerRoll = Math.random();
  const kickerBidderCount = kickerRoll < .70 ? 0 : kickerRoll < .95 ? 1 : 2;
  premiumKickerBidders = new Set(shuffled.slice(0, kickerBidderCount).map(t => t.name));
  const highPriceRoll = Math.random();
  rareHighPriceLimit = highPriceRoll < .15 ? 0 : highPriceRoll < .85 ? 1 : 2;
  rareHighPriceAuctionsUsed = 0;
}

function rareHighPriceEligible(player) {
  if (rareHighPriceAuctionsUsed >= rareHighPriceLimit) return false;
  const publicAnchor = Math.max(
    roomReferenceValue(player),
    finiteSourceValue(player.espnValue) ?? 0,
    finiteSourceValue(player.leagueValue) ?? 0
  );
  return publicAnchor >= 45 && Math.random() < .26;
}

function assignRosterPacingProfiles(teamList=teams) {
  const npcs = teamList.filter(t => !t.user);
  npcs.forEach(t => t.rosterPace = 'standard');
  const shuffled = [...npcs].sort(() => Math.random() - .5);
  const explicitYolo = shuffled.filter(t => (personaSelections[t.name] || 'Historical') === 'Stars & Scrubs').slice(0,2);
  const yolo = explicitYolo.length ? explicitYolo : shuffled.slice(0,1);
  yolo.forEach(t => t.rosterPace = 'yolo');
  const patientPool = shuffled.filter(t => !yolo.includes(t));
  patientPool.slice(0,2).forEach(t => t.rosterPace = 'patient');
}

function assignValueAnchorProfiles(teamList=teams) {
  const npcs = teamList.filter(t => !t.user);
  const shuffled = [...npcs].sort(() => Math.random() - .5);
  shuffled.forEach(t => t.valueAnchor = 'league');
  shuffled.slice(0,4).forEach(t => t.valueAnchor = 'espn');
  shuffled.slice(4,6).forEach(t => t.valueAnchor = 'hybrid');
}

function normalizePos(pos) {
  const p = String(pos || '').trim().toUpperCase().replaceAll(' ', '');
  if (['D/ST','DEF','DEFENSE','DST'].includes(p)) return 'DST';
  if (['QB','RB','WR','TE','K'].includes(p)) return p;
  return p;
}

function parseMoney(value) {
  if (typeof value === 'number') return value;
  const cleaned = String(value ?? '').replace(/[$,\s]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function finiteSourceValue(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0,n) : null;
}

function tierEspnWeight(player) {
  const league = finiteSourceValue(player.leagueValue);
  const espn = finiteSourceValue(player.espnValue);
  if (league == null) return 1;
  if (espn == null) return 0;
  const top = Math.max(league, espn);
  if (player.position === 'QB') return top >= 35 ? .55 : .45;
  if (player.position === 'RB') return top >= 35 ? .45 : .30;
  if (player.position === 'WR') return top >= 30 ? .50 : .38;
  if (player.position === 'TE') return top >= 20 ? .60 : .40;
  return .25;
}

function blendedSourceValue(player, espnWeight=tierEspnWeight(player)) {
  const league = finiteSourceValue(player.leagueValue);
  const espn = finiteSourceValue(player.espnValue);
  if (league == null && espn == null) return Math.max(0, Number(player.value) || 0);
  if (league == null) return espn;
  if (espn == null) return league;
  return league * (1-espnWeight) + espn * espnWeight;
}

function roomReferenceValue(player) {
  return Math.max(0, Math.round(blendedSourceValue(player)));
}

function npcAnchorValue(team, player) {
  if (!team || team.user) return Math.max(1, roomReferenceValue(player));
  const profile = VALUE_ANCHOR_PROFILES[team.valueAnchor] || VALUE_ANCHOR_PROFILES.hybrid;
  const weight = Math.max(.12, Math.min(.82, tierEspnWeight(player) + profile.shift));
  return Math.max(1, blendedSourceValue(player, weight));
}

function displaySourceValue(v) {
  const n = finiteSourceValue(v);
  return n == null ? '—' : `$${Math.round(n)}`;
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (quoted) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else {
      if (c === '"') quoted = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') field += c;
    }
  }
  row.push(field); rows.push(row);
  return rows.filter(r => r.some(v => String(v).trim() !== ''));
}

function detectColumn(headers, candidates) {
  const normalized = headers.map(h => String(h).trim().toLowerCase().replace(/[^a-z0-9]/g,''));
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate.replace(/[^a-z0-9]/g,''));
    if (idx >= 0) return idx;
  }
  return -1;
}

function importPlayersFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error('CSV does not contain player rows.');
  const headers = rows[0];
  const nameIdx = detectColumn(headers, ['name','player','playername']);
  const posIdx = detectColumn(headers, ['position','pos']);
  const teamIdx = detectColumn(headers, ['team','nflteam','proteam']);
  const leagueIdx = detectColumn(headers, ['leaguevalue','historicalvalue','leagueestimate','historyvalue']);
  const espnIdx = detectColumn(headers, ['espnvalue','espnauctionvalue']);
  const valueIdx = detectColumn(headers, ['value','auctionvalue','salary','price','avgvalue','projectedvalue']);
  if ([nameIdx,posIdx].some(i => i < 0) || (leagueIdx < 0 && espnIdx < 0 && valueIdx < 0)) {
    throw new Error('Could not detect Name, Position, and value columns. Use LeagueValue + ESPNValue, or a single Value column.');
  }

  const imported = rows.slice(1).map((r, i) => {
    const name = String(r[nameIdx] || '').trim();
    const position = normalizePos(r[posIdx]);
    const team = teamIdx >= 0 ? String(r[teamIdx] || '').trim().toUpperCase() : '';
    const generic = valueIdx >= 0 ? finiteSourceValue(parseMoney(r[valueIdx])) : null;
    const leagueValue = leagueIdx >= 0 ? finiteSourceValue(parseMoney(r[leagueIdx])) : generic;
    const espnValue = espnIdx >= 0 ? finiteSourceValue(parseMoney(r[espnIdx])) : generic;
    const player = {
      id: `${name}-${position}-${team}-${i}`.toLowerCase(), name, position, team,
      leagueValue, espnValue, draftedBy:null, price:null
    };
    player.value = roomReferenceValue(player);
    return player;
  }).filter(p => p.name && ['QB','RB','WR','TE','K','DST'].includes(p.position) && Number.isFinite(p.value));

  if (!imported.length) throw new Error('No usable player rows found.');
  players = imported;
  localStorage.setItem(STORAGE_PLAYERS, JSON.stringify(players.map(({draftedBy,price,...p}) => p)));
  resetDraft(false);
  const dual = players.some(p => finiteSourceValue(p.leagueValue) != null && finiteSourceValue(p.espnValue) != null && p.leagueValue !== p.espnValue);
  toast(`Imported ${players.length} players${dual ? ' with ESPN + league values' : ''}.`);
}
