const RANKS = ["1", "2", "3", "4", "5", "6", "7"];
const CENTER_RANKS = ["3", "4", "5"];
const TOTAL_ROUNDS = 2;
const SHORT_LINE_POINTS = 250;
const LONG_LINE_POINTS = 500;
const SMALL_X_POINTS = 1000;
const BIG_X_POINTS = 2000;
const BASE_BOMB_CHANCE = 8;
const BOMB_CHANCE_STEP = 4;
const MAX_BOMB_CHANCE = 28;
const WILD_DRAW_CHANCE = 12;
const TEAM_LABEL = { red: "Red", blue: "Blue CPU" };
const DRAW_ASSIST_CHANCE = 34;
const STUCK_DRAW_ASSIST_CHANCE = 88;
const RESCUE_DRAW_LIMIT = 2;
const RESCUE_BOMB_CHANCE = 38;
const CPU_PASS_CHANCE = {
  behind: 0.01,
  close: 0.06,
  ahead: 0.2
};

const X_DEFS = [
  {
    id: "north-west",
    name: "Small X",
    type: "small",
    cells: [
      { id: "nw-0", row: 1, col: 1, pos: "nw" },
      { id: "nw-1", row: 1, col: 3, pos: "ne" },
      { id: "nw-2", row: 2, col: 2, pos: "c", center: true },
      { id: "nw-3", row: 3, col: 1, pos: "sw" },
      { id: "nw-4", row: 3, col: 3, pos: "se" }
    ]
  },
  {
    id: "north-east",
    name: "Small X",
    type: "small",
    cells: [
      { id: "ne-0", row: 1, col: 1, pos: "nw" },
      { id: "ne-1", row: 1, col: 3, pos: "ne" },
      { id: "ne-2", row: 2, col: 2, pos: "c", center: true },
      { id: "ne-3", row: 3, col: 1, pos: "sw" },
      { id: "ne-4", row: 3, col: 3, pos: "se" }
    ]
  },
  {
    id: "south-west",
    name: "Small X",
    type: "small",
    cells: [
      { id: "sw-0", row: 1, col: 1, pos: "nw" },
      { id: "sw-1", row: 1, col: 3, pos: "ne" },
      { id: "sw-2", row: 2, col: 2, pos: "c", center: true },
      { id: "sw-3", row: 3, col: 1, pos: "sw" },
      { id: "sw-4", row: 3, col: 3, pos: "se" }
    ]
  },
  {
    id: "south-east",
    name: "Small X",
    type: "small",
    cells: [
      { id: "se-0", row: 1, col: 1, pos: "nw" },
      { id: "se-1", row: 1, col: 3, pos: "ne" },
      { id: "se-2", row: 2, col: 2, pos: "c", center: true },
      { id: "se-3", row: 3, col: 1, pos: "sw" },
      { id: "se-4", row: 3, col: 3, pos: "se" }
    ]
  },
  {
    id: "super",
    name: "Big X",
    type: "super",
    cells: [
      { id: "su-0", row: 1, col: 1, pos: "nw-far" },
      { id: "su-1", row: 2, col: 2, pos: "nw-near" },
      { id: "su-2", row: 1, col: 5, pos: "ne-far" },
      { id: "su-3", row: 2, col: 4, pos: "ne-near" },
      { id: "su-4", row: 3, col: 3, pos: "c", center: true },
      { id: "su-5", row: 4, col: 2, pos: "sw-near" },
      { id: "su-6", row: 5, col: 1, pos: "sw-far" },
      { id: "su-7", row: 4, col: 4, pos: "se-near" },
      { id: "su-8", row: 5, col: 5, pos: "se-far" }
    ]
  }
];

const LINE_DEFS = X_DEFS.flatMap((x) => {
  if (x.type === "super") {
    return [
      { id: `${x.id}-down-diagonal`, xId: x.id, name: "Long", points: LONG_LINE_POINTS, cells: ["su-0", "su-1", "su-4", "su-7", "su-8"] },
      { id: `${x.id}-up-diagonal`, xId: x.id, name: "Long", points: LONG_LINE_POINTS, cells: ["su-2", "su-3", "su-4", "su-5", "su-6"] }
    ];
  }
  const p = x.cells.map((cell) => cell.id);
  return [
    { id: `${x.id}-down-diagonal`, xId: x.id, name: "Short", points: SHORT_LINE_POINTS, cells: [p[0], p[2], p[4]] },
    { id: `${x.id}-up-diagonal`, xId: x.id, name: "Short", points: SHORT_LINE_POINTS, cells: [p[1], p[2], p[3]] }
  ];
});

function getXPoints(x) {
  return x.type === "super" ? BIG_X_POINTS : SMALL_X_POINTS;
}

const BOARD_ORIGINS = {
  "north-west": { col: 0, row: 1 },
  "north-east": { col: 10, row: 1 },
  "south-west": { col: 0, row: 9 },
  "south-east": { col: 10, row: 9 },
  super: { col: 4, row: 4 }
};

const state = {
  round: 1,
  scores: { red: 0, blue: 0 },
  roundScores: {
    1: { red: null, blue: null },
    2: { red: null, blue: null }
  },
  turn: "blue",
  phase: "cpu",
  selectedTileId: null,
  chain: 0,
  rescueDraws: { red: 0, blue: 0 },
  racks: { red: [], blue: [] },
  board: {},
  lastEvent: "Welcome to Cross Locked Lite.",
  bombChance: BASE_BOMB_CHANCE,
  bomb: null,
  celebratingX: null,
  celebratingLines: [],
  cpuThinkingCells: [],
  cpuTimer: null,
  roundFinalized: false,
  pendingScoreCellId: null
};

const els = {
  board: document.querySelector("#board"),
  tileBag: document.querySelector("#tileBag"),
  rack: document.querySelector("#rack"),
  redRound1Score: document.querySelector("#redRound1Score"),
  blueRound1Score: document.querySelector("#blueRound1Score"),
  redRound2Score: document.querySelector("#redRound2Score"),
  blueRound2Score: document.querySelector("#blueRound2Score"),
  redRound2Row: document.querySelector("#redRound2Row"),
  blueRound2Row: document.querySelector("#blueRound2Row"),
  redTotalScore: document.querySelector("#redTotalScore"),
  blueTotalScore: document.querySelector("#blueTotalScore"),
  turnTitle: document.querySelector("#turnTitle"),
  statusText: document.querySelector("#statusText"),
  riskPips: document.querySelector("#riskPips"),
  drawPlayBtn: document.querySelector("#drawPlayBtn"),
  endTurnBtn: document.querySelector("#endTurnBtn"),
  rulesDialog: document.querySelector("#rulesDialog"),
  rulesBtn: document.querySelector("#rulesBtn"),
  closeRulesBtn: document.querySelector("#closeRulesBtn"),
  messageDialog: document.querySelector("#messageDialog"),
  messageEyebrow: document.querySelector("#messageEyebrow"),
  messageTitle: document.querySelector("#messageTitle"),
  messageBody: document.querySelector("#messageBody"),
  messageActionBtn: document.querySelector("#messageActionBtn")
};

let pendingMessageAction = null;
let statusTypingTimer = null;
let hasTypedFirstPlayerInstruction = false;
let playerIdleTimer = null;
let playerIdleKey = "";
const PLAYER_IDLE_REMINDER_MS = 15000;

function motionDuration(duration) {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : duration;
}

function runAfterAnimation(animation, duration, callback) {
  let finished = false;
  let fallbackTimer = null;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    callback();
  };
  animation.onfinish = finish;
  animation.oncancel = finish;
  animation.finished?.then(finish, finish);
  fallbackTimer = window.setTimeout(finish, duration + 100);
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function randomRank() {
  return RANKS[Math.floor(Math.random() * RANKS.length)];
}

function randomCenterRank() {
  return CENTER_RANKS[Math.floor(Math.random() * CENTER_RANKS.length)];
}

function makeTile(color, rank = randomRank(), seeded = false) {
  return { id: uid(color), type: "score", color, rank, seeded };
}

function makeWildTile(color) {
  return { id: uid(`${color}-wild`), type: "wild", color, rank: "W", seeded: false };
}

function drawRackTile(color, allowWild = true) {
  return allowWild && Math.random() * 100 < WILD_DRAW_CHANCE ? makeWildTile(color) : makeTile(color);
}

function drawSmartRackTile(color) {
  const assistChance = hasPlayableTile(color) ? DRAW_ASSIST_CHANCE : STUCK_DRAW_ASSIST_CHANCE;
  if (Math.random() * 100 >= assistChance) return drawRackTile(color);
  return drawPlayableRackTile(color) || drawRackTile(color);
}

function drawPlayableRackTile(color) {
  const openCells = Object.keys(state.board).filter((cellId) => !state.board[cellId]);
  const rankChoices = shuffle(RANKS.map((rank) => makeTile(color, rank)))
    .filter((tile) => openCells.some((cellId) => canPlaceTile(tile, cellId).ok));
  if (rankChoices.length) return rankChoices[0];
  const wild = makeWildTile(color);
  return openCells.some((cellId) => canPlaceTile(wild, cellId).ok) ? wild : null;
}

function describeTile(tile) {
  return tile.type === "wild" ? "a Wild" : `a ${tile.rank}`;
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function winnerText(redScore, blueScore, label) {
  if (redScore === blueScore) return `${label} is a tie`;
  return `${redScore > blueScore ? "Red" : "Blue CPU"} wins the ${label.toLowerCase()}`;
}

function showMessage({ eyebrow, title, body, scoreCard = null, actionText = "Continue", onAction = null }) {
  els.messageEyebrow.textContent = eyebrow;
  els.messageTitle.textContent = title;
  els.messageBody.replaceChildren(scoreCard ? renderScoreCard(scoreCard) : document.createTextNode(body));
  els.messageActionBtn.textContent = actionText;
  pendingMessageAction = onAction;
  if (!els.messageDialog.open) els.messageDialog.showModal();
}


function renderScoreCard(card) {
  const wrap = document.createElement("div");
  wrap.className = "score-card";
  card.rows.forEach(({ label, red, blue, total }) => {
    const row = document.createElement("div");
    row.className = `score-card-row ${total ? "total" : ""}`;
    row.innerHTML = `
      <span>${label}</span>
      <strong class="red">${red ?? "-"}</strong>
      <strong class="blue">${blue ?? "-"}</strong>
    `;
    wrap.append(row);
  });
  const footer = document.createElement("p");
  footer.className = "score-card-note";
  footer.textContent = card.note;
  wrap.append(footer);
  return wrap;
}

function buildScoreCard(note) {
  return {
    rows: [
      { label: "Round 1", ...state.roundScores[1] },
      { label: "Round 2", ...state.roundScores[2] },
      { label: "Game Total", red: state.scores.red, blue: state.scores.blue, total: true }
    ],
    note
  };
}

function setupRound() {
  window.clearTimeout(state.cpuTimer);
  state.selectedTileId = null;
  state.chain = 0;
  state.rescueDraws = { red: 0, blue: 0 };
  state.bombChance = BASE_BOMB_CHANCE;
  state.racks.red = [];
  state.racks.blue = [];
  state.board = {};
  state.bomb = null;
  state.celebratingX = null;
  state.celebratingLines = [];
  state.cpuThinkingCells = [];
  state.roundFinalized = false;
  state.pendingScoreCellId = null;
  X_DEFS.flatMap((x) => x.cells).forEach((cell) => {
    state.board[cell.id] = null;
  });
  const boardDeals = seedCenters();
  const redRackDeals = drawStartingRack("red");
  drawStartingRack("blue");
  state.turn = state.round === 2 ? "red" : "blue";
  state.phase = "dealing";
  state.lastEvent = `Round ${state.round}: ${TEAM_LABEL[state.turn]} starts.`;
  render();
  animateOpeningDeal(boardDeals, redRackDeals, () => {
    if (state.phase !== "dealing") return;
    state.phase = state.turn === "red" ? "needDraw" : "cpu";
    render();
    if (state.turn === "blue") {
      state.cpuTimer = window.setTimeout(runCpuTurn, motionDuration(360));
    }
  });
}

function seedCenters() {
  const deals = [];
  const smallCenters = shuffle(X_DEFS.filter((x) => x.type === "small").map((x) => x.cells.find((cell) => cell.center).id));
  const redSmallCount = Math.ceil(smallCenters.length / 2);
  smallCenters.slice(0, redSmallCount).forEach((cellId) => {
    deals.push({ tile: makeTile("red", randomCenterRank(), true), cellId });
  });
  smallCenters.slice(redSmallCount).forEach((cellId) => {
    deals.push({ tile: makeTile("blue", randomCenterRank(), true), cellId });
  });
  const superCenter = getXDef("super").cells.find((cell) => cell.center).id;
  const superColor = state.round === 2 ? "blue" : "red";
  deals.push({ tile: makeTile(superColor, randomCenterRank(), true), cellId: superCenter });
  return deals;
}

function drawStartingRack(color) {
  const deals = [];
  state.racks[color].push(makeWildTile(color));
  deals.push(state.racks[color][0]);
  while (state.racks[color].length < 10) {
    const tile = makeTile(color);
    state.racks[color].push(tile);
    deals.push(tile);
  }
  state.racks[color] = shuffle(state.racks[color]);
  return deals;
}

function getXDef(xId) {
  return X_DEFS.find((x) => x.id === xId);
}

function getCellDef(cellId) {
  return X_DEFS
    .flatMap((x) => x.cells.map((cell) => ({ ...cell, xId: x.id, xType: x.type })))
    .find((cell) => cell.id === cellId);
}

function getLinesForCell(cellId) {
  return LINE_DEFS.filter((line) => line.cells.includes(cellId));
}

function getLineTiles(line) {
  return line.cells.map((id) => state.board[id]).filter(Boolean);
}

function isLineFull(line) {
  return line.cells.every((id) => state.board[id]);
}

function isXFull(x) {
  return x.cells.every((cell) => state.board[cell.id]);
}

function getAdjacentOccupiedTiles(cellId) {
  return getLinesForCell(cellId).flatMap((line) => {
    const index = line.cells.indexOf(cellId);
    return [line.cells[index - 1], line.cells[index + 1]]
      .filter(Boolean)
      .map((id) => state.board[id])
      .filter(Boolean);
  });
}

function canTouch(tile, neighbor) {
  if (tile.type === "wild" || neighbor.type === "wild") return true;
  const distance = Math.abs(Number(tile.rank) - Number(neighbor.rank));
  return distance === 0 || distance === 1;
}

function asResolvedWild(tile, rank) {
  return { ...tile, type: "score", rank, actedAsWild: true };
}

function canResolvedTileFit(tile, cellId) {
  const lines = getLinesForCell(cellId);
  const neighbors = getAdjacentOccupiedTiles(cellId);
  if (!neighbors.length && !canPlaceAtOpenBigXEnd(tile, cellId)) return false;
  if (neighbors.length && !neighbors.every((neighbor) => canTouch(tile, neighbor))) return false;
  const fits = lines.some((line) => lineFitsWithTile(line, tile, cellId));
  return fits;
}

function scoreResolvedWildChoice(tile, cellId, team) {
  state.board[cellId] = tile;
  let value = scoreRound()[team].total;
  getLinesForCell(cellId).forEach((line) => {
    const tiles = getLineTiles(line);
    if (tiles.every((item) => item.color === team) && lineCanSupportPattern(line)) value += tiles.length * 4;
  });
  state.board[cellId] = null;
  return value;
}

function resolveWildForPlacement(tile, cellId, team = tile.color) {
  if (tile.type !== "wild") return tile;
  const choices = RANKS
    .map((rank) => asResolvedWild(tile, rank))
    .filter((candidate) => canResolvedTileFit(candidate, cellId))
    .map((candidate) => ({ tile: candidate, value: scoreResolvedWildChoice(candidate, cellId, team) }))
    .sort((a, b) => b.value - a.value || Number(a.tile.rank) - Number(b.tile.rank));
  if (choices.length) return choices[0].tile;
  const neighbor = getAdjacentOccupiedTiles(cellId).find((item) => item.type !== "wild");
  return asResolvedWild(tile, neighbor?.rank || "1");
}

function lineQualifiesForTeam(line, team) {
  if (!isLineFull(line)) return false;
  const tiles = line.cells.map((id) => state.board[id]);
  return tiles.every((tile) => tile.color === team) && lineCanSupportPattern(line);
}

function xQualifiesForTeam(x, team) {
  if (!isXFull(x)) return false;
  if (!x.cells.every((cell) => state.board[cell.id].color === team)) return false;
  return LINE_DEFS.filter((line) => line.xId === x.id).every((line) => lineCanSupportPattern(line));
}

function canPlaceTile(tile, cellId) {
  const cell = getCellDef(cellId);
  if (!cell || state.board[cellId]) return { ok: false, reason: "That spot is already full." };
  if (!tile || !["score", "wild"].includes(tile.type)) return { ok: false, reason: "Pick a tile first." };
  const lines = getLinesForCell(cellId);
  const neighbors = getAdjacentOccupiedTiles(cellId);
  const openBigXEnd = canPlaceAtOpenBigXEnd(tile, cellId);
  if (!neighbors.length && !openBigXEnd) return { ok: false, reason: "Choose a red-outlined space beside an existing tile." };
  if (tile.type === "wild") return { ok: true };
  if (neighbors.length && !neighbors.every((neighbor) => canTouch(tile, neighbor))) {
    return { ok: false, reason: "Tiles can only touch the same number, or the next number up or down." };
  }
  const fits = lines.some((line) => lineFitsWithTile(line, tile, cellId));
  return fits ? { ok: true } : { ok: false, reason: "That line must use matching numbers or a clean step-by-one sequence." };
}

function lineFitsWithTile(line, tile, cellId) {
  state.board[cellId] = tile;
  const fits = lineCanSupportPattern(line);
  state.board[cellId] = null;
  return fits;
}

function lineCanSupportPattern(line) {
  const tiles = line.cells.map((id) => state.board[id]);
  const known = tiles
    .map((tile, index) => ({ tile, index }))
    .filter(({ tile }) => tile && tile.type !== "wild");
  if (known.length < 2) return false;
  if (known.every(({ tile }) => tile.rank === known[0].tile.rank)) return true;
  const ascendingStart = known[0].tile.rank - known[0].index;
  const canAscend = known.every(({ tile, index }) => Number(tile.rank) - index === ascendingStart);
  if (canAscend && ascendingStart >= 1 && ascendingStart + line.cells.length - 1 <= Number(RANKS.at(-1))) return true;
  const descendingStart = Number(known[0].tile.rank) + known[0].index;
  const canDescend = known.every(({ tile, index }) => Number(tile.rank) + index === descendingStart);
  return canDescend && descendingStart <= Number(RANKS.at(-1)) && descendingStart - line.cells.length + 1 >= 1;
}

function canPlaceAtOpenBigXEnd(tile, cellId) {
  const cell = getCellDef(cellId);
  if (!cell || cell.xType !== "super" || !cell.pos.endsWith("-far")) return false;
  return getLinesForCell(cellId).some((line) => {
    const hasAnchor = line.cells.some((id) => id !== cellId && state.board[id]);
    return hasAnchor && lineFitsWithTile(line, tile, cellId);
  });
}

function selectRackTile(tileId) {
  if (state.turn !== "red" || state.phase !== "playing") return;
  const tile = state.racks.red.find((item) => item.id === tileId);
  if (!tile) return;
  if (!isTilePlayable(tile)) {
    state.selectedTileId = null;
    setStatus("That tile has no legal move. Choose another tile or press END TURN.");
    render();
    return;
  }
  state.selectedTileId = tile.id;
  setStatus(tile.type === "wild" ? "WILD selected. Tap a red-outlined board space." : `Tile ${tile.rank} selected. Tap a red-outlined board space.`);
  render();
}

function placeSelectedTile(cellId) {
  if (state.turn !== "red" || state.phase !== "playing") return;
  const tile = state.racks.red.find((item) => item.id === state.selectedTileId);
  const result = canPlaceTile(tile, cellId);
  if (!result.ok) {
    setStatus(result.reason);
    return;
  }
  const fromRect = getRackTileRect(tile);
  markRackTileLeaving(tile);
  state.pendingScoreCellId = cellId;
  placeTile("red", tile, cellId);
  state.selectedTileId = null;
  state.chain += 1;
  state.phase = "placing";
  render();
  animateTileToBoard(tile, fromRect, () => {
    resolvePlacedWild("red", cellId, () => resolvePostPlacement("red", cellId));
  });
}

function getRackTileRect(tile) {
  return els.rack.querySelector(`[data-tile="${tile.id}"]`)?.getBoundingClientRect()
    || els.rack.querySelector(`.rack-slot[data-rank="${tile.rank}"]`)?.getBoundingClientRect();
}

function markRackTileLeaving(tile) {
  const rackTile = els.rack.querySelector(`[data-tile="${tile.id}"]`)
    || els.rack.querySelector(`.rack-slot[data-rank="${tile.rank}"]`);
  if (!rackTile) return;
  rackTile.classList.remove("rack-leaving");
  void rackTile.offsetWidth;
  rackTile.classList.add("rack-leaving");
}

function placeTile(color, tile, cellId) {
  state.board[cellId] = tile;
  state.racks[color] = state.racks[color].filter((item) => item.id !== tile.id);
}

function resolvePlacedWild(color, cellId, next) {
  const tile = state.board[cellId];
  if (!tile || tile.type !== "wild") {
    next();
    return;
  }
  const resolved = resolveWildForPlacement(tile, cellId, color);
  const target = document.querySelector(`.cell[data-cell="${cellId}"] .tile`);
  if (!target) {
    state.board[cellId] = resolved;
    render();
    next();
    return;
  }
  target.classList.add("wild-transforming");
  window.setTimeout(() => {
    state.board[cellId] = resolved;
    render();
    document.querySelector(`.cell[data-cell="${cellId}"] .tile`)?.classList.add("wild-resolved");
    window.setTimeout(next, 240);
  }, 180);
}

function animateTileToBoard(tile, fromRect, onLand) {
  animateBoardTileFromRect(tile.id, fromRect, {
    className: "rack-place-flyer",
    duration: 430,
    arcX: 0,
    arcY: -18,
    onLand
  });
}

function animateCpuTileToBoard(tileId, onLand) {
  const fromRect = getBlueScoreAnchorRect();
  animateBoardTileFromRect(tileId, fromRect, {
    className: "cpu-flyer",
    duration: 420,
    arcX: -18,
    arcY: 12,
    sourceSize: Math.min(46, fromRect?.height || 46),
    startOpacity: 0,
    landedClass: "cpu-landed",
    onLand
  });
}

function animateBoardTileFromRect(tileId, fromRect, options) {
  const target = document.querySelector(`.cell [data-tile="${tileId}"]`);
  const finishWithoutAnimation = () => options.onLand?.();
  if (!fromRect || !target) {
    finishWithoutAnimation();
    return;
  }
  const toRect = target.getBoundingClientRect();
  const targetStyle = window.getComputedStyle(target);
  const flyer = target.cloneNode(true);
  flyer.classList.add("tile-flyer", options.className);
  flyer.style.left = `${toRect.left}px`;
  flyer.style.top = `${toRect.top}px`;
  flyer.style.width = `${toRect.width}px`;
  flyer.style.height = `${toRect.height}px`;
  flyer.style.fontSize = targetStyle.fontSize;
  flyer.style.padding = targetStyle.padding;
  document.body.append(flyer);
  target.style.visibility = "hidden";

  const fromCenterX = fromRect.left + fromRect.width / 2;
  const fromCenterY = fromRect.top + fromRect.height / 2;
  const toCenterX = toRect.left + toRect.width / 2;
  const toCenterY = toRect.top + toRect.height / 2;
  const deltaX = fromCenterX - toCenterX;
  const deltaY = fromCenterY - toCenterY;
  const sourceSize = options.sourceSize || Math.min(fromRect.width, fromRect.height);
  const startScale = sourceSize / Math.max(1, toRect.width);
  const duration = motionDuration(options.duration);
  const animation = flyer.animate(
    [
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(${startScale})`, opacity: options.startOpacity ?? 1 },
      {
        transform: `translate(${deltaX * 0.72 + options.arcX}px, ${deltaY * 0.72 + options.arcY}px) scale(${startScale * 1.06})`,
        opacity: 1,
        offset: 0.22
      },
      { transform: "translate(0, 0) scale(1)", opacity: 1 }
    ],
    { duration, easing: "cubic-bezier(.18,.82,.2,1)" }
  );

  let finished = false;
  let finishTimer = null;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (finishTimer) window.clearTimeout(finishTimer);
    flyer.remove();
    if (target.isConnected) {
      target.style.visibility = "";
      const cell = target.closest(".cell");
      if (cell && options.landedClass) {
        cell.classList.add(options.landedClass);
        window.setTimeout(() => cell.classList.remove(options.landedClass), 360);
      }
    }
    options.onLand?.();
  };
  animation.onfinish = finish;
  animation.oncancel = finish;
  animation.finished.then(finish, finish);
  finishTimer = window.setTimeout(finish, duration + 80);
}

function resolvePostPlacement(color, cellId) {
  const celebration = getCompletedXCelebration(color, cellId);
  const lineCelebrations = celebration ? [] : getCompletedLineCelebrations(color, cellId);
  state.pendingScoreCellId = null;
  if (celebration || lineCelebrations.length) {
    state.phase = "celebrating";
    state.celebratingX = celebration;
    state.celebratingLines = lineCelebrations;
    const points = celebration?.points || lineCelebrations.reduce((total, line) => total + line.points, 0);
    const label = celebration?.label || lineCelebrations.map((line) => `${line.name} Line`).join(" + ");
    state.lastEvent = `${TEAM_LABEL[color]} completed a ${label} for ${points}.`;
    setStatus(state.lastEvent);
    render();
    window.setTimeout(() => {
      state.celebratingX = null;
      state.celebratingLines = [];
      render();
      state.phase = color === "red" ? "placing" : "cpu";
      resolveFreshDraw(color);
      if (color === "blue" && state.turn === "blue" && state.phase === "cpu") {
        state.cpuTimer = window.setTimeout(cpuStep, 380);
      }
    }, 900);
    return;
  }
  resolveFreshDraw(color);
}

function getCompletedLineCelebrations(color, cellId) {
  return getLinesForCell(cellId)
    .filter((line) => lineQualifiesForTeam(line, color))
    .map((line) => ({
      id: line.id,
      color,
      points: line.points,
      name: line.name,
      cells: [...line.cells],
      anchorCellId: line.cells[Math.floor(line.cells.length / 2)]
    }));
}

function getCompletedXCelebration(color, cellId) {
  const x = getXDef(getCellDef(cellId).xId);
  if (!x || !xQualifiesForTeam(x, color)) return null;
  return {
    xId: x.id,
    color,
    points: getXPoints(x),
    label: x.type === "super" ? "Big X" : "Small X"
  };
}

function startHumanTurn() {
  if (state.turn !== "red" || state.phase !== "needDraw") return;
  const fromRect = getTileBagRect();
  state.phase = "playing";
  state.chain = 0;
  state.rescueDraws.red = 0;
  state.bombChance = BASE_BOMB_CHANCE;
  const tile = drawSmartRackTile("red");
  state.racks.red.push(tile);
  state.lastEvent = `You drew ${describeTile(tile)}.`;
  setStatus("Choose a playable rack tile, then tap a red-outlined board space. Or press END TURN.");
  render();
  animateDrawToRack(tile, fromRect);
  window.setTimeout(() => {
    if (state.turn === "red" && state.phase === "playing") checkHumanPlayableTiles();
  }, 460);
}

function endHumanTurn() {
  if (state.turn !== "red" || state.phase !== "playing") return;
  passTurnTo("blue", "You ended your turn.");
}

function passTurnTo(nextTeam, eventText) {
  state.pendingScoreCellId = null;
  state.selectedTileId = null;
  state.cpuThinkingCells = [];
  state.chain = 0;
  state.rescueDraws[nextTeam] = 0;
  state.turn = nextTeam;
  state.phase = nextTeam === "red" ? "needDraw" : "cpu";
  state.bombChance = BASE_BOMB_CHANCE;
  state.lastEvent = eventText;
  if (checkRoundEnd()) return;
  render();
  if (nextTeam === "blue") state.cpuTimer = window.setTimeout(runCpuTurn, 420);
}

function resolveFreshDraw(color) {
  if (checkRoundEnd()) return;
  const event = pickFreshEvent();
  if (event === "number") {
    const tile = drawSmartRackTile(color);
    const fromRect = color === "red" ? getTileBagRect() : null;
    state.racks[color].push(tile);
    const nextRisk = nextBombChance();
    state.lastEvent = `${TEAM_LABEL[color]} drew ${describeTile(tile)}.`;
    setStatus(color === "red" ? "Fresh tile added." : state.lastEvent);
    state.bombChance = nextRisk;
    state.phase = color === "red" ? "drawing" : "cpu";
    render();
    if (color === "red") {
      animateDrawToRack(tile, fromRect);
      window.setTimeout(() => {
        if (state.turn === "red" && state.phase === "drawing") {
          state.phase = "playing";
          setStatus("Choose another playable tile, or press END TURN.");
          render();
          checkHumanPlayableTiles();
        }
      }, 430);
    }
    return;
  }
  const bombColor = event === "redBomb" ? "red" : "blue";
  triggerBomb(color, bombColor);
}

function hasPlayableTile(color) {
  return state.racks[color].some(isTilePlayable);
}

function isTilePlayable(tile) {
  return Object.keys(state.board)
    .some((cellId) => !state.board[cellId] && canPlaceTile(tile, cellId).ok);
}

function checkHumanPlayableTiles() {
  if (state.turn !== "red" || state.phase !== "playing") return false;
  if (hasPlayableTile("red")) return true;
  if (tryRescueDraw("red")) return false;
  state.selectedTileId = null;
  setStatus("No legal move remains. Your turn will pass to Blue CPU.");
  render();
  showMessage({
    eyebrow: "No playable tiles",
    title: "Turn passes to Blue",
    body: "None of your rack tiles fit a legal board space, so your turn is over.",
    actionText: "Continue",
    onAction: () => passTurnTo("blue", "No playable red tiles. Blue CPU takes the turn.")
  });
  return false;
}

function tryRescueDraw(color) {
  if (state.rescueDraws[color] >= RESCUE_DRAW_LIMIT || checkRoundEnd()) return false;
  state.rescueDraws[color] += 1;
  state.selectedTileId = null;
  const bombColor = pickRescueBombColor(color);
  if (bombColor) {
    state.lastEvent = `${TEAM_LABEL[color]} had no legal move and pulled a rescue bomb.`;
    setStatus(`${TEAM_LABEL[color]} has no legal move. A random ${TEAM_LABEL[bombColor]} Bomb was drawn.`);
    triggerBomb(color, bombColor);
    return true;
  }
  const tile = drawPlayableRackTile(color) || drawSmartRackTile(color);
  const fromRect = color === "red" ? getTileBagRect() : null;
  state.racks[color].push(tile);
  state.lastEvent = `${TEAM_LABEL[color]} had no legal move and pulled ${describeTile(tile)}.`;
  setStatus(`${TEAM_LABEL[color]} has no legal move. Drawing one more tile.`);
  state.phase = color === "red" ? "drawing" : "cpu";
  render();
  if (color === "red") {
    animateDrawToRack(tile, fromRect);
    window.setTimeout(() => {
      if (state.turn === "red" && state.phase === "drawing") {
        state.phase = "playing";
        setStatus("A playable tile was added. Choose it, or press END TURN.");
        render();
        checkHumanPlayableTiles();
      }
    }, 430);
  } else {
    state.cpuTimer = window.setTimeout(cpuStep, 420);
  }
  return true;
}

function pickRescueBombColor(color) {
  const margin = getScoreMargin(color);
  const bombChance = margin < -30 ? RESCUE_BOMB_CHANCE + 18 : margin > 45 ? RESCUE_BOMB_CHANCE - 12 : RESCUE_BOMB_CHANCE;
  if (Math.random() * 100 >= bombChance) return null;
  const opponent = otherTeam(color);
  const opponentBombChance = margin < -30 ? 0.72 : margin > 45 ? 0.34 : 0.54;
  return Math.random() < opponentBombChance ? opponent : color;
}

function getScoreMargin(color) {
  const liveScore = scoreRound();
  const redTotal = state.scores.red + liveScore.red.total;
  const blueTotal = state.scores.blue + liveScore.blue.total;
  return color === "red" ? redTotal - blueTotal : blueTotal - redTotal;
}

function pickFreshEvent() {
  const roll = Math.random() * 100;
  if (roll >= state.bombChance) return "number";
  return Math.random() < 0.5 ? "redBomb" : "blueBomb";
}

function nextBombChance() {
  return Math.min(MAX_BOMB_CHANCE, state.bombChance + BOMB_CHANCE_STEP);
}

function pickBombTargets(color) {
  const candidates = Object.entries(state.board)
    .filter(([cellId, tile]) => tile?.color === color && !getCellDef(cellId).center);
  const count = Math.min(candidates.length, Math.random() < 0.5 ? 1 : 2);
  return shuffle(candidates).slice(0, count).map(([cellId]) => cellId);
}

function triggerBomb(drawColor, bombColor) {
  const targets = pickBombTargets(bombColor);
  const removed = targets.length;
  const fromRect = getTileBagRect();
  state.phase = "bombing";
  state.selectedTileId = null;
  state.bombChance = BASE_BOMB_CHANCE;
  state.bomb = {
    color: bombColor,
    cells: [],
    message: removed ? `${TEAM_LABEL[bombColor]} Bomb! Removing ${removed} ${bombColor} tile${removed === 1 ? "" : "s"}.` : `${TEAM_LABEL[bombColor]} Bomb found no removable ${bombColor} tiles.`
  };
  state.lastEvent = `${TEAM_LABEL[drawColor]} drew ${TEAM_LABEL[bombColor]} Bomb.`;
  setStatus(state.bomb.message);
  render();
  animateBombIconToTargets(bombColor, fromRect, targets, () => {
    targets.forEach((cellId) => {
      state.board[cellId] = null;
    });
    state.bomb = null;
    passTurnTo(otherTeam(drawColor), `${TEAM_LABEL[drawColor]} drew ${TEAM_LABEL[bombColor]} Bomb. ${removed} ${bombColor} tile${removed === 1 ? "" : "s"} removed.`);
  });
}

function createBombBurst(cellId, color) {
  const cell = document.querySelector(`[data-cell="${cellId}"]`);
  if (!cell) return;
  const rect = cell.getBoundingClientRect();
  const burst = document.createElement("div");
  burst.className = `bomb-burst ${color}`;
  burst.style.left = `${rect.left + rect.width / 2}px`;
  burst.style.top = `${rect.top + rect.height / 2}px`;
  for (let i = 0; i < 10; i += 1) {
    const spark = document.createElement("i");
    const angle = (Math.PI * 2 * i) / 10;
    const distance = 24 + Math.random() * 22;
    spark.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    spark.style.setProperty("--r", `${Math.random() * 180 - 90}deg`);
    burst.append(spark);
  }
  document.body.append(burst);
  window.setTimeout(() => burst.remove(), 820);
}

function getBombMissCell() {
  const emptyCells = Object.keys(state.board).filter((cellId) => !state.board[cellId]);
  return shuffle(emptyCells).find((cellId) => document.querySelector(`[data-cell="${cellId}"]`)) || null;
}

function showBombMiss(cellId, color) {
  const cell = document.querySelector(`[data-cell="${cellId}"]`);
  if (!cell) return;
  cell.classList.add("bomb-miss", color);
  window.setTimeout(() => cell.classList.remove("bomb-miss", color), 760);
}

function createBombIcon(color) {
  const icon = document.createElement("div");
  icon.className = `bomb-icon ${color}`;
  icon.innerHTML = "<span></span>";
  return icon;
}

function animateBombIconToTargets(color, fromRect, targets, onDone) {
  const fallbackRect = document.querySelector(".rack-turn-card")?.getBoundingClientRect();
  const startRect = fromRect || fallbackRect;
  if (!startRect) {
    onDone();
    return;
  }
  const size = 40;
  const bagMouth = els.tileBag?.querySelector(".bag-mouth")?.getBoundingClientRect();
  const startX = (bagMouth || startRect).left + (bagMouth || startRect).width / 2;
  const startY = bagMouth ? bagMouth.top + bagMouth.height / 2 : startRect.top + startRect.height * 0.24;
  if (!targets.length) {
    const missCellId = getBombMissCell();
    const missCell = missCellId ? document.querySelector(`[data-cell="${missCellId}"]`) : null;
    const icon = createPositionedBombIcon(color, startX, startY, size);
    const targetRect = missCell?.getBoundingClientRect() || fallbackRect || startRect;
    flyBombIcon(icon, startX, startY, targetRect.left + targetRect.width / 2, targetRect.top + targetRect.height / 2, true, () => {
      if (missCellId) showBombMiss(missCellId, color);
      icon.classList.add("bomb-icon-fade");
      window.setTimeout(() => {
        icon.remove();
        onDone();
      }, 360);
    });
    return;
  }
  const hitTargets = new Set();
  let completed = 0;
  const completeOne = () => {
    completed += 1;
    if (completed >= targets.length) {
      window.setTimeout(onDone, 900);
    }
  };
  targets.forEach((cellId, index) => {
    const cell = document.querySelector(`[data-cell="${cellId}"]`);
    if (!cell) {
      completeOne();
      return;
    }
    const icon = createPositionedBombIcon(color, startX, startY, size);
    const rect = cell.getBoundingClientRect();
    const nextX = rect.left + rect.width / 2;
    const nextY = rect.top + rect.height / 2;
    const launchDelay = index * 120;
    window.setTimeout(() => {
      popTileBag();
      flyBombIcon(icon, startX, startY, nextX, nextY, true, () => {
        icon.style.left = `${nextX - size / 2}px`;
        icon.style.top = `${nextY - size / 2}px`;
        icon.style.transform = "";
        hitTargets.add(cellId);
        state.bomb.cells = [...hitTargets];
        render();
        createBombBurst(cellId, color);
        icon.classList.add("bomb-icon-fade");
        window.setTimeout(() => {
          icon.remove();
          completeOne();
        }, 340);
      });
    }, launchDelay);
  });
}

function createPositionedBombIcon(color, x, y, size) {
  const icon = createBombIcon(color);
  icon.style.left = `${x - size / 2}px`;
  icon.style.top = `${y - size / 2}px`;
  icon.style.width = `${size}px`;
  icon.style.height = `${size}px`;
  document.body.append(icon);
  return icon;
}

function popTileBag() {
  els.tileBag?.classList.remove("bag-pop");
  if (els.tileBag) {
    void els.tileBag.offsetWidth;
    els.tileBag.classList.add("bag-pop");
  }
}

function flyBombIcon(icon, fromX, fromY, toX, toY, appear, onFinish) {
  const duration = motionDuration(760);
  const animation = icon.animate(
    [
      { transform: "translate(0, 0) scale(0.78) rotate(-8deg)", opacity: appear ? 0 : 1 },
      { transform: "translate(0, -18px) scale(1.05) rotate(5deg)", opacity: 1, offset: 0.28 },
      { transform: `translate(${toX - fromX}px, ${toY - fromY}px) scale(1) rotate(0deg)`, opacity: 1 }
    ],
    { duration, easing: "cubic-bezier(.14,.74,.16,1)" }
  );
  runAfterAnimation(animation, duration, onFinish);
}

function getTileBagRect() {
  popTileBag();
  return els.tileBag?.getBoundingClientRect();
}

function getBlueScoreAnchorRect() {
  return els.blueTotalScore?.closest(".score-team-card")?.getBoundingClientRect()
    || els.board?.getBoundingClientRect();
}

function animateOpeningDeal(boardDeals, rackDeals, onComplete) {
  const fromRect = getTileBagRect();
  if (!fromRect) {
    boardDeals.forEach((deal) => {
      state.board[deal.cellId] = deal.tile;
    });
    render();
    onComplete();
    return;
  }
  const deals = [
    ...boardDeals.map((deal) => ({
      tile: deal.tile,
      getTarget: () => document.querySelector(`.cell[data-cell="${deal.cellId}"]`),
      className: "board-deal-land",
      onLand: () => {
        state.board[deal.cellId] = deal.tile;
        render();
        return document.querySelector(`.cell[data-cell="${deal.cellId}"]`);
      }
    })),
    ...rackDeals.map((tile) => ({
      tile,
      getTarget: () => document.querySelector(`.rack-slot[data-rank="${tile.rank}"]`),
      className: "rack-landed"
    }))
  ];
  if (!deals.length) {
    onComplete();
    return;
  }
  let completed = 0;
  const completeDeal = () => {
    completed += 1;
    if (completed === deals.length) onComplete();
  };
  deals.forEach((deal, index) => {
    window.setTimeout(() => {
      const target = deal.getTarget();
      if (!target) {
        deal.onLand?.();
        completeDeal();
        return;
      }
      popTileBag();
      animateTileFromBag(deal.tile, target, deal.className, () => {
        const landedTarget = deal.onLand?.() || target;
        completeDeal();
        return landedTarget;
      });
    }, motionDuration(index * 85));
  });
}

function animateTileFromBag(tile, target, landedClass, onLand = null) {
  const fromRect = els.tileBag?.getBoundingClientRect();
  const toRect = target?.getBoundingClientRect();
  if (!fromRect || !toRect) {
    onLand?.();
    return;
  }
  const flyer = renderTile(tile, false);
  flyer.classList.add("tile-flyer", "deal-flyer");
  const startSize = Math.min(40, fromRect.height || 40);
  flyer.style.left = `${fromRect.left + fromRect.width / 2 - startSize / 2}px`;
  flyer.style.top = `${fromRect.top + fromRect.height * 0.2}px`;
  flyer.style.width = `${startSize}px`;
  flyer.style.height = `${startSize}px`;
  document.body.append(flyer);
  const deltaX = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
  const deltaY = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height * 0.2 + startSize / 2);
  const duration = motionDuration(520);
  const animation = flyer.animate(
    [
      { transform: "translate(0, 0) scale(0.5) rotate(-10deg)", opacity: 0 },
      { transform: "translate(0, -20px) scale(0.92) rotate(4deg)", opacity: 1, offset: 0.24 },
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(${toRect.width / startSize}) rotate(0deg)`, opacity: 1 }
    ],
    { duration, easing: "cubic-bezier(.18,.82,.2,1)" }
  );
  runAfterAnimation(animation, duration, () => {
    flyer.remove();
    const landedTarget = onLand?.() || target;
    if (!landedTarget) return;
    landedTarget.classList.add(landedClass);
    window.setTimeout(() => landedTarget.classList.remove(landedClass), motionDuration(430));
  });
}

function animateDrawToRack(tile, fromRect) {
  if (!fromRect) return;
  const target = document.querySelector(`.rack-slot[data-rank="${tile.rank}"]`);
  if (!target) return;
  const toRect = target.getBoundingClientRect();
  const flyer = renderTile(tile, false);
  flyer.classList.add("tile-flyer", "draw-flyer");
  const startSize = Math.min(46, fromRect.height || 46);
  flyer.style.left = `${fromRect.left + fromRect.width / 2 - startSize / 2}px`;
  flyer.style.top = `${fromRect.top + fromRect.height / 2 - startSize / 2}px`;
  flyer.style.width = `${startSize}px`;
  flyer.style.height = `${startSize}px`;
  document.body.append(flyer);
  target.classList.add("rack-landing");
  const duration = motionDuration(430);
  const animation = flyer.animate(
    [
      { transform: "translate(0, 0) scale(0.72)", opacity: 0 },
      { transform: "translate(0, -18px) scale(1)", opacity: 1, offset: 0.2 },
      {
        transform: `translate(${toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2)}px, ${toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2)}px) scale(${toRect.width / startSize})`,
        opacity: 1
      }
    ],
    { duration, easing: "cubic-bezier(.18,.82,.2,1)" }
  );
  runAfterAnimation(animation, duration, () => {
    flyer.remove();
    target.classList.remove("rack-landing");
    target.classList.add("rack-landed");
    window.setTimeout(() => target.classList.remove("rack-landed"), motionDuration(360));
  });
}

function otherTeam(color) {
  return color === "red" ? "blue" : "red";
}

function runCpuTurn() {
  if (state.phase !== "cpu" || state.turn !== "blue") return;
  state.chain = 0;
  state.rescueDraws.blue = 0;
  const tile = drawSmartRackTile("blue");
  state.racks.blue.push(tile);
  state.lastEvent = `Blue CPU drew ${describeTile(tile)}.`;
  render();
  state.cpuTimer = window.setTimeout(cpuStep, 320);
}

function cpuStep() {
  if (state.phase !== "cpu" || state.turn !== "blue") return;
  const best = findBestPlacement("blue");
  if (!best && tryRescueDraw("blue")) return;
  if (!best || (state.chain > 0 && Math.random() < getCpuPassChance())) {
    passTurnTo("red", "Blue CPU ended its turn.");
    return;
  }
  state.cpuThinkingCells = getCpuThinkingCells(best.cellId);
  setStatus("Blue CPU is choosing a spot.");
  render();
  state.cpuTimer = window.setTimeout(() => {
    commitCpuPlacement(best);
  }, 260);
}

function getCpuPassChance() {
  const liveScore = scoreRound();
  const redTotal = state.scores.red + liveScore.red.total;
  const blueTotal = state.scores.blue + liveScore.blue.total;
  const margin = blueTotal - redTotal;
  if (margin < -35) return CPU_PASS_CHANCE.behind;
  if (margin > 55) return CPU_PASS_CHANCE.ahead;
  return CPU_PASS_CHANCE.close;
}

function commitCpuPlacement(best) {
  if (state.phase !== "cpu" || state.turn !== "blue") return;
  state.cpuThinkingCells = [];
  state.pendingScoreCellId = best.cellId;
  placeTile("blue", best.tile, best.cellId);
  state.chain += 1;
  state.lastEvent = `Blue CPU placed ${best.tile.rank}.`;
  render();
  animateCpuTileToBoard(best.tile.id, () => {
    resolvePlacedWild("blue", best.cellId, () => {
      resolvePostPlacement("blue", best.cellId);
      if (state.turn === "blue" && state.phase === "cpu") {
        state.cpuTimer = window.setTimeout(cpuStep, 380);
      }
    });
  });
}

function getCpuThinkingCells(bestCellId) {
  const options = [bestCellId];
  const openCells = shuffle(Object.keys(state.board).filter((cellId) => !state.board[cellId] && cellId !== bestCellId));
  openCells.some((cellId) => {
    if (options.length >= 3) return true;
    if (state.racks.blue.some((tile) => canPlaceTile(tile, cellId).ok)) options.push(cellId);
    return false;
  });
  return options;
}

function findBestPlacement(team) {
  let best = null;
  const openCells = Object.keys(state.board).filter((cellId) => !state.board[cellId]);
  state.racks[team].forEach((tile) => {
    openCells.forEach((cellId) => {
      const value = evaluatePlacement(team, tile, cellId);
      if (value > (best?.value ?? -1) || (value === best?.value && Math.random() < 0.35)) best = { tile, cellId, value };
    });
  });
  return best?.value >= 0 ? best : null;
}

function evaluatePlacement(team, tile, cellId) {
  const result = canPlaceTile(tile, cellId);
  if (!result.ok) return -1;
  const opponent = otherTeam(team);
  const beforeScore = scoreRound();
  const threatBefore = getBoardThreatScore(opponent);
  const directBlockValue = getPlacementBlockValue(opponent, cellId);
  const placedTile = resolveWildForPlacement(tile, cellId, team);
  state.board[cellId] = placedTile;
  const afterScore = scoreRound();
  const threatAfter = getBoardThreatScore(opponent);
  let value = 0;
  const ownDelta = afterScore[team].total - beforeScore[team].total;
  const opponentThreatBlocked = Math.max(0, threatBefore - threatAfter);
  value += ownDelta * 18;
  value += afterScore[team].total * 1.4;
  value += opponentThreatBlocked * 10;
  const cell = getCellDef(cellId);
  value += cell.center ? 3 : 1;
  if (placedTile.type === "wild") value -= 3;
  value += getPlacementShapeValue(team, cellId);
  value += directBlockValue * 2;
  getLinesForCell(cellId).forEach((line) => {
    const tiles = getLineTiles(line);
    if (tiles.every((item) => item.color === team) && lineCanSupportPattern(line)) value += tiles.length * 5;
  });
  state.board[cellId] = null;
  return value;
}

function getBoardThreatScore(team) {
  let score = 0;
  LINE_DEFS.forEach((line) => {
    score += getLineThreatValue(line, team);
  });
  X_DEFS.forEach((x) => {
    score += getXThreatValue(x, team);
  });
  return score;
}

function getLineThreatValue(line, team) {
  const tiles = line.cells.map((id) => state.board[id]);
  if (tiles.some((tile) => tile && tile.color !== team)) return 0;
  const filled = tiles.filter(Boolean).length;
  const open = tiles.length - filled;
  if (!filled || !open) return 0;
  if (!lineCanSupportPattern(line)) return 0;
  if (open === 1) return line.points;
  if (open === 2 && filled >= 2) return Math.round(line.points * 0.35);
  return filled >= 2 ? 4 : 0;
}

function getXThreatValue(x, team) {
  const tiles = x.cells.map((cell) => state.board[cell.id]);
  if (tiles.some((tile) => tile && tile.color !== team)) return 0;
  const filled = tiles.filter(Boolean).length;
  const open = tiles.length - filled;
  if (!filled || !open) return 0;
  const points = getXPoints(x);
  if (open === 1) return points;
  if (open === 2 && filled >= x.cells.length - 2) return Math.round(points * 0.45);
  return filled >= 3 ? 8 : 0;
}

function getPlacementShapeValue(team, cellId) {
  const cell = getCellDef(cellId);
  const x = getXDef(cell?.xId);
  if (!x) return 0;
  const ownInX = x.cells.filter((item) => state.board[item.id]?.color === team).length;
  const opponentInX = x.cells.filter((item) => state.board[item.id] && state.board[item.id].color !== team).length;
  if (opponentInX) return ownInX;
  return ownInX * (x.type === "super" ? 3 : 4);
}

function getPlacementBlockValue(opponent, cellId) {
  const lines = getLinesForCell(cellId);
  return lines.reduce((total, line) => total + getLineThreatValue(line, opponent), 0);
}

function checkRoundEnd() {
  if (state.roundFinalized) return true;
  if (!Object.values(state.board).every(Boolean)) return false;
  state.roundFinalized = true;
  window.clearTimeout(state.cpuTimer);
  const boardScore = scoreRound();
  const roundScore = boardScore;
  const endedRound = state.round;
  state.roundScores[endedRound] = { red: roundScore.red.total, blue: roundScore.blue.total };
  state.scores.red += boardScore.red.total;
  state.scores.blue += boardScore.blue.total;
  if (state.round >= TOTAL_ROUNDS) {
    finishGame(endedRound);
    return true;
  }
  state.phase = "roundOver";
  state.selectedTileId = null;
  state.lastEvent = winnerText(roundScore.red.total, roundScore.blue.total, `Round ${endedRound}`);
  setStatus(state.lastEvent);
  render();
  showMessage({
    eyebrow: `Round ${endedRound} complete`,
    title: state.lastEvent,
    scoreCard: buildScoreCard(`Round ${endedRound} is complete.`),
    actionText: `Start Round ${endedRound + 1}`,
    onAction: () => {
      state.round += 1;
      setupRound();
    }
  });
  return true;
}

function finishGame(endedRound) {
  state.phase = "gameOver";
  state.selectedTileId = null;
  state.lastEvent = winnerText(state.scores.red, state.scores.blue, "Game");
  setStatus(state.lastEvent);
  render();
  showMessage({
    eyebrow: `Game complete after Round ${endedRound}`,
    title: state.lastEvent,
    scoreCard: buildScoreCard(`Final margin: ${Math.abs(state.scores.red - state.scores.blue)}.`),
    actionText: "Done"
  });
}

function scoreRound() {
  return { red: scoreTeam("red"), blue: scoreTeam("blue") };
}

function scoreTeam(team) {
  let total = 0;
  const completedXs = new Set();
  X_DEFS.forEach((x) => {
    if (xQualifiesForTeam(x, team)) {
      total += getXPoints(x);
      completedXs.add(x.id);
    }
  });
  LINE_DEFS.forEach((line) => {
    if (completedXs.has(line.xId)) return;
    if (lineQualifiesForTeam(line, team)) total += line.points;
  });
  return { total };
}

function render() {
  renderBoard();
  renderRack();
  renderHud();
  renderRiskMeter();
}

function renderRiskMeter() {
  if (!els.riskPips) return;
  els.riskPips.innerHTML = "";
  const active = Math.max(1, Math.ceil(((state.bombChance - BASE_BOMB_CHANCE) / (MAX_BOMB_CHANCE - BASE_BOMB_CHANCE || 1)) * 5));
  for (let index = 1; index <= 5; index += 1) {
    const pip = document.createElement("span");
    pip.className = index <= active ? "active" : "";
    els.riskPips.append(pip);
  }
}

function renderBoard() {
  els.board.innerHTML = "";
  const selected = state.turn === "red" && state.phase === "playing"
    ? state.racks.red.find((item) => item.id === state.selectedTileId)
    : null;
  const positionLabels = {
    c: "center",
    nw: "top left",
    ne: "top right",
    sw: "bottom left",
    se: "bottom right",
    "nw-far": "top-left outer",
    "ne-far": "top-right outer",
    "sw-far": "bottom-left outer",
    "se-far": "bottom-right outer"
  };
  X_DEFS.forEach((x) => {
    x.cells.forEach((cell) => {
      const origin = BOARD_ORIGINS[x.id];
      const col = origin.col + cell.col;
      const row = origin.row + cell.row;
      const cellEl = document.createElement("button");
      cellEl.className = "cell";
      cellEl.style.gridColumn = String(col);
      cellEl.style.gridRow = String(row);
      cellEl.dataset.cell = cell.id;
      cellEl.dataset.x = x.id;
      cellEl.dataset.pos = cell.pos;
      if (cell.center) cellEl.classList.add("center-cell");
      const tile = state.board[cell.id];
      const isSelectable = Boolean(!tile && selected && canPlaceTile(selected, cell.id).ok);
      const location = `${x.name}, ${positionLabels[cell.pos] || cell.pos}`;
      const tileLabel = tile ? `${TEAM_LABEL[tile.color]} ${tile.rank}` : "Empty";
      cellEl.setAttribute("aria-label", isSelectable ? `Playable space, ${location}` : `${tileLabel}, ${location}`);
      cellEl.setAttribute("aria-disabled", String(!isSelectable));
      cellEl.tabIndex = isSelectable ? 0 : -1;
      const isCelebratingCell = state.celebratingX?.xId === x.id;
      const celebratingLines = state.celebratingLines.filter((line) => line.cells.includes(cell.id));

      if (isCelebratingCell) {
        cellEl.classList.add("x-complete", state.celebratingX.color);
      }
      if (celebratingLines.length) {
        cellEl.classList.add("line-complete", celebratingLines[0].color);
      }
      if (state.cpuThinkingCells.includes(cell.id)) {
        cellEl.classList.add("cpu-thinking");
      }
      if (isSelectable) cellEl.classList.add("selectable");
      if (tile) {
        cellEl.classList.add(tile.seeded ? "seeded" : "filled");
        cellEl.classList.toggle("bomb-target", Boolean(state.bomb?.cells.includes(cell.id)));
        cellEl.append(renderTile(tile, false));
      }
      if (isCelebratingCell && cell.center) {
        const xScore = state.celebratingX;
        const points = document.createElement("span");
        points.className = `x-points ${xScore.color}`;
        points.textContent = `+${xScore.points}`;
        cellEl.append(points);
      }
      state.celebratingLines
        .filter((line) => line.anchorCellId === cell.id)
        .forEach((line) => {
          cellEl.classList.add("line-score-anchor", line.color);
          const points = document.createElement("span");
          points.className = `x-points line-points ${line.color}`;
          points.textContent = `+${line.points}`;
          cellEl.append(points);
        });
      cellEl.addEventListener("click", () => placeSelectedTile(cell.id));
      els.board.append(cellEl);
    });
  });
}

function renderRack() {
  els.rack.innerHTML = "";
  const groupEl = document.createElement("div");
  groupEl.className = "rack-group";
  const labelEl = document.createElement("span");
  labelEl.className = "rack-label";
  labelEl.textContent = "Red Tile Rack";
  const tilesEl = document.createElement("div");
  tilesEl.className = "rack-tiles lite-rack";
  [...RANKS, "W"].forEach((rank) => {
    const matchingTiles = state.racks.red.filter((tile) => tile.rank === rank);
    const tile = matchingTiles[0] || { id: `empty-score-${rank}`, type: rank === "W" ? "wild" : "score", color: "red", rank };
    const tileEl = renderTile(tile, Boolean(matchingTiles.length));
    tileEl.classList.add("rack-slot");
    tileEl.classList.toggle("empty", !matchingTiles.length);
    tileEl.classList.toggle("stacked", matchingTiles.length > 1);
    tileEl.dataset.count = String(Math.min(matchingTiles.length, 6));
    tileEl.dataset.rank = rank;
    tileEl.classList.toggle("selected", matchingTiles.some((item) => item.id === state.selectedTileId));
    tileEl.setAttribute("aria-label", `Red ${rank}: ${matchingTiles.length}`);
    if (matchingTiles.length) tileEl.addEventListener("click", () => selectRackTile(tile.id));
    tilesEl.append(tileEl);
  });
  groupEl.append(labelEl, tilesEl);
  els.rack.append(groupEl);
}

function renderTile(tile, asButton) {
  const el = document.createElement(asButton ? "button" : "div");
  el.className = `tile ${tile.color} ${tile.type === "wild" ? "wild" : ""}`;
  el.dataset.tile = tile.id;
  const face = tile.type === "wild" ? "WILD" : tile.rank;
  el.innerHTML = `${face}<small>${tile.type === "wild" ? "wild" : tile.color}</small>`;
  return el;
}

function renderHud() {
  const roundScores = getDisplayedRoundScores();
  const redTotal = roundScores[1].red + roundScores[2].red;
  const blueTotal = roundScores[1].blue + roundScores[2].blue;
  setScoreText(els.redRound1Score, roundScores[1].red);
  setScoreText(els.blueRound1Score, roundScores[1].blue);
  setScoreText(els.redRound2Score, roundScores[2].red);
  setScoreText(els.blueRound2Score, roundScores[2].blue);
  updateScoreBox(els.redTotalScore, redTotal);
  updateScoreBox(els.blueTotalScore, blueTotal);
  const showRoundTwo = state.round >= 2 || state.roundScores[2].red !== null || state.roundScores[2].blue !== null;
  els.redRound2Row.hidden = !showRoundTwo;
  els.blueRound2Row.hidden = !showRoundTwo;
  document.querySelector(".score-team-card.red")?.classList.toggle("active-turn", state.turn === "red" && !["gameOver", "roundOver"].includes(state.phase));
  document.querySelector(".score-team-card.blue")?.classList.toggle("active-turn", state.turn === "blue" && !["gameOver", "roundOver"].includes(state.phase));
  els.turnTitle.textContent = getTurnTitle();
  els.drawPlayBtn.textContent = state.phase === "gameOver" ? "NEW GAME" : "DRAW";
  els.drawPlayBtn.disabled = state.phase !== "gameOver" && (state.turn !== "red" || state.phase !== "needDraw");
  els.endTurnBtn.disabled = state.turn !== "red" || state.phase !== "playing";
  els.rulesBtn.disabled = false;
  document.querySelector(".rack-turn-card")?.classList.toggle("player-ready", state.turn === "red" && state.phase === "needDraw");
  if (state.phase === "dealing") setStatus("Dealing tiles...");
  if (state.phase === "needDraw") {
    const typeFirstInstruction = !hasTypedFirstPlayerInstruction;
    setStatus("Press DRAW to start your turn and add one red tile.", { type: typeFirstInstruction });
    if (typeFirstInstruction) hasTypedFirstPlayerInstruction = true;
  }
  if (state.phase === "drawing") setStatus("Drawing your next tile...");
  if (state.phase === "placing") setStatus("Tile placed. Drawing your next tile...");
  if (state.phase === "cpu") setStatus(state.cpuThinkingCells.length ? "Blue CPU is choosing a spot." : "Blue CPU is taking its turn.");
  if (state.phase === "bombing") setStatus(state.bomb?.message || "Bomb is resolving.");

  if (state.celebratingX) setStatus(`${TEAM_LABEL[state.celebratingX.color]} completed a ${state.celebratingX.label} for ${state.celebratingX.points}.`);
  schedulePlayerIdleReminder();
}

function getDisplayedRoundScores() {
  const values = {
    1: {
      red: state.roundScores[1].red ?? 0,
      blue: state.roundScores[1].blue ?? 0
    },
    2: {
      red: state.roundScores[2].red ?? 0,
      blue: state.roundScores[2].blue ?? 0
    }
  };
  if (!["gameOver", "roundOver"].includes(state.phase)) {
    const liveRoundScore = scoreRoundForDisplay();
    values[state.round] = {
      red: liveRoundScore.red.total,
      blue: liveRoundScore.blue.total
    };
  }
  return values;
}

function scoreRoundForDisplay() {
  const cellId = state.pendingScoreCellId;
  const pendingTile = cellId ? state.board[cellId] : null;
  if (!pendingTile) return scoreRound();
  state.board[cellId] = null;
  try {
    return scoreRound();
  } finally {
    state.board[cellId] = pendingTile;
  }
}

function setScoreText(el, value) {
  if (el) el.textContent = value;
}

function updateScoreBox(el, value) {
  if (!el) return;
  const previous = Number(el.textContent) || 0;
  if (previous === value) return;
  el.textContent = value;
  if (value > previous) {
    const card = el.closest(".score-team-card");
    if (!card) return;
    card.classList.remove("score-pop");
    void card.offsetWidth;
    card.classList.add("score-pop");

  }
}


function getTurnTitle() {
  if (state.phase === "dealing") return "Dealing";
  if (state.phase === "gameOver") return "Game over";
  if (state.phase === "roundOver") return "Round over";
  if (state.turn === "blue") return "Blue CPU";
  if (state.phase === "needDraw") return "Your turn";
  if (state.phase === "drawing") return "Drawing";
  if (state.phase === "placing") return "Tile placed";
  return state.selectedTileId ? "Place tile" : "Choose a tile";
}

function setStatus(message, options = {}) {
  if (!els.statusText || (!options.force && els.statusText.dataset.message === message)) return;
  const measure = els.statusText.querySelector(".status-measure");
  const output = els.statusText.querySelector(".status-output");
  if (!measure || !output) return;
  els.statusText.dataset.message = message;
  els.statusText.setAttribute("aria-label", message);
  measure.textContent = message;
  window.clearTimeout(statusTypingTimer);
  statusTypingTimer = null;
  output.classList.remove("typing");

  if (!options.type || window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden) {
    output.textContent = message;
    return;
  }

  let index = 0;
  output.textContent = "";
  output.classList.add("typing");

  const typeNextCharacter = () => {
    if (els.statusText.dataset.message !== message) return;
    output.textContent += message[index];
    index += 1;
    if (index >= message.length) {
      output.classList.remove("typing");
      statusTypingTimer = null;
      return;
    }
    const pause = /[.!?]/.test(message[index - 1]) ? 70 : 14;
    statusTypingTimer = window.setTimeout(typeNextCharacter, pause);
  };

  typeNextCharacter();
}

function getPlayerIdleReminder() {
  if (state.turn !== "red") return "";
  if (state.phase === "needDraw") return "Press DRAW to start your turn.";
  if (state.phase !== "playing") return "";
  if (state.selectedTileId) return "Tap a red-outlined board space to place your selected tile.";
  return "Choose a playable rack tile, or press END TURN.";
}

function getPlayerIdleKey() {
  return `${state.turn}:${state.phase}:${state.selectedTileId || "none"}`;
}

function schedulePlayerIdleReminder({ restart = false } = {}) {
  const message = getPlayerIdleReminder();
  if (!message || document.hidden || els.rulesDialog.open || els.messageDialog.open) {
    window.clearTimeout(playerIdleTimer);
    playerIdleTimer = null;
    playerIdleKey = "";
    return;
  }

  const key = getPlayerIdleKey();
  if (!restart && playerIdleKey === key) return;
  window.clearTimeout(playerIdleTimer);
  playerIdleKey = key;
  playerIdleTimer = window.setTimeout(() => {
    playerIdleTimer = null;
    if (getPlayerIdleKey() !== key || document.hidden || els.rulesDialog.open || els.messageDialog.open) return;
    setStatus(getPlayerIdleReminder(), { type: true, force: true });
  }, PLAYER_IDLE_REMINDER_MS);
}

function notePlayerActivity() {
  schedulePlayerIdleReminder({ restart: true });
}

els.drawPlayBtn.addEventListener("click", () => {
  if (state.phase === "gameOver") {
    hasTypedFirstPlayerInstruction = false;
    state.round = 1;
    state.scores = { red: 0, blue: 0 };
    state.roundScores = {
      1: { red: null, blue: null },
      2: { red: null, blue: null }
    };
    setupRound();
  } else {
    startHumanTurn();
  }
});
els.endTurnBtn.addEventListener("click", endHumanTurn);
els.rulesBtn.addEventListener("click", () => {
  if (!els.rulesDialog.open) els.rulesDialog.showModal();
});
els.closeRulesBtn.addEventListener("click", () => els.rulesDialog.close());
els.rulesDialog.addEventListener("close", () => schedulePlayerIdleReminder({ restart: true }));
els.messageActionBtn.addEventListener("click", () => els.messageDialog.close());
els.messageDialog.addEventListener("close", () => {
  const action = pendingMessageAction;
  pendingMessageAction = null;
  if (action) action();
});
document.addEventListener("pointerdown", notePlayerActivity, { passive: true });
document.addEventListener("keydown", notePlayerActivity);
document.addEventListener("visibilitychange", () => schedulePlayerIdleReminder({ restart: true }));

setupRound();
