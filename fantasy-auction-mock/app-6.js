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
function escapeHtml(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
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
