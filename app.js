const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const RANK_VALUE = Object.fromEntries(RANKS.map((rank, index) => [rank, index + 2]));
const TILE_POINTS = {
  "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10,
  "10": 20, J: 20, Q: 20, K: 20, A: 50, Joker: 50
};
const ACTIONS = {
  lock: { label: "Lock", limit: 1, count: 8 },
  unlock: { label: "Unlock", limit: 1, count: 8 },
  replace1: { label: "Replace 1", limit: 1, count: 16 },
  replace2: { label: "Replace 2", limit: 2, count: 8 },
  superReplace: { label: "Super", limit: 3, count: 4 },
  draw4: { label: "Draw 4", limit: 0, count: 4 }
};

const X_DEFS = [
  {
    id: "north-west",
    name: "Small X",
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
    name: "Small X",
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
    name: "Super X",
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
  },
  {
    id: "south-west",
    name: "Small X",
    type: "small",
    cells: [
      { id: "sw-0", row: 1, col: 2, pos: "top" },
      { id: "sw-1", row: 2, col: 1, pos: "left" },
      { id: "sw-2", row: 2, col: 2, pos: "c", center: true },
      { id: "sw-3", row: 2, col: 3, pos: "right" },
      { id: "sw-4", row: 3, col: 2, pos: "bottom" }
    ]
  },
  {
    id: "south-east",
    name: "Small X",
    type: "small",
    cells: [
      { id: "se-0", row: 1, col: 2, pos: "top" },
      { id: "se-1", row: 2, col: 1, pos: "left" },
      { id: "se-2", row: 2, col: 2, pos: "c", center: true },
      { id: "se-3", row: 2, col: 3, pos: "right" },
      { id: "se-4", row: 3, col: 2, pos: "bottom" }
    ]
  }
];

const LINE_DEFS = X_DEFS.flatMap((x) => {
  const prefix = x.id;
  if (x.type === "super") {
    return [
      { id: `${prefix}-vertical`, xId: x.id, name: "Long line", points: 100, cells: ["su-0", "su-1", "su-4", "su-7", "su-8"] },
      { id: `${prefix}-horizontal`, xId: x.id, name: "Long line", points: 100, cells: ["su-2", "su-3", "su-4", "su-5", "su-6"] }
    ];
  }
  const p = x.cells.map((cell) => cell.id);
  return [
    { id: `${prefix}-vertical`, xId: x.id, name: "Short line", points: 50, cells: [p[0], p[2], p[4]] },
    { id: `${prefix}-horizontal`, xId: x.id, name: "Short line", points: 50, cells: [p[1], p[2], p[3]] }
  ];
});

const BOARD_LAYOUT = {
  "north-west": {
    label: { col: 3, row: 3 },
    cells: { top: [4, 4], left: [3, 5], c: [4, 5], right: [5, 5], bottom: [4, 6] }
  },
  "north-east": {
    label: { col: 11, row: 3 },
    cells: { top: [12, 4], left: [11, 5], c: [12, 5], right: [13, 5], bottom: [12, 6] }
  },
  super: {
    label: { col: 7, row: 6 },
    cells: {
      top: [8, 6],
      "inner-top": [8, 7],
      left: [6, 8],
      "inner-left": [7, 8],
      c: [8, 8],
      "inner-right": [9, 8],
      right: [10, 8],
      "inner-bottom": [8, 9],
      bottom: [8, 10]
    }
  },
  "south-west": {
    label: { col: 3, row: 10 },
    cells: { top: [4, 11], left: [3, 12], c: [4, 12], right: [5, 12], bottom: [4, 13] }
  },
  "south-east": {
    label: { col: 11, row: 10 },
    cells: { top: [12, 11], left: [11, 12], c: [12, 12], right: [13, 12], bottom: [12, 13] }
  }
};

const state = {
  round: 1,
  scores: { red: 0, blue: 0 },
  displayedScores: { red: 0, blue: 0 },
  turn: "red",
  phase: "needDraw",
  selectedTileId: null,
  selectedActionId: null,
  replaceTileId: null,
  replaceUsesLeft: 0,
  playsLeft: 3,
  actionsLeft: 3,
  pendingPlacements: [],
  lastStartedEmptyX: null,
  turnSnapshot: null,
  bags: { red: [], blue: [] },
  racks: { red: [], blue: [] },
  board: {},
  lockedLines: {},
  log: []
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
  swapBtn: document.querySelector("#swapBtn"),
  undoBtn: document.querySelector("#undoBtn"),
  endTurnBtn: document.querySelector("#endTurnBtn"),
  playsLeft: document.querySelector("#playsLeft"),
  actionsLeft: document.querySelector("#actionsLeft"),
  log: document.querySelector("#log"),
  rulesDialog: document.querySelector("#rulesDialog"),
  rulesBtn: document.querySelector("#rulesBtn"),
  closeRulesBtn: document.querySelector("#closeRulesBtn")
};

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeBag(color) {
  const tiles = [];
  RANKS.forEach((rank) => {
    for (let i = 0; i < 6; i += 1) tiles.push({ id: uid(color), type: "score", color, rank });
  });
  for (let i = 0; i < 4; i += 1) tiles.push({ id: uid(color), type: "score", color: "joker", rank: "Joker" });
  Object.entries(ACTIONS).forEach(([kind, action]) => {
    const half = Math.max(1, Math.floor(action.count / 2));
    for (let i = 0; i < half; i += 1) tiles.push({ id: uid("action"), type: "action", kind });
  });
  return shuffle(tiles);
}

function setupRound() {
  state.turn = "red";
  state.phase = "needDraw";
  state.selectedTileId = null;
  state.selectedActionId = null;
  state.replaceTileId = null;
  state.replaceUsesLeft = 0;
  state.playsLeft = 3;
  state.actionsLeft = 3;
  state.pendingPlacements = [];
  state.lastStartedEmptyX = null;
  state.turnSnapshot = null;
  state.bags.red = makeBag("red");
  state.bags.blue = makeBag("blue");
  state.racks.red = [];
  state.racks.blue = [];
  state.board = {};
  state.lockedLines = {};
  X_DEFS.flatMap((x) => x.cells).forEach((cell) => {
    state.board[cell.id] = null;
  });
  drawTiles("red", 15);
  drawTiles("blue", 15);
  addLog(`Round ${state.round} started. Red goes first.`);
  render();
}

function drawTiles(color, count) {
  for (let i = 0; i < count; i += 1) {
    if (state.bags[color].length) state.racks[color].push(state.bags[color].pop());
  }
}

function addLog(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 8);
}

function getCellDef(cellId) {
  return X_DEFS.flatMap((x) => x.cells.map((cell) => ({ ...cell, xId: x.id, xType: x.type }))).find((cell) => cell.id === cellId);
}

function getXDef(xId) {
  return X_DEFS.find((x) => x.id === xId);
}

function getLinesForCell(cellId) {
  return LINE_DEFS.filter((line) => line.cells.includes(cellId));
}

function isCellLocked(cellId) {
  return getLinesForCell(cellId).some((line) => state.lockedLines[line.id]);
}

function isXEmpty(xId) {
  return getXDef(xId).cells.every((cell) => !state.board[cell.id]);
}

function isXFull(xId) {
  return getXDef(xId).cells.every((cell) => state.board[cell.id]);
}

function tileColorForTeam(tile, team) {
  return tile.color === team || tile.color === "joker";
}

function getLineTiles(line) {
  return line.cells.map((id) => state.board[id]).filter(Boolean);
}

function isLineFilled(line) {
  return line.cells.every((id) => state.board[id]);
}

function lineQualifiesForTeam(line, team) {
  if (!isLineFilled(line)) return false;
  const tiles = line.cells.map((id) => state.board[id]);
  return tiles.every((tile) => tileColorForTeam(tile, team)) && isRankPattern(tiles);
}

function xQualifiesForTeam(x, team) {
  if (!isXFull(x.id)) return false;
  return x.cells.every((cell) => tileColorForTeam(state.board[cell.id], team))
    && LINE_DEFS.filter((line) => line.xId === x.id).every((line) => isRankPattern(line.cells.map((id) => state.board[id])));
}

function isRankPattern(tiles) {
  const realRanks = tiles.filter((tile) => tile.rank !== "Joker").map((tile) => tile.rank);
  if (realRanks.length <= 1) return true;
  if (realRanks.every((rank) => rank === realRanks[0])) return true;
  const values = realRanks.map((rank) => RANK_VALUE[rank]).sort((a, b) => a - b);
  const lowAce = realRanks.includes("A") ? realRanks.map((rank) => (rank === "A" ? 1 : RANK_VALUE[rank])).sort((a, b) => a - b) : null;
  return canBeConsecutive(values, tiles.length) || (lowAce && canBeConsecutive(lowAce, tiles.length));
}

function canBeConsecutive(values, targetLength) {
  const unique = [...new Set(values)];
  if (unique.length !== values.length) return false;
  const gaps = unique[unique.length - 1] - unique[0] + 1 - unique.length;
  const jokers = targetLength - values.length;
  return gaps <= jokers;
}

function canPlaceTile(tile, cellId) {
  const cell = getCellDef(cellId);
  if (!cell || state.board[cellId] || isCellLocked(cellId) || tile.type !== "score") return { ok: false, reason: "That space is not available." };
  if (cell.center && tile.rank === "Joker") return { ok: false, reason: "Jokers cannot be placed in any center space." };
  if (cell.xType === "super" && cell.center && ["A", "K", "2", "Joker"].includes(tile.rank)) {
    return { ok: false, reason: "The Super X center cannot be A, K, 2, or Joker." };
  }
  if (isXEmpty(cell.xId) && !cell.center) return { ok: false, reason: "Start an empty X by playing its center first." };
  if (state.lastStartedEmptyX && state.lastStartedEmptyX !== cell.xId) {
    return { ok: false, reason: "Finish the newly opened X before playing elsewhere." };
  }
  const fit = placementFitsLine(tile, cellId);
  if (!fit.ok) return fit;
  return { ok: true };
}

function placementFitsLine(tile, cellId) {
  const cell = getCellDef(cellId);
  const openingEmptyX = isXEmpty(cell.xId);
  state.board[cellId] = tile;
  const candidateLines = getLinesForCell(cellId);
  const hasFit = candidateLines.some((line) => {
    const tiles = line.cells.map((id) => state.board[id]).filter(Boolean);
    if (openingEmptyX && cell.center && tiles.length === 1) return true;
    if (tiles.length < 2) return false;
    return isRankPattern(tiles);
  });
  state.board[cellId] = null;
  return hasFit
    ? { ok: true }
    : { ok: false, reason: "Tiles placed next to each other must be a possible sequence or the same kind." };
}

function selectRackTile(tileId) {
  if (state.turn !== "red" || state.phase !== "playing") return;
  const tile = state.racks.red.find((item) => item.id === tileId);
  if (!tile) return;
  if (tile.type === "action") {
    state.selectedActionId = tileId;
    state.selectedTileId = null;
    state.replaceTileId = null;
    state.replaceUsesLeft = tile.kind.includes("replace") ? ACTIONS[tile.kind].limit : 0;
    const action = ACTIONS[tile.kind];
    if (tile.kind === "draw4") {
      useDrawFour(tile);
      return;
    }
    setStatus(`${action.label} selected. ${tile.kind.includes("replace") ? "Tap one of your matching scoring tiles, then an opponent board tile." : "Tap a line on the board."}`);
  } else if (state.selectedActionId && getSelectedAction()?.kind.includes("replace")) {
    state.replaceTileId = tileId;
    setStatus(`${tile.rank} selected for replacement. Tap an opponent tile with the same rank.`);
  } else {
    state.selectedTileId = tileId;
    state.selectedActionId = null;
    state.replaceTileId = null;
    setStatus(`Selected ${tile.rank}. Tap an open board space.`);
  }
  render();
}

function getSelectedAction() {
  return state.racks.red.find((tile) => tile.id === state.selectedActionId);
}

function setStatus(message) {
  els.statusText.textContent = message;
}

function placeSelectedTile(cellId) {
  if (state.turn !== "red" || state.phase !== "playing") return;
  const action = getSelectedAction();
  if (action?.kind === "lock" || action?.kind === "unlock") {
    handleLockClick(cellId, action);
    return;
  }
  if (action?.kind.includes("replace")) {
    handleReplaceClick(cellId, action);
    return;
  }
  const tile = state.racks.red.find((item) => item.id === state.selectedTileId);
  if (!tile) return;
  if (state.playsLeft <= 0) {
    setStatus("You have used all 3 scoring plays for this turn.");
    return;
  }
  const result = canPlaceTile(tile, cellId);
  if (!result.ok) {
    setStatus(result.reason);
    return;
  }
  const fromRect = document.querySelector(`[data-tile="${tile.id}"]`)?.getBoundingClientRect();
  const cell = getCellDef(cellId);
  const wasEmpty = isXEmpty(cell.xId);
  state.board[cellId] = tile;
  state.racks.red = state.racks.red.filter((item) => item.id !== tile.id);
  state.pendingPlacements.push({ cellId, tile, xWasEmpty: wasEmpty, xId: cell.xId });
  if (wasEmpty) state.lastStartedEmptyX = cell.xId;
  state.playsLeft -= 1;
  state.selectedTileId = null;
  setStatus(`${tile.rank} placed. ${state.playsLeft} scoring plays left.`);
  render();
  animateTileToBoard(tile.id, fromRect);
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
  const scaleX = toRect.width / fromRect.width;
  const scaleY = toRect.height / fromRect.height;
  const animation = flyer.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 0.98 },
      { transform: `translate(${toRect.left - fromRect.left}px, ${toRect.top - fromRect.top}px) scale(${scaleX}, ${scaleY})`, opacity: 1 }
    ],
    { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" }
  );
  animation.onfinish = () => {
    flyer.remove();
    target.style.visibility = "";
  };
}

function handleLockClick(cellId, action) {
  if (state.actionsLeft <= 0) return;
  const candidateLines = getLinesForCell(cellId);
  const target = candidateLines.find((line) => {
    const completeForEither = lineQualifiesForTeam(line, "red") || lineQualifiesForTeam(line, "blue");
    return action.kind === "lock" ? completeForEither && !state.lockedLines[line.id] : state.lockedLines[line.id];
  });
  if (!target) {
    setStatus(action.kind === "lock" ? "Tap a completed, unlocked line to lock it." : "Tap a locked line to unlock it.");
    return;
  }
  if (action.kind === "lock") {
    const alreadyLockedInX = LINE_DEFS.some((line) => line.xId === target.xId && state.lockedLines[line.id]);
    if (alreadyLockedInX) {
      setStatus("Only one line can be locked within a single X.");
      return;
    }
    state.lockedLines[target.id] = "red";
    consumeAction(action);
    addLog(`Red locked a ${target.name.toLowerCase()}.`);
  } else {
    delete state.lockedLines[target.id];
    consumeAction(action);
    addLog("Red unlocked a line.");
  }
  render();
}

function handleReplaceClick(cellId, action) {
  if (state.actionsLeft <= 0) return;
  if (!state.replaceTileId) {
    setStatus("Choose a scoring tile from your rack before tapping the board tile.");
    return;
  }
  const rackTile = state.racks.red.find((tile) => tile.id === state.replaceTileId);
  const boardTile = state.board[cellId];
  if (!rackTile || !boardTile || boardTile.color === "red" || isCellLocked(cellId)) {
    setStatus("Tap an unlocked opponent tile to replace.");
    return;
  }
  const canReplaceJoker = action.kind === "superReplace";
  if (boardTile.rank === "Joker" && !canReplaceJoker) {
    setStatus("Only Super Replace can replace a joker.");
    return;
  }
  if (boardTile.rank !== "Joker" && rackTile.rank !== boardTile.rank) {
    setStatus("Replacement tile must match the board tile rank.");
    return;
  }
  if (boardTile.rank === "Joker" && !lineWouldAcceptJokerReplacement(cellId, rackTile)) {
    setStatus("That tile does not fit the line pattern for replacing a joker.");
    return;
  }
  state.board[cellId] = rackTile;
  state.racks.red = state.racks.red.filter((tile) => tile.id !== rackTile.id);
  if (boardTile.rank === "Joker") state.racks.red.push(boardTile);
  else state.bags.blue.unshift(boardTile);
  state.replaceUsesLeft -= 1;
  addLog(`Red replaced ${boardTile.rank} with ${rackTile.rank}.`);
  if (state.replaceUsesLeft <= 0) consumeAction(action);
  state.replaceTileId = null;
  render();
}

function lineWouldAcceptJokerReplacement(cellId, rackTile) {
  return getLinesForCell(cellId).every((line) => {
    const tiles = line.cells.map((id) => (id === cellId ? rackTile : state.board[id])).filter(Boolean);
    return tiles.length < 2 || isRankPattern(tiles);
  });
}

function consumeAction(action) {
  state.actionsLeft -= 1;
  state.racks.red = state.racks.red.filter((tile) => tile.id !== action.id);
  state.selectedActionId = null;
  state.replaceTileId = null;
  state.replaceUsesLeft = 0;
  setStatus(`${ACTIONS[action.kind].label} used. ${state.actionsLeft} actions left.`);
}

function useDrawFour(action) {
  if (state.actionsLeft <= 0) return;
  drawTiles("red", 4);
  consumeAction(action);
  addLog("Red used Draw 4.");
  render();
}

function validateTurnEnd() {
  if (!state.lastStartedEmptyX) return { ok: true };
  const opened = state.pendingPlacements.filter((move) => move.xId === state.lastStartedEmptyX);
  if (opened.length < 2 || opened.length > 3) {
    return { ok: false, reason: "Opening an empty X requires the center plus 1 or 2 more tiles." };
  }
  if (!opened.some((move) => getCellDef(move.cellId).center)) {
    return { ok: false, reason: "Opening an empty X must include the center." };
  }
  const linesTouched = LINE_DEFS.filter((line) => line.xId === state.lastStartedEmptyX && opened.every((move) => line.cells.includes(move.cellId) || !getCellDef(move.cellId).center));
  const anyPattern = linesTouched.some((line) => {
    const tiles = line.cells.map((id) => state.board[id]).filter(Boolean);
    return tiles.length >= opened.length && isRankPattern(tiles);
  });
  if (!anyPattern) return { ok: false, reason: "Opening tiles must form a like-kind or sequence line." };
  return { ok: true };
}

function rollbackBadOpening() {
  state.pendingPlacements.forEach((move) => {
    state.board[move.cellId] = null;
    state.racks.red.push(move.tile);
    state.playsLeft += 1;
  });
  state.pendingPlacements = [];
  state.lastStartedEmptyX = null;
}

function startHumanTurn(mode) {
  if (state.turn !== "red" || state.phase !== "needDraw") return;
  drawTiles("red", 3);
  state.phase = mode === "swap" ? "swap" : "playing";
  state.playsLeft = 3;
  state.actionsLeft = 3;
  state.pendingPlacements = [];
  state.lastStartedEmptyX = null;
  if (mode === "swap") {
    doSwap("red");
    addLog("Red drew 3 and swapped triplicates.");
    endHumanTurn(true);
  } else {
    state.turnSnapshot = createTurnSnapshot();
    addLog("Red drew 3 tiles.");
  }
  render();
}

function createTurnSnapshot() {
  return {
    racks: structuredClone(state.racks),
    bags: structuredClone(state.bags),
    board: structuredClone(state.board),
    lockedLines: structuredClone(state.lockedLines),
    playsLeft: state.playsLeft,
    actionsLeft: state.actionsLeft
  };
}

function undoHumanTurn() {
  if (state.turn !== "red" || state.phase !== "playing" || !state.turnSnapshot) return;
  state.racks = structuredClone(state.turnSnapshot.racks);
  state.bags = structuredClone(state.turnSnapshot.bags);
  state.board = structuredClone(state.turnSnapshot.board);
  state.lockedLines = structuredClone(state.turnSnapshot.lockedLines);
  state.playsLeft = state.turnSnapshot.playsLeft;
  state.actionsLeft = state.turnSnapshot.actionsLeft;
  state.pendingPlacements = [];
  state.lastStartedEmptyX = null;
  state.selectedTileId = null;
  state.selectedActionId = null;
  state.replaceTileId = null;
  state.replaceUsesLeft = 0;
  setStatus("Turn reset. Your drawn tiles are still in your rack.");
  addLog("Red undid this turn's plays.");
  render();
}

function doSwap(color) {
  const rack = state.racks[color];
  const byRank = {};
  rack.filter((tile) => tile.type === "score" && tile.rank !== "Joker").forEach((tile) => {
    byRank[tile.rank] ||= [];
    byRank[tile.rank].push(tile);
  });
  Object.values(byRank).forEach((group) => {
    while (group.length >= 3) {
      const removed = group.splice(0, 3);
      state.racks[color] = state.racks[color].filter((tile) => !removed.includes(tile));
      state.bags[color].unshift(...removed);
      drawTiles(color, 3);
    }
  });
  state.bags[color] = shuffle(state.bags[color]);
}

function endHumanTurn(skipValidation = false) {
  if (state.turn !== "red") return;
  if (!skipValidation) {
    const valid = validateTurnEnd();
    if (!valid.ok) {
      setStatus(`${valid.reason} The opening play was returned to your rack.`);
      rollbackBadOpening();
      render();
      return;
    }
  }
  if (checkRoundEnd()) return;
  state.turn = "blue";
  state.phase = "cpu";
  state.selectedTileId = null;
  state.selectedActionId = null;
  state.replaceTileId = null;
  render();
  window.setTimeout(runCpuTurn, 600);
}

function runCpuTurn() {
  drawTiles("blue", 3);
  state.playsLeft = 3;
  state.actionsLeft = 3;
  const draw4 = state.racks.blue.find((tile) => tile.type === "action" && tile.kind === "draw4");
  if (draw4 && state.bags.blue.length > 12 && Math.random() > 0.45) {
    state.racks.blue = state.racks.blue.filter((tile) => tile.id !== draw4.id);
    drawTiles("blue", 4);
    addLog("Blue CPU used Draw 4.");
  }
  cpuTryReplace();
  for (let i = 0; i < 3; i += 1) {
    if (!cpuPlaceBestTile()) break;
  }
  cpuTryLock();
  addLog("Blue CPU ended its turn.");
  if (checkRoundEnd()) return;
  state.turn = "red";
  state.phase = "needDraw";
  state.playsLeft = 3;
  state.actionsLeft = 3;
  state.pendingPlacements = [];
  state.lastStartedEmptyX = null;
  render();
}

function cpuPlaceBestTile() {
  const scoringTiles = state.racks.blue.filter((tile) => tile.type === "score");
  const openCells = Object.keys(state.board).filter((cellId) => !state.board[cellId] && !isCellLocked(cellId));
  let best = null;
  scoringTiles.forEach((tile) => {
    openCells.forEach((cellId) => {
      const score = evaluatePlacement("blue", tile, cellId);
      if (score > (best?.score ?? -1)) best = { tile, cellId, score };
    });
  });
  if (!best || best.score < 0) return false;
  state.board[best.cellId] = best.tile;
  state.racks.blue = state.racks.blue.filter((tile) => tile.id !== best.tile.id);
  addLog(`Blue CPU placed ${best.tile.rank}.`);
  return true;
}

function evaluatePlacement(team, tile, cellId) {
  const cell = getCellDef(cellId);
  if (!cell || state.board[cellId] || isCellLocked(cellId)) return -1;
  if (cell.center && tile.rank === "Joker") return -1;
  if (cell.xType === "super" && cell.center && ["A", "K", "2", "Joker"].includes(tile.rank)) return -1;
  if (isXEmpty(cell.xId) && !cell.center) return -1;
  if (!placementFitsLine(tile, cellId).ok) return -1;
  state.board[cellId] = tile;
  let score = cell.center ? 7 : 1;
  getLinesForCell(cellId).forEach((line) => {
    const tiles = getLineTiles(line);
    if (tiles.every((lineTile) => tileColorForTeam(lineTile, team)) && isRankPattern(tiles)) score += tiles.length * 8;
    if (lineQualifiesForTeam(line, team)) score += 120;
    if (tiles.some((lineTile) => lineTile.color === "red") && tiles.some((lineTile) => lineTile.color === "blue")) score += 25;
  });
  if (xQualifiesForTeam(getXDef(cell.xId), team)) score += 320;
  state.board[cellId] = null;
  return score;
}

function cpuTryReplace() {
  const action = state.racks.blue.find((tile) => tile.type === "action" && tile.kind.includes("replace"));
  if (!action) return;
  const candidates = Object.entries(state.board).filter(([, tile]) => tile && tile.color === "red");
  const rackScores = state.racks.blue.filter((tile) => tile.type === "score");
  const target = candidates.find(([cellId, boardTile]) => !isCellLocked(cellId) && rackScores.some((tile) => tile.rank === boardTile.rank));
  if (!target) return;
  const [cellId, boardTile] = target;
  const replacement = rackScores.find((tile) => tile.rank === boardTile.rank);
  state.board[cellId] = replacement;
  state.racks.blue = state.racks.blue.filter((tile) => tile.id !== replacement.id && tile.id !== action.id);
  state.bags.red.unshift(boardTile);
  addLog(`Blue CPU used ${ACTIONS[action.kind].label}.`);
}

function cpuTryLock() {
  const lock = state.racks.blue.find((tile) => tile.type === "action" && tile.kind === "lock");
  if (!lock) return;
  const target = LINE_DEFS.find((line) => lineQualifiesForTeam(line, "blue") && !state.lockedLines[line.id] && !LINE_DEFS.some((other) => other.xId === line.xId && state.lockedLines[other.id]));
  if (!target) return;
  state.lockedLines[target.id] = "blue";
  state.racks.blue = state.racks.blue.filter((tile) => tile.id !== lock.id);
  addLog("Blue CPU locked a completed line.");
}

function checkRoundEnd() {
  const boardFull = Object.values(state.board).every(Boolean);
  const bagEmpty = !state.bags.red.length || !state.bags.blue.length;
  if (!boardFull && !bagEmpty) return false;
  const roundScore = scoreRound();
  state.scores.red += roundScore.red.total;
  state.scores.blue += roundScore.blue.total;
  addLog(`Round ${state.round} scored: Red ${roundScore.red.total}, Blue ${roundScore.blue.total}.`);
  if (state.round >= 3) {
    state.phase = "gameOver";
    const winner = state.scores.red === state.scores.blue ? "Tie game" : state.scores.red > state.scores.blue ? "Red wins" : "Blue CPU wins";
    setStatus(`${winner}. Final score Red ${state.scores.red}, Blue ${state.scores.blue}.`);
    render();
    return true;
  }
  state.round += 1;
  setupRound();
  return true;
}

function scoreRound() {
  return { red: scoreTeam("red"), blue: scoreTeam("blue") };
}

function scoreTeam(team) {
  const scoredCells = new Set();
  let total = 0;
  X_DEFS.forEach((x) => {
    if (xQualifiesForTeam(x, team)) {
      total += x.type === "super" ? 500 : 250;
      x.cells.forEach((cell) => {
        scoredCells.add(cell.id);
        total += TILE_POINTS[state.board[cell.id].rank];
      });
    }
  });
  LINE_DEFS.forEach((line) => {
    if (line.cells.every((cellId) => scoredCells.has(cellId))) return;
    if (lineQualifiesForTeam(line, team)) {
      total += line.points;
      line.cells.forEach((cellId) => {
        if (!scoredCells.has(cellId)) {
          scoredCells.add(cellId);
          total += TILE_POINTS[state.board[cellId].rank];
        }
      });
    }
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
  X_DEFS.forEach((x) => {
    const layout = BOARD_LAYOUT[x.id];
    const title = document.createElement("span");
    title.className = "board-label";
    title.dataset.x = x.id;
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
      if (isCellLocked(cell.id)) cellEl.classList.add("locked");
      if (!state.board[cell.id] && state.turn === "red" && state.phase === "playing") cellEl.classList.add("selectable");
      const tile = state.board[cell.id];
      if (tile) cellEl.append(renderTile(tile, false));
      cellEl.addEventListener("click", () => placeSelectedTile(cell.id));
      els.board.append(cellEl);
    });
  });
}

function renderRack() {
  els.rack.innerHTML = "";
  const groups = [
    {
      label: "Scoring",
      keys: [...RANKS, "Joker"],
      getTiles: (key) => state.racks.red.filter((tile) => tile.type === "score" && tile.rank === key),
      emptyTile: (key) => ({ id: `empty-score-${key}`, type: "score", color: key === "Joker" ? "joker" : "red", rank: key })
    },
    {
      label: "Actions",
      keys: Object.keys(ACTIONS),
      getTiles: (key) => state.racks.red.filter((tile) => tile.type === "action" && tile.kind === key),
      emptyTile: (key) => ({ id: `empty-action-${key}`, type: "action", kind: key })
    }
  ];
  groups.forEach((group) => {
    const groupEl = document.createElement("div");
    groupEl.className = "rack-group";
    const labelEl = document.createElement("span");
    labelEl.className = "rack-label";
    labelEl.textContent = group.label;
    const tilesEl = document.createElement("div");
    tilesEl.className = "rack-tiles";
    group.keys.forEach((key) => {
      const matchingTiles = group.getTiles(key);
      const tile = matchingTiles[0] || group.emptyTile(key);
      const tileEl = renderTile(tile, Boolean(matchingTiles.length));
      tileEl.classList.add("rack-slot");
      tileEl.classList.toggle("empty", !matchingTiles.length);
      tileEl.classList.toggle("stacked", matchingTiles.length > 1);
      tileEl.dataset.count = String(matchingTiles.length);
      tileEl.classList.toggle("selected", matchingTiles.some((item) => item.id === state.selectedTileId || item.id === state.selectedActionId || item.id === state.replaceTileId));
      tileEl.setAttribute("aria-label", `${group.label} ${tile.type === "action" ? ACTIONS[tile.kind].label : tile.rank}: ${matchingTiles.length}`);
      if (matchingTiles.length) {
        tileEl.addEventListener("click", () => selectRackTile(tile.id));
      }
      tilesEl.append(tileEl);
    });
    groupEl.append(labelEl, tilesEl);
    els.rack.append(groupEl);
  });
}

function renderTile(tile, asButton) {
  const el = document.createElement(asButton ? "button" : "div");
  const tileClass = tile.type === "action" ? "yellow" : tile.color;
  el.className = `tile ${tileClass}`;
  el.dataset.tile = tile.id;
  if (tile.type === "action") {
    el.innerHTML = `${ACTIONS[tile.kind].label}<small>Action</small>`;
  } else {
    el.innerHTML = `${tile.rank}<small>${tile.color === "joker" ? "Wild" : tile.color}</small>`;
  }
  return el;
}

function renderHud() {
  const liveRoundScore = state.phase === "gameOver" ? { red: { total: 0 }, blue: { total: 0 } } : scoreRound();
  const displayedRed = state.scores.red + liveRoundScore.red.total;
  const displayedBlue = state.scores.blue + liveRoundScore.blue.total;
  updateScoreBox(els.redScore, "red", displayedRed);
  updateScoreBox(els.blueScore, "blue", displayedBlue);
  els.roundLabel.textContent = `${state.round}/3`;
  els.playsLeft.textContent = state.phase === "playing" ? state.playsLeft : 3;
  els.actionsLeft.textContent = state.phase === "playing" ? state.actionsLeft : 3;
  els.turnTitle.textContent = getTurnTitle();
  document.querySelector(".rack-turn-card")?.classList.toggle("player-ready", state.turn === "red" && state.phase === "needDraw");
  els.drawPlayBtn.disabled = state.turn !== "red" || state.phase !== "needDraw";
  if (els.swapBtn) els.swapBtn.disabled = state.turn !== "red" || state.phase !== "needDraw";
  els.undoBtn.disabled = state.turn !== "red" || state.phase !== "playing";
  els.endTurnBtn.disabled = state.turn !== "red" || state.phase !== "playing";
  if (state.phase === "needDraw") setStatus("Draw 3 tiles, then play up to 3 scoring tiles and up to 3 action tiles.");
  if (state.phase === "cpu") setStatus("Blue CPU is thinking.");
  if (els.log) els.log.innerHTML = state.log.map((entry) => `<p>${entry}</p>`).join("");
}

function updateScoreBox(el, team, value) {
  if (Number(el.textContent) !== value) {
    el.textContent = value;
    if (value > state.displayedScores[team]) {
      el.closest(".score-pill").classList.remove("score-pop");
      void el.offsetWidth;
      el.closest(".score-pill").classList.add("score-pop");
    }
    state.displayedScores[team] = value;
  }
}

function getTurnTitle() {
  if (state.phase === "gameOver") return "Game over";
  if (state.turn === "blue") return "Blue CPU turn";
  if (state.phase === "needDraw") return "Red: draw to start";
  if (state.phase === "swap") return "Red: swapping";
  return "Red: play tiles";
}

els.drawPlayBtn.addEventListener("click", () => startHumanTurn("play"));
els.swapBtn?.addEventListener("click", () => startHumanTurn("swap"));
els.undoBtn.addEventListener("click", undoHumanTurn);
els.endTurnBtn.addEventListener("click", () => endHumanTurn(false));
els.rulesBtn.addEventListener("click", () => els.rulesDialog.showModal());
els.closeRulesBtn.addEventListener("click", () => els.rulesDialog.close());

setupRound();
