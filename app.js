const RANKS = ["1", "2", "3", "4", "5"];
const TOTAL_ROUNDS = 2;
const BASE_BOMB_CHANCE = 8;
const BOMB_CHANCE_STEP = 4;
const MAX_BOMB_CHANCE = 28;
const TEAM_LABEL = { red: "Red", blue: "Blue CPU" };

const X_DEFS = [
  {
    id: "north-west",
    name: "Small Cross",
    type: "small",
    cells: [
      { id: "nw-0", row: 1, col: 2, pos: "top" },
      { id: "nw-1", row: 2, col: 1, pos: "left" },
      { id: "nw-2", row: 2, col: 2, pos: "c", center: true },
      { id: "nw-3", row: 2, col: 3, pos: "right" },
      { id: "nw-4", row: 3, col: 2, pos: "bottom" }
    ]
  },
  {
    id: "north-east",
    name: "Small Cross",
    type: "small",
    cells: [
      { id: "ne-0", row: 1, col: 2, pos: "top" },
      { id: "ne-1", row: 2, col: 1, pos: "left" },
      { id: "ne-2", row: 2, col: 2, pos: "c", center: true },
      { id: "ne-3", row: 2, col: 3, pos: "right" },
      { id: "ne-4", row: 3, col: 2, pos: "bottom" }
    ]
  },
  {
    id: "super",
    name: "Big Cross",
    type: "super",
    cells: [
      { id: "su-0", row: 1, col: 3, pos: "top" },
      { id: "su-1", row: 2, col: 3, pos: "inner-top" },
      { id: "su-2", row: 3, col: 1, pos: "left" },
      { id: "su-3", row: 3, col: 2, pos: "inner-left" },
      { id: "su-4", row: 3, col: 3, pos: "c", center: true },
      { id: "su-5", row: 3, col: 4, pos: "inner-right" },
      { id: "su-6", row: 3, col: 5, pos: "right" },
      { id: "su-7", row: 4, col: 3, pos: "inner-bottom" },
      { id: "su-8", row: 5, col: 3, pos: "bottom" }
    ]
  }
];

const LINE_DEFS = X_DEFS.flatMap((x) => {
  if (x.type === "super") {
    return [
      { id: `${x.id}-vertical`, xId: x.id, name: "Long", points: 50, cells: ["su-0", "su-1", "su-4", "su-7", "su-8"] },
      { id: `${x.id}-horizontal`, xId: x.id, name: "Long", points: 50, cells: ["su-2", "su-3", "su-4", "su-5", "su-6"] }
    ];
  }
  const p = x.cells.map((cell) => cell.id);
  return [
    { id: `${x.id}-vertical`, xId: x.id, name: "Short", points: 25, cells: [p[0], p[2], p[4]] },
    { id: `${x.id}-horizontal`, xId: x.id, name: "Short", points: 25, cells: [p[1], p[2], p[3]] }
  ];
});

const BOARD_LAYOUT = {
  "north-west": {
    label: { col: 1, row: 1 },
    cells: { top: [2, 2], left: [1, 3], c: [2, 3], right: [3, 3], bottom: [2, 4] }
  },
  "north-east": {
    label: { col: 9, row: 1 },
    cells: { top: [10, 2], left: [9, 3], c: [10, 3], right: [11, 3], bottom: [10, 4] }
  },
  super: {
    label: { col: 4, row: 4 },
    cells: {
      top: [6, 3],
      "inner-top": [6, 4],
      left: [4, 5],
      "inner-left": [5, 5],
      c: [6, 5],
      "inner-right": [7, 5],
      right: [8, 5],
      "inner-bottom": [6, 6],
      bottom: [6, 7]
    }
  }
};

const state = {
  round: 1,
  scores: { red: 0, blue: 0 },
  displayedScores: { red: 0, blue: 0 },
  records: loadRecords(),
  turn: "blue",
  phase: "cpu",
  selectedTileId: null,
  chain: 0,
  turnSnapshot: null,
  racks: { red: [], blue: [] },
  board: {},
  lastEvent: "Welcome to Cross Locked Lite.",
  bombChance: BASE_BOMB_CHANCE,
  bomb: null,
  scoringCross: null,
  cpuTimer: null
};

const els = {
  board: document.querySelector("#board"),
  rack: document.querySelector("#rack"),
  redScore: document.querySelector("#redScore"),
  blueScore: document.querySelector("#blueScore"),
  roundLabel: document.querySelector("#roundLabel"),
  turnTitle: document.querySelector("#turnTitle"),
  statusText: document.querySelector("#statusText"),
  drawPlayBtn: document.querySelector("#drawPlayBtn"),
  endTurnBtn: document.querySelector("#endTurnBtn"),
  playsLeft: document.querySelector("#playsLeft"),
  actionsLeft: document.querySelector("#actionsLeft"),
  highGame: document.querySelector("#highGame"),
  largestMargin: document.querySelector("#largestMargin"),
  rulesDialog: document.querySelector("#rulesDialog"),
  rulesBtn: document.querySelector("#rulesBtn"),
  closeRulesBtn: document.querySelector("#closeRulesBtn")
};

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function randomRank() {
  return RANKS[Math.floor(Math.random() * RANKS.length)];
}

function makeTile(color, rank = randomRank(), seeded = false) {
  return { id: uid(color), type: "score", color, rank, seeded };
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem("crossLockedLiteRecords")) || { highGame: 0, largestMargin: 0 };
  } catch {
    return { highGame: 0, largestMargin: 0 };
  }
}

function saveRecords() {
  localStorage.setItem("crossLockedLiteRecords", JSON.stringify(state.records));
}

function setupRound() {
  window.clearTimeout(state.cpuTimer);
  state.selectedTileId = null;
  state.chain = 0;
  state.turnSnapshot = null;
  state.bombChance = BASE_BOMB_CHANCE;
  state.racks.red = [];
  state.racks.blue = [];
  state.board = {};
  state.bomb = null;
  state.scoringCross = null;
  X_DEFS.flatMap((x) => x.cells).forEach((cell) => {
    state.board[cell.id] = null;
  });
  seedCenters();
  drawStartingRack("red");
  drawStartingRack("blue");
  state.turn = state.round === 2 ? "red" : "blue";
  state.phase = state.turn === "red" ? "needDraw" : "cpu";
  state.lastEvent = `Round ${state.round}: ${TEAM_LABEL[state.turn]} starts.`;
  render();
  if (state.turn === "blue") {
    state.cpuTimer = window.setTimeout(runCpuTurn, 700);
  }
}

function seedCenters() {
  const smallCenters = shuffle(X_DEFS.filter((x) => x.type === "small").map((x) => x.cells.find((cell) => cell.center).id));
  smallCenters.slice(0, 1).forEach((cellId) => {
    state.board[cellId] = makeTile("red", randomRank(), true);
  });
  smallCenters.slice(1).forEach((cellId) => {
    state.board[cellId] = makeTile("blue", randomRank(), true);
  });
  const superCenter = getXDef("super").cells.find((cell) => cell.center).id;
  const superColor = state.round === 2 ? "blue" : "red";
  state.board[superCenter] = makeTile(superColor, randomRank(), true);
}

function drawStartingRack(color) {
  while (state.racks[color].length < 10) state.racks[color].push(makeTile(color));
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

function isPattern(tiles, targetLength = tiles.length) {
  if (tiles.length <= 1) return true;
  const values = tiles.map((tile) => Number(tile.rank)).sort((a, b) => a - b);
  if (values.every((value) => value === values[0])) return true;
  const unique = [...new Set(values)];
  if (unique.length !== values.length) return false;
  return unique[unique.length - 1] - unique[0] + 1 === unique.length;
}

function lineQualifiesForTeam(line, team) {
  if (!isLineFull(line)) return false;
  const tiles = line.cells.map((id) => state.board[id]);
  return tiles.every((tile) => tile.color === team) && isPattern(tiles, line.cells.length);
}

function xQualifiesForTeam(x, team) {
  if (!isXFull(x)) return false;
  if (!x.cells.every((cell) => state.board[cell.id].color === team)) return false;
  return LINE_DEFS.filter((line) => line.xId === x.id).every((line) => isPattern(line.cells.map((id) => state.board[id]), line.cells.length));
}

function canPlaceTile(tile, cellId) {
  const cell = getCellDef(cellId);
  if (!cell || state.board[cellId]) return { ok: false, reason: "That spot is already full." };
  if (!tile || tile.type !== "score") return { ok: false, reason: "Pick a number tile first." };
  const lines = getLinesForCell(cellId);
  const connected = lines.some((line) => line.cells.some((id) => state.board[id]));
  if (!connected) return { ok: false, reason: "Play next to an existing center pattern." };
  state.board[cellId] = tile;
  const fits = lines.some((line) => {
    const tiles = getLineTiles(line);
    if (tiles.length < 2) return false;
    return isPattern(tiles, line.cells.length);
  });
  state.board[cellId] = null;
  return fits ? { ok: true } : { ok: false, reason: "That tile must match the center line: same number or a sequence." };
}

function selectRackTile(tileId) {
  if (state.turn !== "red" || state.phase !== "playing") return;
  const tile = state.racks.red.find((item) => item.id === tileId);
  if (!tile) return;
  state.selectedTileId = tile.id;
  setStatus(`Selected ${tile.rank}. Tap a highlighted board space.`);
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
  const fromRect = document.querySelector(`[data-tile="${tile.id}"]`)?.getBoundingClientRect();
  placeTile("red", tile, cellId);
  state.selectedTileId = null;
  state.chain += 1;
  state.phase = "placing";
  state.turnSnapshot = createTurnSnapshot();
  render();
  animateTileToBoard(tile.id, fromRect);
  window.setTimeout(() => resolvePostPlacement("red", cellId), 340);
}

function placeTile(color, tile, cellId) {
  state.board[cellId] = tile;
  state.racks[color] = state.racks[color].filter((item) => item.id !== tile.id);
}

function animateTileToBoard(tileId, fromRect) {
  if (!fromRect) return;
  const target = document.querySelector(`.cell [data-tile="${tileId}"]`);
  if (!target) return;
  const toRect = target.getBoundingClientRect();
  const flyer = target.cloneNode(true);
  flyer.classList.add("tile-flyer");
  flyer.style.left = `${fromRect.left}px`;
  flyer.style.top = `${fromRect.top}px`;
  flyer.style.width = `${fromRect.width}px`;
  flyer.style.height = `${fromRect.height}px`;
  document.body.append(flyer);
  target.style.visibility = "hidden";
  const animation = flyer.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 0.98 },
      { transform: `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px) scale(${toRect.width / fromRect.width}, ${toRect.height / fromRect.height})`, opacity: 1 }
    ],
    { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" }
  );
  animation.onfinish = () => {
    flyer.remove();
    target.style.visibility = "";
  };
}

function animateCpuTileToBoard(tileId) {
  const fromRect = els.blueScore.closest(".score-pill")?.getBoundingClientRect();
  const target = document.querySelector(`.cell [data-tile="${tileId}"]`);
  if (!fromRect || !target) return;
  const toRect = target.getBoundingClientRect();
  const flyer = target.cloneNode(true);
  flyer.classList.add("tile-flyer", "cpu-flyer");
  const startSize = Math.min(46, fromRect.height || 46);
  flyer.style.left = `${fromRect.left + fromRect.width / 2 - startSize / 2}px`;
  flyer.style.top = `${fromRect.top + fromRect.height / 2 - startSize / 2}px`;
  flyer.style.width = `${startSize}px`;
  flyer.style.height = `${startSize}px`;
  document.body.append(flyer);
  target.style.visibility = "hidden";
  const animation = flyer.animate(
    [
      { transform: "translate(0, 0) scale(0.8)", opacity: 0 },
      { transform: "translate(-18px, 12px) scale(1.08)", opacity: 1, offset: 0.22 },
      {
        transform: `translate(${toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2)}px, ${toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2)}px) scale(${toRect.width / startSize})`,
        opacity: 1
      }
    ],
    { duration: 420, easing: "cubic-bezier(.18,.82,.2,1)" }
  );
  animation.onfinish = () => {
    flyer.remove();
    target.style.visibility = "";
    target.closest(".cell")?.classList.add("cpu-landed");
    window.setTimeout(() => target.closest(".cell")?.classList.remove("cpu-landed"), 360);
  };
}

function resolvePostPlacement(color, cellId) {
  const x = getXDef(getCellDef(cellId).xId);
  if (xQualifiesForTeam(x, color)) {
    scoreAndResetCross(color, x, () => {
      if (color === "red") {
        waitForHumanFreshDraw();
      } else {
        resolveFreshDraw(color);
        if (state.turn === "blue" && state.phase === "cpu") {
          state.cpuTimer = window.setTimeout(cpuStep, 650);
        }
      }
    });
    return;
  }
  if (color === "red") {
    waitForHumanFreshDraw();
    return;
  }
  resolveFreshDraw(color);
}

function waitForHumanFreshDraw() {
  if (checkRoundEnd()) return;
  state.phase = "needFreshDraw";
  state.selectedTileId = null;
  state.turnSnapshot = null;
  state.lastEvent = "Press Draw to reveal your fresh tile.";
  setStatus("Press Draw to get the tile or event you earned.");
  render();
}

function scoreAndResetCross(color, x, next) {
  const points = x.type === "super" ? 200 : 100;
  state.phase = "scoring";
  state.scoringCross = { xId: x.id, color, points };
  state.scores[color] += points;
  state.lastEvent = `${TEAM_LABEL[color]} completed a ${x.type === "super" ? "Big Cross" : "Small Cross"} for ${points}.`;
  setStatus(`${TEAM_LABEL[color]} scores ${points}. The cross will reset.`);
  render();
  window.setTimeout(() => {
    clearCrossToFreshCenter(x, color);
    state.scoringCross = null;
    state.phase = color === "red" ? "playing" : "cpu";
    render();
    window.setTimeout(next, 180);
  }, 980);
}

function clearCrossToFreshCenter(x, color) {
  const center = x.cells.find((cell) => cell.center);
  x.cells.forEach((cell) => {
    state.board[cell.id] = null;
  });
  state.board[center.id] = makeTile(color, randomRank(), true);
}

function startHumanTurn() {
  if (state.turn !== "red" || state.phase !== "needDraw") return;
  const fromRect = els.drawPlayBtn.getBoundingClientRect();
  state.phase = "playing";
  state.chain = 0;
  state.bombChance = BASE_BOMB_CHANCE;
  const tile = makeTile("red");
  state.racks.red.push(tile);
  state.turnSnapshot = createTurnSnapshot();
  state.lastEvent = `You drew a ${tile.rank}.`;
  setStatus("Place one tile, or end your turn. Each placement earns a fresh draw.");
  render();
  animateDrawToRack(tile, fromRect);
}

function createTurnSnapshot() {
  return {
    racks: structuredClone(state.racks),
    board: structuredClone(state.board),
    chain: state.chain
  };
}

function endHumanTurn() {
  if (state.turn !== "red" || !["playing", "needFreshDraw"].includes(state.phase)) return;
  passTurnTo("blue", "You ended your turn.");
}

function passTurnTo(nextTeam, eventText) {
  state.selectedTileId = null;
  state.chain = 0;
  state.turnSnapshot = null;
  state.turn = nextTeam;
  state.phase = nextTeam === "red" ? "needDraw" : "cpu";
  state.bombChance = BASE_BOMB_CHANCE;
  state.lastEvent = eventText;
  if (checkRoundEnd()) return;
  render();
  if (nextTeam === "blue") state.cpuTimer = window.setTimeout(runCpuTurn, 650);
}

function resolveFreshDraw(color) {
  if (checkRoundEnd()) return;
  const event = pickFreshEvent();
  if (event === "number") {
    const tile = makeTile(color);
    const fromRect = color === "red" ? document.querySelector(".rack-turn-card")?.getBoundingClientRect() : null;
    state.racks[color].push(tile);
    const nextRisk = nextBombChance();
    state.lastEvent = `${TEAM_LABEL[color]} drew a fresh ${tile.rank}. Bomb risk rises to ${nextRisk}%.`;
    setStatus(color === "red" ? `Fresh tile added. Bomb risk is now ${nextRisk}%.` : state.lastEvent);
    state.bombChance = nextRisk;
    state.phase = color === "red" ? "drawing" : "cpu";
    state.turnSnapshot = createTurnSnapshot();
    render();
    if (color === "red") {
      animateDrawToRack(tile, fromRect);
      window.setTimeout(() => {
        if (state.turn === "red" && state.phase === "drawing") {
          state.phase = "playing";
          setStatus(`Fresh tile added. Bomb risk is now ${state.bombChance}%. Place another tile, or end your turn.`);
          render();
        }
      }, 430);
    }
    return;
  }
  const bombColor = event === "redBomb" ? "red" : "blue";
  showSpecialDraw(color, { kind: "bomb", color: bombColor, label: "BOMB", detail: TEAM_LABEL[bombColor] }, () => {
    triggerBomb(color, bombColor);
  });
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
  state.phase = "bombing";
  state.selectedTileId = null;
  state.bombChance = BASE_BOMB_CHANCE;
  state.bomb = {
    color: bombColor,
    cells: targets,
    message: removed ? `${TEAM_LABEL[bombColor]} Bomb is clearing ${removed} tile${removed === 1 ? "" : "s"}.` : `${TEAM_LABEL[bombColor]} Bomb hit, but there were no loose ${bombColor} tiles to remove.`
  };
  state.lastEvent = `${TEAM_LABEL[drawColor]} drew ${TEAM_LABEL[bombColor]} Bomb.`;
  setStatus(state.bomb.message);
  render();
  window.requestAnimationFrame(() => {
    targets.forEach((cellId) => createBombBurst(cellId, bombColor));
  });
  window.setTimeout(() => {
    targets.forEach((cellId) => {
      state.board[cellId] = null;
    });
  state.bomb = null;
  state.scoringCross = null;
  passTurnTo(otherTeam(drawColor), `${TEAM_LABEL[drawColor]} drew ${TEAM_LABEL[bombColor]} Bomb. ${removed} ${bombColor} tile${removed === 1 ? "" : "s"} removed.`);
  }, 900);
}

function bombTiles(color) {
  const targets = pickBombTargets(color);
  targets.forEach((cellId) => {
    state.board[cellId] = null;
  });
  return targets.length;
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

function showSpecialDraw(drawColor, tile, onDone) {
  state.phase = "drawing";
  const source = drawColor === "red" ? els.drawPlayBtn : els.blueScore.closest(".score-pill");
  const fromRect = source?.getBoundingClientRect();
  const targetRect = document.querySelector(".rack-turn-card")?.getBoundingClientRect() || fromRect;
  if (!fromRect || !targetRect) {
    onDone();
    return;
  }
  const el = document.createElement("div");
  el.className = `special-draw-tile ${tile.kind} ${tile.color || ""}`;
  el.innerHTML = `<strong>${tile.label}</strong><small>${tile.detail}</small>`;
  const size = 70;
  el.style.left = `${fromRect.left + fromRect.width / 2 - size / 2}px`;
  el.style.top = `${fromRect.top + fromRect.height / 2 - size / 2}px`;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  document.body.append(el);
  setStatus(`${tile.detail} Bomb drawn.`);
  const animation = el.animate(
    [
      { transform: "translate(0, 0) scale(0.72) rotate(-4deg)", opacity: 0 },
      { transform: "translate(0, -16px) scale(1) rotate(2deg)", opacity: 1, offset: 0.24 },
      {
        transform: `translate(${targetRect.left + targetRect.width / 2 - (fromRect.left + fromRect.width / 2)}px, ${targetRect.top + targetRect.height / 2 - (fromRect.top + fromRect.height / 2)}px) scale(1.08) rotate(0deg)`,
        opacity: 1
      }
    ],
    { duration: 480, easing: "cubic-bezier(.18,.82,.2,1)" }
  );
  animation.onfinish = () => {
    el.classList.add("special-revealed");
    window.setTimeout(() => {
      el.remove();
      onDone();
    }, 520);
  };
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
  const animation = flyer.animate(
    [
      { transform: "translate(0, 0) scale(0.72)", opacity: 0 },
      { transform: "translate(0, -18px) scale(1)", opacity: 1, offset: 0.2 },
      {
        transform: `translate(${toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2)}px, ${toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2)}px) scale(${toRect.width / startSize})`,
        opacity: 1
      }
    ],
    { duration: 430, easing: "cubic-bezier(.18,.82,.2,1)" }
  );
  animation.onfinish = () => {
    flyer.remove();
    target.classList.remove("rack-landing");
    target.classList.add("rack-landed");
    window.setTimeout(() => target.classList.remove("rack-landed"), 360);
  };
}

function otherTeam(color) {
  return color === "red" ? "blue" : "red";
}

function runCpuTurn() {
  if (state.phase !== "cpu" || state.turn !== "blue") return;
  state.chain = 0;
  const tile = makeTile("blue");
  state.racks.blue.push(tile);
  state.lastEvent = `Blue CPU drew a ${tile.rank}.`;
  render();
  state.cpuTimer = window.setTimeout(cpuStep, 520);
}

function cpuStep() {
  if (state.phase !== "cpu" || state.turn !== "blue") return;
  const best = findBestPlacement("blue");
  if (!best || (state.chain > 0 && Math.random() < 0.22)) {
    passTurnTo("red", "Blue CPU ended its turn.");
    return;
  }
  placeTile("blue", best.tile, best.cellId);
  state.chain += 1;
  state.lastEvent = `Blue CPU placed ${best.tile.rank}.`;
  render();
  animateCpuTileToBoard(best.tile.id);
  state.cpuTimer = window.setTimeout(() => {
    resolvePostPlacement("blue", best.cellId);
    if (state.turn === "blue" && state.phase === "cpu") {
      state.cpuTimer = window.setTimeout(cpuStep, 650);
    }
  }, 640);
}

function findBestPlacement(team) {
  let best = null;
  const openCells = Object.keys(state.board).filter((cellId) => !state.board[cellId]);
  state.racks[team].forEach((tile) => {
    openCells.forEach((cellId) => {
      const value = evaluatePlacement(team, tile, cellId);
      if (value > (best?.value ?? -1)) best = { tile, cellId, value };
    });
  });
  return best?.value >= 0 ? best : null;
}

function evaluatePlacement(team, tile, cellId) {
  const result = canPlaceTile(tile, cellId);
  if (!result.ok) return -1;
  state.board[cellId] = tile;
  const before = scoreRound()[team].total;
  let value = before;
  const cell = getCellDef(cellId);
  value += cell.center ? 3 : 1;
  getLinesForCell(cellId).forEach((line) => {
    const tiles = getLineTiles(line);
    if (tiles.every((item) => item.color === team) && isPattern(tiles, line.cells.length)) value += tiles.length * 4;
  });
  state.board[cellId] = null;
  return value;
}

function checkRoundEnd() {
  if (!Object.values(state.board).every(Boolean)) return false;
  const roundScore = scoreRound();
  state.scores.red += roundScore.red.total;
  state.scores.blue += roundScore.blue.total;
  if (state.round >= TOTAL_ROUNDS) {
    finishGame();
    return true;
  }
  state.round += 1;
  setupRound();
  return true;
}

function finishGame() {
  const total = state.scores.red + state.scores.blue;
  const margin = Math.abs(state.scores.red - state.scores.blue);
  state.records.highGame = Math.max(state.records.highGame, total);
  state.records.largestMargin = Math.max(state.records.largestMargin, margin);
  saveRecords();
  state.phase = "gameOver";
  state.lastEvent = state.scores.red === state.scores.blue ? "Tie game." : state.scores.red > state.scores.blue ? "Red wins the game." : "Blue CPU wins the game.";
  setStatus(`${state.lastEvent} High game ${state.records.highGame}. Largest margin ${state.records.largestMargin}.`);
  render();
}

function scoreRound() {
  return { red: scoreTeam("red"), blue: scoreTeam("blue") };
}

function scoreTeam(team) {
  let total = 0;
  const completedXs = new Set();
  X_DEFS.forEach((x) => {
    if (xQualifiesForTeam(x, team)) {
      total += x.type === "super" ? 200 : 100;
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
}

function renderBoard() {
  els.board.innerHTML = "";
  els.board.classList.toggle("bomb-active", Boolean(state.bomb));
  els.board.classList.toggle("bomb-red", state.bomb?.color === "red");
  els.board.classList.toggle("bomb-blue", state.bomb?.color === "blue");
  X_DEFS.forEach((x) => {
    const layout = BOARD_LAYOUT[x.id];
    const title = document.createElement("span");
    title.className = "board-label";
    title.textContent = x.name;
    title.style.gridColumn = String(layout.label.col);
    title.style.gridRow = String(layout.label.row);
    els.board.append(title);
    x.cells.forEach((cell) => {
      const [col, row] = layout.cells[cell.pos];
      const cellEl = document.createElement("button");
      cellEl.className = "cell";
      cellEl.style.gridColumn = String(col);
      cellEl.style.gridRow = String(row);
      cellEl.dataset.cell = cell.id;
      cellEl.dataset.x = x.id;
      cellEl.setAttribute("aria-label", `${x.name} ${cell.pos}`);
      const tile = state.board[cell.id];
      const isScoringCell = state.scoringCross?.xId === x.id;
      if (isScoringCell) {
        cellEl.classList.add("cross-scoring", state.scoringCross.color);
      }
      if (!tile && state.turn === "red" && state.phase === "playing") {
        const selected = state.racks.red.find((item) => item.id === state.selectedTileId);
        if (selected && canPlaceTile(selected, cell.id).ok) cellEl.classList.add("selectable");
      }
      if (tile) {
        cellEl.classList.add(tile.seeded ? "seeded" : "filled");
        cellEl.classList.toggle("bomb-target", Boolean(state.bomb?.cells.includes(cell.id)));
        cellEl.append(renderTile(tile, false));
      }
      if (isScoringCell && cell.center) {
        const points = document.createElement("span");
        points.className = "cross-points";
        points.textContent = `+${state.scoringCross.points}`;
        cellEl.append(points);
      }
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
  labelEl.textContent = "Red Tiles";
  const tilesEl = document.createElement("div");
  tilesEl.className = "rack-tiles lite-rack";
  RANKS.forEach((rank) => {
    const matchingTiles = state.racks.red.filter((tile) => tile.rank === rank);
    const tile = matchingTiles[0] || { id: `empty-score-${rank}`, type: "score", color: "red", rank };
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
  el.className = `tile ${tile.color}`;
  el.dataset.tile = tile.id;
  el.innerHTML = `${tile.rank}<small>${tile.color}</small>`;
  return el;
}

function renderHud() {
  const liveRoundScore = state.phase === "gameOver" || state.phase === "scoring" ? { red: { total: 0 }, blue: { total: 0 } } : scoreRound();
  updateScoreBox(els.redScore, "red", state.scores.red + liveRoundScore.red.total);
  updateScoreBox(els.blueScore, "blue", state.scores.blue + liveRoundScore.blue.total);
  els.roundLabel.textContent = `${state.round}/${TOTAL_ROUNDS}`;
  els.playsLeft.textContent = String(state.racks.red.length);
  els.actionsLeft.textContent = String(state.chain);
  els.highGame.textContent = String(state.records.highGame);
  els.largestMargin.textContent = String(state.records.largestMargin);
  els.turnTitle.textContent = getTurnTitle();
  els.drawPlayBtn.textContent = state.phase === "gameOver" ? "New Game" : "Draw";
  els.drawPlayBtn.disabled = state.phase !== "gameOver" && (state.turn !== "red" || !["needDraw", "needFreshDraw"].includes(state.phase));
  els.endTurnBtn.disabled = state.turn !== "red" || !["playing", "needFreshDraw"].includes(state.phase);
  document.querySelector(".rack-turn-card")?.classList.toggle("player-ready", state.turn === "red" && ["needDraw", "needFreshDraw"].includes(state.phase));
  if (state.phase === "needDraw") setStatus("Tap Draw to start. You will get one red number tile.");
  if (state.phase === "needFreshDraw") setStatus("Tap Draw to reveal the fresh tile or event.");
  if (state.phase === "drawing") setStatus("Drawing...");
  if (state.phase === "placing") setStatus("Tile placed. Get ready to draw.");
  if (state.phase === "cpu") setStatus("Blue CPU is taking its turn.");
  if (state.phase === "bombing") setStatus(state.bomb?.message || "Bomb is resolving.");
  if (state.phase === "scoring" && state.scoringCross) setStatus(`${TEAM_LABEL[state.scoringCross.color]} scores ${state.scoringCross.points}. Resetting that cross.`);
}

function updateScoreBox(el, team, value) {
  const previous = Number(el.textContent);
  if (previous !== value) {
    el.textContent = value;
    if (value > state.displayedScores[team]) {
      const delta = value - previous;
      const pill = el.closest(".score-pill");
      pill.classList.remove("score-pop");
      void el.offsetWidth;
      pill.classList.add("score-pop");
      animateScoreDelta(pill, delta, team);
    }
    state.displayedScores[team] = value;
  }
}

function animateScoreDelta(pill, delta, team) {
  if (!pill || delta <= 0) return;
  pill.querySelectorAll(".score-delta").forEach((node) => node.remove());
  const bubble = document.createElement("span");
  bubble.className = `score-delta ${team}`;
  bubble.textContent = `+${delta}`;
  pill.append(bubble);
  window.setTimeout(() => bubble.remove(), 760);
}

function getTurnTitle() {
  if (state.phase === "gameOver") return "Game over";
  if (state.turn === "blue") return "Blue CPU";
  if (state.phase === "needDraw") return "Your turn";
  if (state.phase === "needFreshDraw") return "Draw earned";
  if (state.phase === "drawing") return "Drawing";
  if (state.phase === "placing") return "Tile placed";
  return "Place or end";
}

function setStatus(message) {
  els.statusText.textContent = `${message} ${state.lastEvent ? `(${state.lastEvent})` : ""}`;
}

els.drawPlayBtn.addEventListener("click", () => {
  if (state.phase === "gameOver") {
    state.round = 1;
    state.scores = { red: 0, blue: 0 };
    state.displayedScores = { red: 0, blue: 0 };
    setupRound();
  } else {
    if (state.phase === "needFreshDraw") resolveFreshDraw("red");
    else startHumanTurn();
  }
});
els.endTurnBtn.addEventListener("click", endHumanTurn);
els.rulesBtn.addEventListener("click", () => els.rulesDialog.showModal());
els.closeRulesBtn.addEventListener("click", () => els.rulesDialog.close());

setupRound();
