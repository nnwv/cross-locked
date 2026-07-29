# Cross Locked Lite

Cross Locked Lite is a two-round strategy tile game played in the browser. The human Red player competes against the Blue CPU by building matching-number sets and clean number sequences across five X-shaped boards.

## How to play

- Each X begins with a center tile numbered 3, 4, or 5.
- Draw once to start your turn, then place a playable Red tile. A fresh tile is drawn automatically after every placement.
- Tiles must touch an existing tile and continue either matching numbers or a clean sequence. Wild tiles can fill any legal neighboring space and become the number they represent.
- Random Red and Blue bombs remove one or two non-center tiles and end the current turn. You can also choose End Turn at any time after drawing.

## Scoring

- Short line: 250 points
- Long line: 500 points
- Small X: 1,000 points
- Big X: 2,000 points

A completed X receives its X bonus without additional line points. The board stays filled, and the game ends after two rounds.

## Run locally

This is a static HTML, CSS, and JavaScript project with no build step. Open `index.html` directly, or serve the folder with any local web server.

The current MVP supports single-player play against the CPU on desktop, tablet, and mobile browsers. Online multiplayer and saved player records are not included yet.