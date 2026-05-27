# Cross Locked MVP

This is a first playable MVP for Cross Locked as a responsive browser game. It is built with plain HTML, CSS, and JavaScript so it can run immediately on phones, tablets, and desktop browsers, and later be wrapped for iOS/Android with a tool such as Capacitor.

## Run Locally

Open `index.html` directly in a browser, or serve the folder:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then visit:

```text
http://127.0.0.1:4173/
```

## Implemented MVP Features

- Single-player Red vs Blue CPU.
- Five X board layout: four small Xs and one center Super X.
- Small Xs use two 3-tile lines. The Super X uses two 5-tile lines.
- Three-round game with cumulative scoring.
- Red and Blue scoring tile bags using ranks 2 through A plus jokers.
- Yellow action tiles: Lock, Unlock, Replace 1, Replace 2, Super Replace, Draw 4.
- Draw and Play turn flow.
- Draw and Swap for groups of three matching scoring tiles.
- Touch-first tile selection and board placement.
- Basic computer opponent that draws, places, replaces, and locks.
- Round scoring for completed Xs, completed lines, and tile values.
- Responsive UI for tablet and phone widths.

## Rule Assumptions

The instructions describe five Xs, short lines, long lines, and a large Super X, but do not include a board diagram. This MVP assumes:

- Each small X has five playable spaces: four corners plus center.
- The Super X has nine playable spaces: two 5-tile diagonal lines sharing the center.
- A completed X requires all spaces in that X to be filled by one team color or jokers, and both diagonal lines must be a valid sequence or like-kind group.
- A locked line prevents play or replacement on any cell in that line.

These are good enough for a playable MVP, but the real board art should be confirmed before production.

## Next Production Steps

- Confirm the exact board diagram and line definitions with the client.
- Add a guided tutorial using the hint document content.
- Improve CPU strategy after the physical game is play-tested.
- Split game rules into a separate module before online multiplayer work.
- Add saved games and app-shell packaging for iOS/Android.
