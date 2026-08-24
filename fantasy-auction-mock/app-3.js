function beginAuction(player, nominator, nominationContext = {mode:'standard'}) {
  if (draftPaused) return false;
  if (!canRoster(nominator, player.position) || maxLegalBid(nominator) < 1) {
    if (nominator.user) toast('You cannot legally nominate this player.');
    return false;
  }
  auctionToken++;
  const token = auctionToken;
  const marketBias = auctionMarketBias(player, nominationContext);
  activeAuction = {
    player, nominator, bid: 1, leader: nominator,
    passedBots: new Set(), botCeilings: new Map(), botInterest: new Map(),
    token, nominationMode: nominationContext?.mode || 'standard', marketBias,
    rareHighPriceEligible: rareHighPriceEligible(player)
  };
  for (const team of teams.filter(t => !t.user && canRoster(t, player.position))) {
    const interested = team === nominator || Math.random() < npcParticipationProbability(team, player, nominationContext, marketBias);
    activeAuction.botInterest.set(team.name, interested);
    if (!interested) activeAuction.passedBots.add(team.name);
    activeAuction.botCeilings.set(team.name, npcCeiling(team, player));
  }
  userPassed = false;
  $('auctionEmpty').classList.add('hidden');
  $('auctionActive').classList.remove('hidden');
  $('auctionCard').classList.remove('empty');
  $('activeName').textContent = player.name;
  $('activePos').textContent = displayPos(player.position);
  $('activeMeta').textContent = `${player.team || '—'} · ESPN ${displaySourceValue(player.espnValue)} · League ${displaySourceValue(player.leagueValue)}`;
  $('currentBid').textContent = '$1';
  $('currentLeader').textContent = `${nominator.name} has the high bid`;
  log(`${nominator.name} nominated ${player.name} (${displayPos(player.position)}) for $1.`, 'system');

  countdown = getSpeed()==='realtime' ? 30 : getSpeed()==='fast' ? 8 : 2;
  renderAuctionTimer();
  startAuctionTimers(token);
  updateBidButtons();
  updateControls();
}

function startAuctionTimers(token = activeAuction?.token) {
  if (!activeAuction || draftPaused || activeAuction.token !== token) return;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (draftPaused || !activeAuction || activeAuction.token !== token) return;
    countdown--;
    renderAuctionTimer();
    if (countdown <= 0) settleAuction();
  }, getSpeed()==='instant' ? 250 : 1000);
  scheduleBotDecision();
}

function scheduleBotDecision() {
  if (!activeAuction || draftPaused) return;
  const token = activeAuction.token;
  const delay = getSpeed()==='realtime' ? 650 + Math.random()*950 : getSpeed()==='fast' ? 180 + Math.random()*380 : 35 + Math.random()*70;
  botTickTimeout = setTimeout(() => {
    if (draftPaused || !activeAuction || activeAuction.token !== token) return;
    botBidRound();
    if (activeAuction) scheduleBotDecision();
  }, delay);
}

function botBidRound() {
  const a = activeAuction;
  if (!a || draftPaused) return;
  const candidates = teams.filter(t => !t.user && t !== a.leader && !a.passedBots.has(t.name) && canRoster(t,a.player.position) && maxLegalBid(t) > a.bid);
  if (!candidates.length) return;
  const shuffled = [...candidates].sort(()=>Math.random()-.5);
  for (const team of shuffled) {
    const ceiling = a.botCeilings.get(team.name) ?? npcCeiling(team,a.player);
    const next = a.bid + 1;
    if (next <= ceiling && next <= maxLegalBid(team)) {
      placeBid(team, next);
      return;
    }
    if (a.bid >= Math.max(1, ceiling - 1)) a.passedBots.add(team.name);
  }
}

function npcCeiling(team, player) {
  const persona = getPersona(team.name);
  const base = Math.max(1, npcAnchorValue(team, player));
  const posWeight = persona.pos[player.position] || 1;
  const need = positionNeedMultiplier(team, player.position);
  const budgetPace = budgetPaceMultiplier(team);
  const elite = base >= 40 ? persona.stars : base >= 25 ? 1 + (persona.stars-1)*.65 : 1;
  const scarcity = scarcityMultiplier(player.position);
  const remainingMoneyPressure = marketMoneyMultiplier(team, player.position);
  const targetFit = historicalTargetMultiplier(team, player.position, persona);
  const randomBand = historicalVarianceBand(player.position, persona);
  const randomDelta = (Math.random() * 2 - 1) * randomBand;
  const positionalUrgency = positionalNeedUrgency(team, player.position);

  const adjustmentRate =
      (posWeight - 1) * .22
    + (need - 1) * .18
    + (budgetPace - 1) * .20
    + (elite - 1) * .25
    + (scarcity - 1) * .20
    + (remainingMoneyPressure - 1) * .12
    + (targetFit - 1) * .18
    + (persona.aggression - 1) * .25
    + randomDelta
    + (activeAuction?.marketBias || 0)
    + (hardStarterNeed(team,player.position) ? rosterCatchupUrgency(team) * .07 : 0)
    + (hardStarterNeed(team,player.position) ? offensiveStarterCompletionPressure(team) * .05 : 0)
    + (hardStarterNeed(team,player.position) ? positionalUrgency * .09 : 0);

  let ceiling = base * (1 + adjustmentRate);
  if (base <= 10 && hardStarterNeed(team,player.position) && (rosterCatchupUrgency(team) > .45 || offensiveStarterCompletionPressure(team) > .45 || positionalUrgency > .45)) {
    ceiling = Math.max(ceiling, base + Math.min(3, 1 + Math.round(Math.max(rosterCatchupUrgency(team), positionalUrgency) * 2)));
  }
  if (hardStarterNeed(team,player.position) && positionalUrgency > .35 && base <= 25) {
    ceiling = Math.max(ceiling, base + Math.round(Math.max(0, positionalUrgency - .35) * 3));
  }
  ceiling = Math.min(ceiling, npcHardCeiling(team, player, persona));

  if (player.position === 'K') {
    ceiling = premiumKickerBidders.has(team.name) ? 2 : 1;
  } else if (player.position === 'DST') {
    const specialTeamsTarget = persona.targets?.DST ?? 1;
    ceiling = Math.min(Math.max(2, Math.ceil(specialTeamsTarget)), Math.max(1, ceiling * .45));
  }
  if ((personaSelections[team.name] || 'Historical') === 'Value Hunter' && activeAuction?.bid > base*.98) ceiling *= .90;
  return Math.max(1, Math.round(Math.min(ceiling, maxLegalBid(team))));
}

function npcHardCeiling(team, player, persona) {
  const base = Math.max(1, npcAnchorValue(team, player));
  const selected = personaSelections[team.name] || 'Historical';
  const posWeight = persona.pos[player.position] || 1;
  let premium;

  if (selected === 'Historical') {
    premium = Math.min(8, Math.max(3, base * .18));
    const preferenceBonus = Math.max(0, (posWeight - 1) * 8) + Math.max(0, (persona.aggression - 1) * 10);
    premium += Math.min(2, preferenceBonus);
  } else if (selected === 'Conservative') {
    premium = Math.min(5, Math.max(2, base * .12));
  } else if (selected === 'Aggressive') {
    premium = Math.min(12, Math.max(4, base * .28));
  } else if (selected === 'Stars & Scrubs') {
    premium = base >= 25 ? Math.min(14, Math.max(5, base * .32)) : Math.min(7, Math.max(3, base * .24));
  } else if (selected === 'Value Hunter') {
    premium = Math.min(4, Math.max(1, base * .10));
  } else if (selected === 'RB Heavy' || selected === 'WR Heavy' || selected === 'QB Aggressive') {
    const favored = (selected === 'RB Heavy' && player.position === 'RB') ||
                    (selected === 'WR Heavy' && player.position === 'WR') ||
                    (selected === 'QB Aggressive' && player.position === 'QB');
    premium = favored ? Math.min(11, Math.max(4, base * .25)) : Math.min(8, Math.max(3, base * .18));
  } else {
    premium = Math.min(8, Math.max(3, base * .18));
  }
  let hardCeiling = base + premium;
  if (hardCeiling >= 55) {
    hardCeiling = activeAuction?.rareHighPriceEligible ? Math.min(60, hardCeiling) : 54;
  }
  return hardCeiling;
}

function historicalTargetMultiplier(team, pos, persona) {
  if (!persona.targets || persona.targets[pos] == null) return 1;
  const target = Math.max(1, persona.targets[pos]);
  const spent = team.spentByPos[pos] || 0;
  const ratio = spent / target;
  if (ratio >= 1.25) return .82;
  if (ratio >= 1.00) return .90;
  if (ratio >= .75) return .98;
  if (ratio >= .40) return 1.04;
  return 1.08;
}

function historicalVarianceBand(pos, persona) {
  if (!persona.targets || !persona.sd || persona.targets[pos] == null) return .06;
  const mean = Math.max(1, persona.targets[pos]);
  const sd = Math.max(0, persona.sd[pos] || 0);
  return Math.max(.025, Math.min(.055, .025 + (sd / mean) * .025));
}
