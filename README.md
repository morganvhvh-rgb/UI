# EXP prototype

A React/Vite workspace for mobile game and UI interaction experiments.

## Current experiment

The screen is a black portrait canvas with a contained, right-side vertical sprite carousel. It loops continuously through 40 food sprites, uses fluid distance-based emphasis around the current center, supports mouse grab-scrolling on desktop, and preserves native touch momentum for fast mobile flings.

## Addressing rule

Sprite numbers are always **one-based** for human-facing requests:

- `Symbols 1` is the top-left sprite.
- `Symbols 20` is the last sprite in the first row.
- `Symbols 21` is the first sprite in the second row.
- `Symbols 22` is the second sprite in the second row.

Every sheet has 20 columns. Internal atlas math converts the requested number to a zero-based index; callers never need to do that conversion.

```tsx
<Sprite category="Symbols" spriteNumber={22} size={64} />
```

The reusable sprite component lives in `src/sprites/Sprite.tsx`. Sheet metadata and item counts live in `src/sprites/atlas.ts`.

## Run it

```bash
npm install
npm run dev
```

Phaser or Three.js can be added later if a prototype's gameplay needs one; the sprite addressing layer can stay the same.
