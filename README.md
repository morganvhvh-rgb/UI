# Sprite index

A portrait catalog for the project's pixel sprites. The category menu opens all ten sprite sheets. Each numbered cell in the index can be selected for a larger preview. Food and Animals also show four randomly chosen sprites in small 3D environments; these scenes are for viewing only.

The single source of truth for sheet URLs, dimensions, and occupied cell counts is `src/sprites/atlas.ts`. The atlas currently indexes 2,008 sprites. Numbers are one-based: sprite 1 is the top-left cell, sprite 20 is the end of the first row, and sprite 21 starts the second row. Each sheet has 20 columns of 16-pixel cells. The UI, reusable `Sprite` component, and 3D previews all use the same atlas mapping.

```tsx
<Sprite category="Symbols" spriteNumber={22} size={64} />
```

Run locally with `npm install` and `npm run dev`.
