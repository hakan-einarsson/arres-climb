# Arre's Climb

A 3D isometric platforming adventure built for the **[js13kGames](https://js13kgames.com/)** competition (zipped package ≤ 13 KB).

---

## Story

> *"Eleven coins can wake the unicorn who paints the sky. Help Arre climb and find them all."*

Guide Arre through 11 challenging isometric levels filled with vertical climbs, floating cloud paths, rainbow bounce blocks, and moving platforms to collect every coin and awaken the painted sky!

---

## How to Play & Controls

### Keyboard (Desktop)
| Action | Key |
|---|---|
| **Move** | `W` `A` `S` `D` or `Arrow Keys` |
| **Jump** | `Space` |
| **Rotate Camera** | `Q` / `E` (90° snaps) |
| **Zoom In / Out** | `+` (or `=`) / `-` |
| **Mute / Unmute Audio** | `M` |

### Touch Controls (Mobile)
* **Virtual Joystick**: Drag the bottom-left D-pad to move.
* **JUMP Button**: Tap the green button on the bottom-right to jump.
* **`<` / `>` Buttons**: Rotate the camera view.
* **`+` / `-` Buttons**: Zoom camera in or out.
* **`M` Button**: Toggle audio mute.

### Gamepad (Controller)
* **Left Stick / D-Pad**: Move Arre
* **Button A (Cross / South)**: Jump
* **L1 / R1 (Bumpers)**: Rotate Camera
* **Button B / X**: Zoom In / Zoom Out

---

## Game Mechanics & Blocks

* **Terrain Blocks**: Procedurally textured grass, rock, and snow cliffs.
* **Rainbow Bounce Blocks**: High-velocity bounce pads that launch Arre skyward.
* **Moving Platforms**: Sliding blocks that move across X and Z axes to transport Arre or crush obstacles.
* **Cloud Blocks**: Floating semi-transparent sky paths.
* **Golden Coins**: Goal of each level; collecting the 11th coin completes the game and reveals the painted sky ending!
* **Speedrun Timer**: Invisible run timer that records your best completion time locally (`ac_best`) and displays it on the start and victory screens.

---

## Built-in Level Editor

The project includes an in-browser level editor:
* Start the development server (`npm run dev`) and navigate to `http://localhost:5173/editor.html`.
* Real-time terrain generation, block placement/removal, moving platform configuration, and playtesting.

---

## Technical Highlights

* **Custom WebGL2 Rendering Engine**: Lightweight shader-based renderer with perspective isometric projection, depth sorting, and sprite atlas sampling.
* **Audio Engine**: Inlined ZzFX micro-synthesizer paired with a procedural 4-channel chiptune music engine (Bass, Arpeggios, Lead, Drums).
* **Zero External Runtime Dependencies**: Pure vanilla JavaScript and WebGL2.
* **Size Optimization**: Minified with aggressive Terser rules and packed with **Roadroller** to fit under 13,312 bytes.

---

## Development & Build

```bash
# Install dependencies
npm install

# Start local dev server (Game: index.html, Editor: editor.html)
npm run dev

# Build and package the production zip (dist/index.zip)
npm run build

# Preview production build locally
npm run preview
```

---
