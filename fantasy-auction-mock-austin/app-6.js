function renderAuctionTimer() {
  $('timer').textContent = countdown;
  $('timer').classList.toggle('urgent', !draftPaused && countdown <= (getSpeed()==='realtime'?10:3));
}
function updateBidButtons() {
  const userIsLeader = !!activeAuction && activeAuction.leader === teams[0];
  const disabled = draftPaused || !activeAuction || userPassed || userIsLeader || !canRoster(teams[0], activeAuction?.player?.position || '') || maxLegalBid(teams[0]) <= (activeAuction?.bid ?? 0);
  $('bidOneBtn').disabled = disabled; $('bidFiveBtn').disabled = disabled; $('customBidBtn').disabled = disabled;
  $('passBtn').disabled = draftPaused || !activeAuction || userPassed || userIsLeader;
}
function clearTimers() {
  if (timerInterval) clearInterval(timerInterval); if (botTickTimeout) clearTimeout(botTickTimeout); if (draftActionTimeout) clearTimeout(draftActionTimeout);
  timerInterval=null; botTickTimeout=null; draftActionTimeout=null;
}
function scheduleDraftAction(action, delay) {
  pendingDraftAction = action;
  if (draftActionTimeout) clearTimeout(draftActionTimeout);
  if (draftPaused) return;
  draftActionTimeout = setTimeout(() => {
    draftActionTimeout = null; const next = pendingDraftAction; pendingDraftAction = null;
    if (draftPaused || !draftStarted || !next) { if (draftPaused) pendingDraftAction = next; return; }
    runDraftAction(next);
  }, delay);
}
function runDraftAction(action) {
  if (!action) return;
  if (action.type === 'npcNominate') { const team = teams.find(t => t.name === action.teamName); if (team) npcNominate(team); }
  else if (action.type === 'advanceNomination') advanceNomination();
  else if (action.type === 'nextNomination') nextNomination();
}
function togglePause() {
  if (!draftStarted) return;
  draftPaused = !draftPaused;
  if (draftPaused) { clearTimers(); log('Draft paused.', 'system'); renderNominateList(); }
  else {
    log('Draft resumed.', 'system');
    if (activeAuction) startAuctionTimers(activeAuction.token);
    else if (pendingDraftAction) scheduleDraftAction(pendingDraftAction, getSpeed()==='realtime' ? 500 : getSpeed()==='fast' ? 180 : 40);
    else if (teams[nominationIndex]?.user) openNominateModal();
    else scheduleDraftAction({type:'npcNominate', teamName:teams[nominationIndex]?.name}, getSpeed()==='realtime' ? 500 : getSpeed()==='fast' ? 180 : 40);
    renderNominateList();
  }
  renderPlayers(); updateControls(); renderTeams();
  if (activeAuction) renderAuctionTimer(); else $('timer').textContent = '--';
  toast(draftPaused ? 'Draft paused.' : 'Draft resumed.');
}
function getSpeed() { return $('speedSelect').value; }
function log(message,type='system') {
  const div=document.createElement('div'); div.className=`log-item log-${type}`;
  const time=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
  div.innerHTML=`<div class="log-time">${time}</div><div>${highlightLog(message,type)}</div>`; $('draftLog').prepend(div);
}
function highlightLog(message,type) {
  if (type==='win' || type==='bid') return escapeHtml(message).replace(/(\$\d+)/,'<strong>$1</strong>');
  return escapeHtml(message);
}
function toast(msg) { const t=$('toast'); t.textContent=msg; t.classList.remove('hidden'); clearTimeout(t._hide); t._hide=setTimeout(()=>t.classList.add('hidden'),2600); }
function displayPos(pos){ return pos==='DST'?'D/ST':pos; }
function weightedChoice(items) { const total=items.reduce((s,i)=>s+i.weight,0); let r=Math.random()*total; for (const i of items) { r-=i.weight; if (r<=0) return i.value; } return items.at(-1).value; }
function escapeHtml(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
function escapeAttr(s){return escapeHtml(s).replace(/'/g,'&#39;');}

$('importBtn').onclick=()=>$('fileInput').click(); $('emptyImportBtn').onclick=()=>$('fileInput').click();
$('fileInput').onchange=async(e)=>{ const file=e.target.files?.[0]; if(!file)return; try{importPlayersFromCSV(await file.text());}catch(err){toast(err.message||'Import failed.');} e.target.value=''; };
$('resetBtn').onclick=()=>{ if(confirm('Reset this mock draft? Imported players and personas will be kept.')) resetDraft(); };
$('setupBtn').onclick=()=>{$('setupModal').classList.remove('hidden');renderSetup();}; $('closeSetupBtn').onclick=()=>$('setupModal').classList.add('hidden');
$('saveSetupBtn').onclick=()=>{ document.querySelectorAll('[data-persona]').forEach(sel=>personaSelections[sel.dataset.persona]=sel.value); localStorage.setItem(STORAGE_PERSONAS,JSON.stringify(personaSelections)); if (!draftStarted) assignRosterPacingProfiles(teams); $('setupModal').classList.add('hidden'); toast('Persona setup saved.'); };
$('closeNominateBtn').onclick=()=>{}; $('nominateSearch').oninput=renderNominateList; $('searchInput').oninput=renderPlayers; $('positionFilter').onchange=renderPlayers;
$('rosterTeamSelect').onchange=(e)=>selectRosterTeam(e.target.value); $('startBtn').onclick=startDraft; $('pauseBtn').onclick=togglePause; $('nominatePauseBtn').onclick=togglePause;
$('bidOneBtn').onclick=()=>userBid(1); $('bidFiveBtn').onclick=()=>userBid(5); $('customBidBtn').onclick=()=>userBid(null,$('customBidInput').value);
$('customBidInput').onkeydown=(e)=>{if(e.key==='Enter')userBid(null,$('customBidInput').value);};
$('passBtn').onclick=()=>{if(draftPaused)return;userPassed=true;updateBidButtons();toast('You have stopped bidding on this player.');}; $('speedSelect').onchange=()=>{ if(draftStarted) toast('Draft speed changes apply immediately to upcoming bot actions.'); };
loadStoredData(); teams=createTeams(); renderAll();
setAuctionEmpty(players.length ? 'Ready to draft' : 'Import player values to begin', players.length ? 'Press Start Draft when your personas are set.' : 'CSV: Name, Position, Team, LeagueValue, ESPNValue (single Value also supported).');

// D/ST realism override: almost every defense is strictly a $1 NPC purchase.
// Only a top-three defense can ever draw a $2 NPC bid, and each fresh draft has
// only a 12% chance of enabling one designated NPC to make that bid at all.
function getDefensePremiumState() {
  let state = window.__fantasyAuctionDefensePremiumState;
  if (!state || state.teamsRef !== teams) {
    const npcs = teams.filter(t => !t.user);
    const enabled = Math.random() < .12;
    const bidder = enabled && npcs.length ? npcs[Math.floor(Math.random() * npcs.length)] : null;
    state = { teamsRef: teams, enabled, bidderName: bidder?.name || null, used: false };
    window.__fantasyAuctionDefensePremiumState = state;
  }
  return state;
}

function defenseRank(player) {
  if (!player || player.position !== 'DST') return 999;
  const defensePool = players.filter(p => p.position === 'DST');
  const ranked = [...defensePool].sort((a,b) => {
    const roomDiff = roomReferenceValue(b) - roomReferenceValue(a);
    if (roomDiff) return roomDiff;
    const leagueDiff = (finiteSourceValue(b.leagueValue) ?? 0) - (finiteSourceValue(a.leagueValue) ?? 0);
    if (leagueDiff) return leagueDiff;
    const espnDiff = (finiteSourceValue(b.espnValue) ?? 0) - (finiteSourceValue(a.espnValue) ?? 0);
    if (espnDiff) return espnDiff;
    return defensePool.indexOf(a) - defensePool.indexOf(b);
  });
  const index = ranked.findIndex(p => p.id === player.id);
  return index >= 0 ? index + 1 : 999;
}

const npcCeilingBeforeDefenseRealism = npcCeiling;
npcCeiling = function(team, player) {
  if (player?.position !== 'DST') return npcCeilingBeforeDefenseRealism(team, player);
  const state = getDefensePremiumState();
  const topThree = defenseRank(player) <= 3;
  const canBidTwo = topThree && state.enabled && !state.used && team?.name === state.bidderName;
  return Math.max(1, Math.min(canBidTwo ? 2 : 1, maxLegalBid(team)));
};

const placeBidBeforeDefenseRealism = placeBid;
placeBid = function(team, amount) {
  const isDefense = activeAuction?.player?.position === 'DST';
  const placed = placeBidBeforeDefenseRealism(team, amount);
  if (placed && isDefense && !team.user && Number(amount) >= 2) {
    getDefensePremiumState().used = true;
  }
  return placed;
};

// Austin league fork configuration.
(() => {
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  const scopedStorageKey = (key) => {
    if (key === STORAGE_PLAYERS) return `austinLeague.${key}`;
    if (key === STORAGE_PERSONAS) return `austinLeague.${key}`;
    return key;
  };
  Storage.prototype.getItem = function(key) { return originalGetItem.call(this, scopedStorageKey(key)); };
  Storage.prototype.setItem = function(key, value) { return originalSetItem.call(this, scopedStorageKey(key), value); };
  Storage.prototype.removeItem = function(key) { return originalRemoveItem.call(this, scopedStorageKey(key)); };

  const friendNames = Array.from({length:9}, (_,i) => `Austin Friend ${i+1}`);
  TEAM_NAMES.splice(0, TEAM_NAMES.length, 'Austin', ...friendNames);
  ROSTER_TEMPLATE.splice(0, ROSTER_TEMPLATE.length,
    'QB','RB','RB','WR','WR','WR','TE','FLEX','FLEX','OP','K','DST',
    'BE','BE','BE','BE','BE','BE'
  );
  POSITION_LIMITS.WR = 7;
  CORE_POSITION_POOL.WR = 34;
  selectedRosterTeamName = 'Austin';

  for (const name of friendNames) {
    HISTORICAL[name] = {
      description: 'No Austin-league historical tendency is configured yet; this is a neutral compatibility baseline. Balanced is the recommended default.',
      pos: {QB:1,RB:1,WR:1,TE:1,K:.9,DST:.9},
      aggression: 1,
      stars: 1,
      reserve: 1
    };
  }

  const hadSavedAustinPersonas = localStorage.getItem(STORAGE_PERSONAS) != null;
  loadStoredData();
  if (!hadSavedAustinPersonas) {
    personaSelections = Object.fromEntries(friendNames.map(name => [name, 'Balanced']));
    localStorage.setItem(STORAGE_PERSONAS, JSON.stringify(personaSelections));
  }
  resetDraft(false);
  selectedRosterTeamName = 'Austin';
  renderAll();

  document.title = 'Austin Salary Cap Mock Draft Simulator';
  const title = document.querySelector('.brand-title');
  const subtitle = document.querySelector('.brand-subtitle');
  const setupCopy = document.querySelector('#setupModal .modal-header p');
  if (title) title.textContent = 'Austin Salary Cap Mock Draft';
  if (subtitle) subtitle.textContent = '10 teams · Half PPR · Superflex · standard passing · $200 · 18 roster spots';
  if (setupCopy) setupCopy.textContent = 'Balanced is the default for Austin Friend 1–9. Swap personas anytime before the draft to test different rooms.';
})();

// Austin league has three required starting WR spots rather than two.
positionNeedMultiplier = function(team,pos) {
  const counts = rosterCounts(team);
  const progress = auctionStageProgress();
  const catchup = rosterCatchupUrgency(team);
  const positionalUrgency = positionalNeedUrgency(team,pos);
  const pace = team.rosterPace || 'standard';
  const lateScale = pace === 'yolo' ? (progress > .84 ? 1 : .35) : pace === 'patient' ? .75 : 1;
  const hardNeedBonus = Math.min(.34, catchup * .22 * lateScale + Math.max(0, progress-.48) * .22 * lateScale + positionalUrgency * .22);
  const flexNeedBonus = Math.min(.12, catchup * .09 * lateScale + Math.max(0, progress-.58) * .10 * lateScale);

  if (pos === 'QB' && counts.QB === 0) return 1.13 + hardNeedBonus;
  if (pos === 'QB' && counts.QB === 1 && counts.QB < 2) return 1.10 + hardNeedBonus * .90;
  if (pos === 'RB' && counts.RB < 2) return 1.11 + hardNeedBonus;
  if (pos === 'WR' && counts.WR < 2) return 1.11 + hardNeedBonus;
  if (pos === 'WR' && counts.WR === 2) return 1.08 + hardNeedBonus * .90;
  if (pos === 'TE' && counts.TE < 1) return 1.11 + hardNeedBonus;

  if (pos === 'K' && counts.K === 0) return progress > .84 ? 1.20 + hardNeedBonus*.5 : .82;
  if (pos === 'DST' && counts.DST === 0) return progress > .84 ? 1.20 + hardNeedBonus*.5 : .82;

  if (['RB','WR','TE'].includes(pos) && openFlexCount(team) > 0) return 1.05 + flexNeedBonus;
  if (counts[pos] >= (POSITION_LIMITS[pos] ?? 1)) return .70;
  return .96;
};

hardStarterNeed = function(team,pos) {
  const c = rosterCounts(team);
  if (pos === 'QB') return c.QB < 2;
  if (pos === 'RB') return c.RB < 2;
  if (pos === 'WR') return c.WR < 3;
  if (pos === 'TE') return c.TE < 1;
  if (pos === 'K') return c.K < 1 && auctionStageProgress() > .84;
  if (pos === 'DST') return c.DST < 1 && auctionStageProgress() > .84;
  return false;
};

offensiveStarterCompletionPressure = function(team) {
  if (team.user) return 0;
  const progress = auctionStageProgress();
  const filled = offensiveStarterSlotsFilled(team);
  const pace = team.rosterPace || 'standard';
  let target = 0;
  if (pace === 'standard') {
    if (progress >= .78) target = 10;
    else if (progress >= .66) target = 9;
    else if (progress >= .55) target = 8;
    else if (progress >= .43) target = 6;
  } else if (pace === 'patient') {
    if (progress >= .84) target = 10;
    else if (progress >= .72) target = 9;
    else if (progress >= .60) target = 7;
    else if (progress >= .48) target = 6;
  } else {
    if (progress >= .92) target = 10;
    else if (progress >= .84) target = 8;
    else if (progress >= .72) target = 6;
  }
  if (!target || filled >= target) return 0;
  return Math.min(1, (target - filled) / 3 + .25);
};
