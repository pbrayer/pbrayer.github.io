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
