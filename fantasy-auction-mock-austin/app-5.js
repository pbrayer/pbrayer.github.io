function auctionMarketBias(player, nominationContext={mode:'standard'}) {
  const base = Math.max(1, player.value);
  const progress = draftProgress();
  const early = progress < .28;
  const mode = nominationContext?.mode || 'standard';
  const roll = Math.random();

  if (mode === 'sleeperDrain') {
    if (roll < .18) return randomBetween(-.05, -.01);
    if (roll < .48) return randomBetween(-.01, .025);
    return randomBetween(.025, .10);
  }
  if (base >= 35) {
    if (early) {
      if (roll < .22) return randomBetween(-.18, -.10);
      if (roll < .57) return randomBetween(-.05, .005);
      return randomBetween(.015, .055);
    }
    if (roll < .18) return randomBetween(-.06, -.015);
    if (roll < .55) return randomBetween(-.015, .02);
    return randomBetween(.015, .06);
  }
  if (base >= 12) {
    if (early) {
      if (roll < .40) return randomBetween(-.20, -.07);
      if (roll < .80) return randomBetween(-.04, .015);
      return randomBetween(.02, .08);
    }
    if (roll < .25) return randomBetween(-.08, -.02);
    if (roll < .65) return randomBetween(-.02, .025);
    return randomBetween(.02, .075);
  }
  if (early) {
    if (roll < .42) return randomBetween(-.20, -.06);
    if (roll < .78) return randomBetween(-.04, .025);
    return randomBetween(.03, .11);
  }
  if (roll < .30) return randomBetween(-.10, -.02);
  if (roll < .68) return randomBetween(-.02, .035);
  return randomBetween(.03, .12);
}

function npcParticipationProbability(team, player, nominationContext={mode:'standard'}, marketBias=0) {
  const base = Math.max(1, npcAnchorValue(team, player));
  const progress = draftProgress();
  const early = progress < .28;
  const persona = getPersona(team.name);
  const need = positionNeedMultiplier(team, player.position);
  const posWeight = persona.pos[player.position] || 1;
  const selected = personaSelections[team.name] || 'Historical';
  let chance = base >= 35 ? .58 : base >= 12 ? .50 : .36;
  const catchup = rosterCatchupUrgency(team);
  const starterPressure = offensiveStarterCompletionPressure(team);
  const positionalUrgency = positionalNeedUrgency(team, player.position);
  if (early && base < 35) chance -= .05;
  if (need > 1.04) chance += .08;
  if (catchup > 0) chance += catchup * (hardStarterNeed(team,player.position) ? .30 : .12);
  if (starterPressure > 0 && hardStarterNeed(team,player.position)) chance += starterPressure * .22;
  if (positionalUrgency > 0 && hardStarterNeed(team,player.position)) chance += positionalUrgency * .42;
  if (auctionStageProgress() > .72 && base <= 10 && hardStarterNeed(team,player.position)) chance += .10;
  if (posWeight > 1.05) chance += .05;
  if (posWeight < .95) chance -= .05;
  if (selected === 'Aggressive' || selected === 'Stars & Scrubs') chance += .06;
  if (selected === 'Value Hunter') chance -= base >= 35 ? .04 : .07;
  if (nominationContext?.mode === 'sleeperDrain') chance += .16;
  const currentBid = activeAuction?.bid ?? 1;
  const personalDiscount = base > 1 ? (base - currentBid) / base : 0;
  if (personalDiscount > .30) chance += .06;
  else if (personalDiscount < -.08) chance -= .05;
  if (marketBias <= -.08) chance -= .08;
  if (marketBias >= .05) chance += .06;
  let floor = .16;
  if (hardStarterNeed(team,player.position) && positionalUrgency > .45) floor = .68;
  if (hardStarterNeed(team,player.position) && positionalUrgency > .72) floor = .82;
  return Math.max(floor, Math.min(.96, chance));
}

function placeBid(team, amount) {
  const a = activeAuction;
  if (!a || draftPaused || team === a.leader || !canRoster(team,a.player.position)) return false;
  const minBid = a.bid + 1;
  amount = Math.floor(Number(amount));
  if (!Number.isFinite(amount) || amount < minBid || amount > maxLegalBid(team)) return false;
  a.bid = amount; a.leader = team;
  a.passedBots.delete(team.name);
  $('currentBid').textContent = `$${amount}`;
  $('currentLeader').textContent = `${team.name} has the high bid`;
  log(`${team.name} bid $${amount} on ${a.player.name}.`, 'bid');
  if (getSpeed()==='realtime' && countdown <= 10) countdown = 10;
  if (getSpeed()==='fast' && countdown <= 3) countdown = 3;
  if (getSpeed()==='instant') countdown = Math.max(countdown,1);
  renderAuctionTimer(); updateBidButtons(); renderTeams();
  return true;
}

function userBid(increment=null, custom=null) {
  if (!activeAuction || draftPaused || userPassed) return;
  const team = teams[0];
  if (!canRoster(team,activeAuction.player.position)) return toast('You do not have a legal roster spot for this player.');
  let amount = custom != null ? Number(custom) : activeAuction.bid + increment;
  if (!placeBid(team, amount)) toast(`Your maximum legal bid is $${maxLegalBid(team)}.`);
}

function maxLegalBid(team) {
  const slotsLeft = 18 - team.draftedCount;
  return Math.max(0, team.budget - Math.max(0, slotsLeft - 1));
}

function settleAuction() {
  const a = activeAuction;
  if (!a) return;
  const token = a.token;
  clearTimers();
  if (!a.leader) {
    log(`${a.player.name} received no legal bids and returned to the player pool.`, 'system');
  } else {
    assignPlayer(a.leader,a.player,a.bid);
    a.player.draftedBy = a.leader.name; a.player.price = a.bid;
    if (a.bid >= 55) rareHighPriceAuctionsUsed++;
    log(`${a.leader.name} won ${a.player.name} for $${a.bid}.`, 'win');
  }
  activeAuction = null;
  if (auctionToken === token) auctionToken++;
  renderAll();
  setAuctionEmpty('Auction complete', 'Preparing the next nomination…');
  scheduleDraftAction({type:'advanceNomination'}, getSpeed()==='realtime' ? 900 : getSpeed()==='fast' ? 350 : 50);
}

function assignPlayer(team, player, price) {
  const slotIndex = findRosterSlot(team,player.position);
  if (slotIndex < 0) return false;
  team.roster[slotIndex] = {slot:team.roster[slotIndex].slot, player, price};
  team.budget -= price; team.draftedCount++;
  team.spentByPos[player.position] = (team.spentByPos[player.position]||0)+price;
  return true;
}

function findRosterSlot(team,pos) {
  const limit = POSITION_LIMITS[pos];
  if (limit != null && (rosterCounts(team)[pos] || 0) >= limit) return -1;
  const open = (slot) => team.roster.findIndex(r=>r.slot===slot && !r.player);
  let idx = open(pos);
  if (idx >= 0) return idx;
  if (['RB','WR','TE'].includes(pos)) { idx = open('FLEX'); if (idx>=0) return idx; }
  if (['QB','RB','WR','TE'].includes(pos)) { idx = open('OP'); if (idx>=0) return idx; }
  idx = open('BE'); return idx;
}

function canRoster(team,pos) { return (POSITION_LIMITS[pos] == null || (rosterCounts(team)[pos] || 0) < POSITION_LIMITS[pos]) && findRosterSlot(team,pos) >= 0 && team.draftedCount < 18; }
function hasFilledSlot(team,slot) { return team.roster.some(r=>r.slot===slot && r.player); }
function openFlexCount(team) { return team.roster.filter(r=>r.slot==='FLEX' && !r.player).length; }
function rosterCounts(team) {
  const c={QB:0,RB:0,WR:0,TE:0,K:0,DST:0};
  for (const r of team.roster) if (r.player) c[r.player.position]=(c[r.player.position]||0)+1;
  return c;
}
function advanceNomination() {
  if (draftPaused) { pendingDraftAction = {type:'advanceNomination'}; return; }
  nominationIndex = (nominationIndex + 1) % teams.length;
  nextNomination();
}
function isDraftComplete() { return teams.every(t=>t.draftedCount>=18) || players.filter(p=>!p.draftedBy).length===0; }
function finishDraft() {
  draftStarted=false; draftPaused=false; pendingDraftAction=null; clearTimers(); closeNominateModal();
  setAuctionEmpty('Draft complete', 'Reset the draft to run another mock with the same values and personas.');
  log('Draft complete.', 'system'); renderAll();
}
