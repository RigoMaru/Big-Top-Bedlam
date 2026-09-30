# Big Top Bedlam

A fast circus platformer inspired by the NES classic *Circus Charlie*, rebuilt with painted lighting, real particle fire and a retro video-game soundtrack that comes in two mixes.

You control the performer directly: run forward and back, jump, duck, dash and parry. The hazards come at you too, so every jump is a timing decision.

## The show

| Act | Stage | What you face |
| --- | --- | --- |
| I | **Ring of Fire** | Ride the lion through flaming hoops, over fire braziers, and under cannon fire |
| II | **The High Wire** | Monkeys in stacks of two or three, monkeys leapfrogging each other, swinging sandbags, crows |
| III | **Ball Bedlam** | Balls roll around on their own; stand on one and roll it forward or back, then hop to the next ball above a floor of tacks |

Each act has a mid-point checkpoint, a graded results card (A+ to C) and music that speeds up on the final stretch.

## Controls

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Move | ← → or A D | Left stick / D-pad |
| Jump (hold for higher) | ↑, Space, W or Z | A |
| Duck | ↓ or S | Down |
| Dash (ground or air) | Shift or X | X / RB |
| Showstopper super (5 cards) | C or E | Y |
| Pause / Sound | P or Esc / M | Start |
| Switch music mix | T | |

**Parry:** pink things (money bags, pink monkeys, balloons) can be parried. Press Jump again while touching them in mid-air for a bounce, 500 points and a super card.

On phones, on-screen buttons appear automatically. Landscape works best.

## Run it

It is a static site with no build step. Any static server works:

```bash
npx serve .
```

Then open the printed local address. Opening `index.html` straight from disk also works in most browsers.

Add `#autoplay-stage0`, `#autoplay-stage1` or `#autoplay-stage2` to the URL for a hands-free demo of an act.

## How it is made

Everything is generated in code at load time. The game uses no image or audio files.

- **Art** (`src/art-chars.js`, `src/art-world.js`): the lion, clown, monkeys, crows and a crowd of 40 individually drawn spectators are painted with gradients, fur strokes and rim lighting, then baked into animation frames (a 16-frame gallop, a 12-frame run and more). Fire uses additive particles plus painted flame tongues, embers and smoke.
- **Music** (`src/audio.js`): an original tune with a circus theme and a heroic minor-key B section, synthesized live with the Web Audio API in two mixes. **Chiptune** is a pure NES-style instrumental: pulse-wave leads with vibrato and echo, fast chord arpeggios, a triangle bass and noise drums. **Chip-EDM** layers house kicks, claps, a sidechained sub, stabs, risers and drops on top. The tempo climbs on the final stretch of each act.
- **Game** (`src/game.js`): physics, stages, scoring, HUD, curtain transitions and the render pipeline.
- `dev/sheet.html` renders a character sprite sheet for art review.
