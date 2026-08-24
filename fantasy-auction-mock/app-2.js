function loadStoredData() {
  try {
    const savedPlayers = JSON.parse(localStorage.getItem(STORAGE_PLAYERS) || '[]');
    players = savedPlayers.map(p => {
      const leagueValue = finiteSourceValue(p.leagueValue) ?? finiteSourceValue(p.value) ?? 0;
      const espnValue = finiteSourceValue(p.espnValue) ?? finiteSourceValue(p.value) ?? 0;
      const next = {...p, leagueValue, espnValue, draftedBy:null, price:null};
      next.value = roomReferenceValue(next);
      return next;
    });
  } catch { players = []; }
  try { personaSelections = JSON.parse(localStorage.getItem(STORAGE_PERSONAS) || '{}') || {}; }
  catch { personaSelections = {}; }
  for (const name of TEAM_NAMES.slice(1)) if (!personaSelections[name]) personaSelections[name] = 'Historical';
}

function resetDraft(showToast=true) {
  auctionToken++;
  clearTimers();
  teams = createTeams();
  players = players.map(p => { const next={...p, draftedBy:null, price:null}; next.value=roomReferenceValue(next); return next; });
  nominationIndex = 0;
  activeAuction = null;
  draftStarted = false;
  userPassed = false;
  draftPaused = false;
  pendingDraftAction = null;
  selectedRosterTeamName = 'Sam';
  $('startBtn').textContent = 'Start Draft';
  renderAll();
  setAuctionEmpty(players.length ? 'Ready to draft' : 'Import player values to begin', players.length ? 'Press Start Draft when your personas are set.' : 'CSV: Name, Position, Team, LeagueValue, ESPNValue (single Value also supported).');
  if (showToast) toast('Draft reset. Player values and personas were kept.');
}

function renderAll() {
  renderTeams(); renderRoster(); renderPlayers(); renderSetup(); updateControls();
}

function renderTeams() {
  $('teamStrip').innerHTML = teams.map((team, i) => {
    const isActive = draftStarted && !draftPaused && i === nominationIndex && !activeAuction;
    const isViewing = team.name === selectedRosterTeamName;
    return `<div class="team-card ${team.user?'user':''} ${isActive?'active-nominator':''} ${isViewing?'viewing':''}" data-view-team="${escapeAttr(team.name)}" title="View ${escapeAttr(team.name)} roster">
      <div class="team-name">${escapeHtml(team.name)}</div>
      <div class="team-meta"><span class="team-money">$${team.budget}</span><span>${team.draftedCount}/18</span></div>
    </div>`;
  }).join('');
  document.querySelectorAll('[data-view-team]').forEach(card => card.onclick = () => selectRosterTeam(card.dataset.viewTeam));
}

function selectRosterTeam(name) {
  if (!teams.some(t => t.name === name)) return;
  selectedRosterTeamName = name;
  renderRoster();
  renderTeams();
}

function renderRoster() {
  if (!teams.length) return;
  if (!teams.some(t => t.name === selectedRosterTeamName)) selectedRosterTeamName = teams[0].name;
  const team = teams.find(t => t.name === selectedRosterTeamName) || teams[0];
  const select = $('rosterTeamSelect');
  select.innerHTML = teams.map(t => `<option value="${escapeAttr(t.name)}" ${t.name===team.name?'selected':''}>${escapeHtml(t.name)}${t.user?' (You)':''}</option>`).join('');
  $('rosterBudgetBadge').textContent = `$${team.budget}`;
  $('myRoster').innerHTML = team.roster.map(r => `<div class="roster-row">
    <div class="roster-slot">${r.slot}</div>
    <div class="roster-player ${r.player?'':'empty'}">${r.player ? escapeHtml(r.player.name) : '—'}</div>
    <div class="roster-price">${r.player ? '$'+r.price : ''}</div>
  </div>`).join('');
}

function renderPlayers() {
  const q = $('searchInput').value.trim().toLowerCase();
  const pos = $('positionFilter').value;
  const filtered = players.filter(p => (!q || `${p.name} ${p.team}`.toLowerCase().includes(q)) && (pos === 'ALL' || p.position === pos));
  const available = players.filter(p => !p.draftedBy).length;
  $('playerCount').textContent = `${available} available · ${players.length} loaded`;
  $('playerTableBody').innerHTML = filtered.sort((a,b) => ((b.espnValue ?? b.value)-(a.espnValue ?? a.value)) || (b.value-a.value) || a.name.localeCompare(b.name)).map(p => `<tr>
      <td class="player-cell">${escapeHtml(p.name)}</td>
      <td>${displayPos(p.position)}</td>
      <td>${escapeHtml(p.team || '—')}</td>
      <td class="value-cell">${displaySourceValue(p.espnValue)}</td>
      <td class="value-cell secondary-value">${displaySourceValue(p.leagueValue)}</td>
      <td class="${p.draftedBy?'status-drafted':'status-available'}">${p.draftedBy ? `${escapeHtml(p.draftedBy)} · $${p.price}` : 'Available'}</td>
      <td>${(!p.draftedBy && draftStarted && !draftPaused && teams[nominationIndex]?.user && !activeAuction && canRoster(teams[nominationIndex], p.position) && maxLegalBid(teams[nominationIndex]) >= 1) ? `<button class="btn secondary nominate-btn" data-nominate="${escapeAttr(p.id)}">Nominate</button>` : ''}</td>
    </tr>`).join('');
  document.querySelectorAll('[data-nominate]').forEach(btn => btn.onclick = () => nominateById(btn.dataset.nominate));
}

function renderSetup() {
  const personaOptions = ['Historical', ...Object.keys(GENERIC_PERSONAS)];
  $('personaSetup').innerHTML = TEAM_NAMES.slice(1).map(name => {
    const selected = personaSelections[name] || 'Historical';
    return `<div class="persona-row">
      <div class="persona-name">${name}</div>
      <select data-persona="${name}">${personaOptions.map(o => `<option value="${o}" ${o===selected?'selected':''}>${o}</option>`).join('')}</select>
      <div class="persona-desc" id="desc-${name}">${personaDescription(name, selected)}</div>
    </div>`;
  }).join('');
  document.querySelectorAll('[data-persona]').forEach(sel => sel.onchange = () => {
    personaSelections[sel.dataset.persona] = sel.value;
    $(`desc-${sel.dataset.persona}`).textContent = personaDescription(sel.dataset.persona, sel.value);
  });
}

function personaDescription(name, selected) {
  return selected === 'Historical' ? HISTORICAL[name].description : GENERIC_PERSONAS[selected].description;
}

function getPersona(name) {
  const selected = personaSelections[name] || 'Historical';
  return selected === 'Historical' ? HISTORICAL[name] : GENERIC_PERSONAS[selected];
}

function setAuctionEmpty(title, text) {
  $('auctionEmpty').classList.remove('hidden');
  $('auctionActive').classList.add('hidden');
  $('auctionCard').classList.add('empty');
  $('auctionEmpty').querySelector('h1').textContent = title;
  $('auctionEmpty').querySelector('p').textContent = text;
  $('emptyImportBtn').classList.toggle('hidden', players.length > 0);
  $('timer').textContent = '--';
  $('nominationTurn').textContent = draftStarted ? `${teams[nominationIndex]?.name}'s nomination` : 'Waiting to start';
}

function updateControls() {
  $('startBtn').disabled = !players.length || draftStarted;
  $('importBtn').disabled = draftStarted;
  $('emptyImportBtn').disabled = draftStarted;
  $('setupBtn').disabled = draftStarted;
  $('resetBtn').disabled = !players.length;
  $('pauseBtn').disabled = !draftStarted;
  const pauseText = draftPaused ? 'Resume Draft' : 'Pause Draft';
  $('pauseBtn').textContent = pauseText;
  $('nominatePauseBtn').textContent = pauseText;
  $('pauseBtn').classList.toggle('pause-active', draftPaused);
  $('nominatePauseBtn').classList.toggle('pause-active', draftPaused);
  document.querySelector('.auction-stage')?.classList.toggle('paused', draftPaused);
  $('timerLabel').textContent = draftPaused ? 'PAUSED' : 'CLOCK';
  updateBidButtons();
}

function startDraft() {
  if (!players.length || draftStarted) return;
  draftPaused = false;
  pendingDraftAction = null;
  draftStarted = true;
  $('startBtn').disabled = true;
  log('Draft started.', 'system');
  nextNomination();
}

function nextNomination() {
  if (draftPaused) { pendingDraftAction = {type:'nextNomination'}; return; }
  clearTimers();
  activeAuction = null;
  userPassed = false;
  if (isDraftComplete()) return finishDraft();

  let attempts = 0;
  while (teams[nominationIndex].draftedCount >= ROSTER_TEMPLATE.length && attempts < teams.length) {
    nominationIndex = (nominationIndex + 1) % teams.length; attempts++;
  }
  renderAll();
  const nominator = teams[nominationIndex];
  $('nominationTurn').textContent = `${nominator.name}'s nomination`;
  if (nominator.user) openNominateModal();
  else {
    setAuctionEmpty(`${nominator.name} is nominating…`, 'NPC nominations can target needs, values, or players likely to drain opponents’ budgets.');
    const delay = getSpeed() === 'realtime' ? 1100 : getSpeed() === 'fast' ? 450 : 60;
    scheduleDraftAction({type:'npcNominate', teamName:nominator.name}, delay);
  }
}

function npcNominate(team) {
  if (!draftStarted || draftPaused || activeAuction || team !== teams[nominationIndex]) return;
  const available = players.filter(p => !p.draftedBy && canRoster(team,p.position) && maxLegalBid(team) >= 1);
  if (!available.length) { advanceNomination(); return; }
  const persona = getPersona(team.name);

  const progress = auctionStageProgress();
  const catchup = rosterCatchupUrgency(team);
  const completionPressure = offensiveStarterCompletionPressure(team);
  const coreNeedUrgency = Math.max(...['QB','RB','WR','TE'].map(pos => hardStarterNeed(team,pos) ? positionalNeedUrgency(team,pos) : 0));
  const sleeperChanceBase = progress < .35 ? .18 : progress < .65 ? .12 : .07;
  const sleeperChance = sleeperChanceBase * Math.max(.04, 1 - catchup * .85 - completionPressure * .55 - coreNeedUrgency * .80);
  const sleeperPool = available.filter(p => isSleeperNominationCandidate(p));
  if (sleeperPool.length && Math.random() < sleeperChance) {
    const sleeperCandidates = sleeperPool.map(p => {
      const rank = positionalRank(p);
      const drain = opponentsNeedMultiplier(p.position);
      const need = positionNeedMultiplier(team,p.position);
      const selfInterest = .92 + Math.max(0, need - 1) * .35;
      const midTierSweetSpot = p.value >= 5 && p.value <= 16 ? 1.16 : 1;
      const rankSweetSpot = rank >= 12 && rank <= 28 ? 1.12 : 1;
      const publicHypeValue = Math.max(p.value, finiteSourceValue(p.espnValue) ?? 0);
      return {p, score: Math.max(2,publicHypeValue) * drain * selfInterest * midTierSweetSpot * rankSweetSpot * (0.72 + Math.random()*.56)};
    }).sort((a,b)=>b.score-a.score);
    const sleeperTop = sleeperCandidates.slice(0, Math.min(12,sleeperCandidates.length));
    const sleeperPick = weightedChoice(sleeperTop.map((x,i)=>({value:x.p, weight: Math.max(1, 12-i)})));
    return beginAuction(sleeperPick, team, {mode:'sleeperDrain'});
  }

  const candidates = available.map(p => {
    const need = positionNeedMultiplier(team,p.position);
    const positionalUrgency = positionalNeedUrgency(team,p.position);
    const drain = opponentsNeedMultiplier(p.position);
    const elite = p.value >= 35 ? 1.14 : p.value >= 20 ? 1.06 : 1;
    const budgetPressure = team.budget > 130 ? 1.05 : 1;
    const selfInterest = need * (persona.pos[p.position] || 1);
    const strategicDrain = (Math.random() < .24 && catchup < .45 ? drain * elite : 1);
    const completion = rosterCompletionNominationMultiplier(team,p.position);
    const positionRunPressure = hardStarterNeed(team,p.position) ? 1 + positionalUrgency * 2.10 : 1;
    const nominatorValue = npcAnchorValue(team,p);
    const valueFloor = catchup > .45 ? Math.max(5,nominatorValue) : nominatorValue;
    return {p, score: valueFloor * selfInterest * budgetPressure * strategicDrain * completion * positionRunPressure * (0.78 + Math.random()*.44)};
  }).sort((a,b)=>b.score-a.score);
  const pool = candidates.slice(0, Math.min(10,candidates.length));
  const pick = weightedChoice(pool.map((x,i)=>({value:x.p, weight: Math.max(1, 10-i)})));
  beginAuction(pick, team, {mode:'standard'});
}

function openNominateModal() {
  $('nominateModal').classList.remove('hidden');
  $('nominateSearch').value=''; renderNominateList();
}
function closeNominateModal() { $('nominateModal').classList.add('hidden'); }
function renderNominateList() {
  const q = $('nominateSearch').value.trim().toLowerCase();
  const nominator = teams[nominationIndex];
  const rows = players.filter(p => !p.draftedBy && canRoster(nominator,p.position) && maxLegalBid(nominator) >= 1 && (!q || `${p.name} ${p.team} ${p.position}`.toLowerCase().includes(q)))
    .sort((a,b)=>(b.espnValue ?? b.value)-(a.espnValue ?? a.value) || b.value-a.value).slice(0,120);
  $('nominateList').innerHTML = rows.map(p => `<div class="nominate-row">
    <strong>${escapeHtml(p.name)}</strong><span>${displayPos(p.position)}</span><span>${escapeHtml(p.team||'—')}</span><span>ESPN ${displaySourceValue(p.espnValue)} · Lg ${displaySourceValue(p.leagueValue)}</span>
    <button class="btn primary nominate-btn" data-modal-nominate="${escapeAttr(p.id)}" ${draftPaused?'disabled':''}>Nominate</button>
  </div>`).join('');
  document.querySelectorAll('[data-modal-nominate]').forEach(btn => btn.onclick = () => { closeNominateModal(); nominateById(btn.dataset.modalNominate); });
}

function nominateById(id) {
  if (!draftStarted || draftPaused || activeAuction || !teams[nominationIndex]?.user) return;
  const player = players.find(p => p.id === id && !p.draftedBy);
  if (!player) return;
  const nominator = teams[nominationIndex];
  if (!canRoster(nominator, player.position) || maxLegalBid(nominator) < 1) return toast('You cannot legally nominate this player.');
  beginAuction(player, nominator);
}
