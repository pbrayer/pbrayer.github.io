function budgetPaceMultiplier(team) {
  const persona = team.user ? null : getPersona(team.name);
  const reserve = persona?.reserve || 1;
  const spotsFilled = team.draftedCount;
  const expectedSpent = 200 * (spotsFilled / 18);
  const actualSpent = 200 - team.budget;
  let pace = 1;
  if (actualSpent < expectedSpent - 20) pace = 1.10;
  else if (actualSpent < expectedSpent - 8) pace = 1.05;
  else if (actualSpent > expectedSpent + 25) pace = .90;
  else if (actualSpent > expectedSpent + 12) pace = .95;

  const stage = auctionStageProgress();
  const discretionary = Math.max(0, team.budget - Math.max(0, 18 - team.draftedCount));
  if (stage > .78 && discretionary > 30) pace += .06;
  if (stage > .88 && discretionary > 18) pace += .07;
  if (team.name === 'Cole' && stage > .68 && discretionary > 18) pace += .05;
  if (team.name === 'Cole' && stage > .86 && discretionary > 8) pace += .05;
  return pace / reserve;
}

function positionNeedMultiplier(team,pos) {
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
  if (pos === 'TE' && counts.TE < 1) return 1.11 + hardNeedBonus;

  if (pos === 'K' && counts.K === 0) return progress > .84 ? 1.20 + hardNeedBonus*.5 : .82;
  if (pos === 'DST' && counts.DST === 0) return progress > .84 ? 1.20 + hardNeedBonus*.5 : .82;

  if (['RB','WR','TE'].includes(pos) && openFlexCount(team) > 0) return 1.05 + flexNeedBonus;
  if (counts[pos] >= (POSITION_LIMITS[pos] ?? 1)) return .70;
  return .96;
}

function offensiveStarterSlotsFilled(team) {
  return team.roster.filter(r => !['BE','K','DST'].includes(r.slot) && r.player).length;
}

function offensiveStarterCompletionPressure(team) {
  if (team.user) return 0;
  const progress = auctionStageProgress();
  const filled = offensiveStarterSlotsFilled(team);
  const pace = team.rosterPace || 'standard';
  let target = 0;
  if (pace === 'standard') {
    if (progress >= .78) target = 9;
    else if (progress >= .66) target = 8;
    else if (progress >= .55) target = 7;
    else if (progress >= .43) target = 5;
  } else if (pace === 'patient') {
    if (progress >= .84) target = 9;
    else if (progress >= .72) target = 8;
    else if (progress >= .60) target = 6;
    else if (progress >= .48) target = 5;
  } else {
    if (progress >= .92) target = 9;
    else if (progress >= .84) target = 7;
    else if (progress >= .72) target = 5;
  }
  if (!target || filled >= target) return 0;
  return Math.min(1, (target - filled) / 3 + .25);
}

function minimumRosterTarget(team, progress=auctionStageProgress()) {
  const pace = team.rosterPace || 'standard';
  const table = pace === 'yolo'
    ? [[.52,4],[.64,5],[.74,6],[.84,8],[.92,12]]
    : pace === 'patient'
      ? [[.45,5],[.56,7],[.66,8],[.76,10],[.86,12],[.93,15]]
      : [[.42,6],[.52,8],[.62,9],[.72,11],[.82,13],[.90,15]];
  let target = 0;
  for (const [threshold,count] of table) if (progress >= threshold) target = count;
  return target;
}

function rosterCatchupUrgency(team) {
  if (team.user) return 0;
  const progress = auctionStageProgress();
  const minimum = minimumRosterTarget(team, progress);
  if (!minimum || team.draftedCount >= minimum) return 0;
  const deficit = minimum - team.draftedCount;
  return Math.min(1, .25 + deficit * .22 + Math.max(0, progress-.60) * .55);
}

function hardStarterNeed(team,pos) {
  const c = rosterCounts(team);
  if (pos === 'QB') return c.QB < 2;
  if (pos === 'RB') return c.RB < 2;
  if (pos === 'WR') return c.WR < 2;
  if (pos === 'TE') return c.TE < 1;
  if (pos === 'K') return c.K < 1 && auctionStageProgress() > .84;
  if (pos === 'DST') return c.DST < 1 && auctionStageProgress() > .84;
  return false;
}

function rosterCompletionNominationMultiplier(team,pos) {
  const catchup = rosterCatchupUrgency(team);
  const starterPressure = offensiveStarterCompletionPressure(team);
  const positionalUrgency = positionalNeedUrgency(team,pos);
  if (!catchup && !starterPressure && !positionalUrgency) return 1;
  if (hardStarterNeed(team,pos)) return 1 + catchup * 1.30 + starterPressure * 1.25 + positionalUrgency * 1.55;
  if (['RB','WR','TE'].includes(pos) && openFlexCount(team) > 0) return 1 + catchup * .35 + starterPressure * .35;
  return 1 + catchup * .12;
}

function leagueMoneyProgress() {
  if (!teams.length) return 0;
  const total = teams.length * 200;
  const remaining = teams.reduce((sum,t) => sum + t.budget, 0);
  return Math.max(0, Math.min(1, (total - remaining) / total));
}

function auctionStageProgress() {
  const slotProgress = draftProgress();
  const moneyProgress = leagueMoneyProgress();
  const economicStage = moneyProgress <= .75 ? 0 : Math.min(1, .60 + (moneyProgress - .75) * 1.60);
  return Math.max(slotProgress, economicStage);
}

function positionMarketDepletion(pos) {
  const core = CORE_POSITION_POOL[pos];
  if (!core) return 0;
  const ranked = players.filter(p => p.position === pos)
    .sort((a,b) => (b.value-a.value) || a.name.localeCompare(b.name));
  const relevant = ranked.slice(0, Math.min(core, ranked.length));
  if (!relevant.length) return 0;
  const drafted = relevant.filter(p => p.draftedBy).length;
  return drafted / relevant.length;
}

function positionalNeedUrgency(team,pos) {
  if (team.user || !['QB','RB','WR','TE'].includes(pos) || !hardStarterNeed(team,pos)) return 0;
  const c = rosterCounts(team);
  const depletion = positionMarketDepletion(pos);
  let threshold = .45;
  if (pos === 'QB') threshold = c.QB === 0 ? .22 : .46;
  else if (pos === 'RB') threshold = c.RB === 0 ? .25 : .48;
  else if (pos === 'WR') threshold = c.WR === 0 ? .28 : .52;
  else if (pos === 'TE') threshold = .30;
  if (depletion <= threshold) return 0;

  let urgency = .14 + (depletion - threshold) * 1.65;
  const pace = team.rosterPace || 'standard';
  if (pace === 'patient') urgency *= .88;
  if (pace === 'yolo') urgency *= depletion > .78 ? .90 : .62;
  const stage = auctionStageProgress();
  if (stage > .80) urgency += (stage - .80) * .65;
  return Math.max(0, Math.min(1, urgency));
}

function scarcityMultiplier(pos) {
  const available = players.filter(p => !p.draftedBy && p.position === pos).sort((a,b)=>b.value-a.value);
  if (!available.length) return 1;
  const top = available.slice(0, pos==='QB'?12:pos==='TE'?10:20);
  const avg = top.reduce((s,p)=>s+p.value,0)/top.length;
  if (pos==='QB' && avg >= 18) return 1.05;
  if (pos==='TE' && avg >= 12) return 1.03;
  return 1;
}

function marketMoneyMultiplier(team,pos) {
  const opponents = teams.filter(t=>t!==team && canRoster(t,pos));
  if (!opponents.length) return 1;
  const avgBudget = opponents.reduce((s,t)=>s+t.budget,0)/opponents.length;
  if (avgBudget > team.budget + 28) return 1.04;
  if (avgBudget < team.budget - 35) return .97;
  return 1;
}

function opponentsNeedMultiplier(pos) {
  const needy = teams.filter(t => canRoster(t,pos) && positionNeedMultiplier(t,pos) > 1.04).length;
  return 1 + Math.min(.16, needy*.016);
}

function draftProgress() {
  const drafted = players.filter(p => p.draftedBy).length;
  const totalRosterSpots = teams.length * ROSTER_TEMPLATE.length;
  return totalRosterSpots ? Math.min(1, drafted / totalRosterSpots) : 0;
}

function positionalRank(player) {
  const ranked = players
    .filter(p => p.position === player.position)
    .sort((a,b) => (b.value-a.value) || a.name.localeCompare(b.name));
  const idx = ranked.findIndex(p => p.id === player.id);
  return idx >= 0 ? idx + 1 : 999;
}

function isSleeperNominationCandidate(player) {
  if (!['QB','RB','WR','TE'].includes(player.position)) return false;
  const rank = positionalRank(player);
  const ranges = {
    QB: {min:10,max:26,maxValue:20},
    RB: {min:11,max:35,maxValue:22},
    WR: {min:11,max:35,maxValue:22},
    TE: {min:5,max:15,maxValue:14}
  };
  const r = ranges[player.position];
  return !!r && rank >= r.min && rank <= r.max && player.value >= 2 && player.value <= r.maxValue;
}

function randomBetween(min,max) { return min + Math.random() * (max-min); }
