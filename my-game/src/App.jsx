import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// --- Configuration ---
const SPRITE_SHEET_SRC = '/icons/items.png';
const SPRITE_SIZE = 32; // The native size of one tile in the PNG
const SHEET_WIDTH = 352; // Total width of the PNG
// const SHEET_HEIGHT = 832; // Total height (not strictly needed for math if we just wrap cols)

// Derived constants
const COLS = SHEET_WIDTH / SPRITE_SIZE; // 11 columns based on your dimensions
const SCALE = 2; // Scale factor to make sprites larger on mobile screens

// --- Helper Components ---

/**
 * Sprite Component
 * Renders a single item from the sprite sheet based on an index.
 */
const Sprite = ({ index }) => {
  // Calculate the row and column in the sprite sheet for this index
  // Math: col = index % columns, row = floor(index / columns)
  const col = index % COLS;
  const row = Math.floor(index / COLS);

  // Calculate background position
  // We use negative values to "slide" the background image to the correct viewport
  const bgX = -(col * SPRITE_SIZE);
  const bgY = -(row * SPRITE_SIZE);

  return (
    <div
      className="relative bg-gray-300 rounded-sm overflow-hidden flex-shrink-0"
      style={{
        width: `${SPRITE_SIZE * SCALE}px`,
        height: `${SPRITE_SIZE * SCALE}px`,
        imageRendering: 'pixelated', // Crucial for crisp pixel art scaling
      }}
    >
      {/* This div handles the background image. 
        We separate it to allow scaling via background-size if needed, 
        but here we rely on the parent container size and transform/zoom 
        or just native sizing if we adjusted background-size.
        
        Method used here: Scale the visual container, scale the background size proportional to scale.
      */}
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `url(${SPRITE_SHEET_SRC})`,
          backgroundPosition: `${bgX * SCALE}px ${bgY * SCALE}px`,
          backgroundSize: `${SHEET_WIDTH * SCALE}px auto`, // Scale the entire sheet logic
        }}
      />
      
      {/* Fallback/Debug Overlay: Shows index if image fails or for debugging */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50 text-white text-[10px] font-mono pointer-events-none">
        {index}
      </div>
    </div>
  );
};

export default function App() {
  const [gridItems, setGridItems] = useState([]);

  // On mount, set items to: Row 0-15, Column 1 (2nd column)
  useEffect(() => {
    // Configuration for the specific request:
    const targetCol = 1; // "Column 2" is index 1 (0-based)
    
    // Create 16 items, iterating down the rows
    const items = Array.from({ length: 16 }, (_, row) => {
      // Formula: (Row * Total_Columns) + Column
      return (row * COLS) + targetCol;
    });

    setGridItems(items);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-800 select-none overflow-hidden">
      
      {/* 1. Slim Header Bar */}
      <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-10">
        <span className="font-bold text-slate-700 tracking-tight">GAME UI</span>
        <div className="w-6 h-6 rounded-full bg-slate-200" /> {/* Placeholder for user/menu icon */}
      </header>

      {/* 2. Blank Top Half */}
      <main className="flex-1 bg-slate-100 relative">
        {/* Intentionally left blank as requested */}
        <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-mono text-sm pointer-events-none">
          VIEWPORT
        </div>
      </main>

      {/* 3. Bottom Half (Grid) */}
      <section className="h-1/2 bg-white border-t border-slate-200 flex flex-col items-center justify-center p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        
        {/* Grid Container */}
        <div className="grid grid-cols-4 gap-4">
          {gridItems.map((spriteIndex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
              whileTap={{ scale: 0.9 }}
              className="cursor-pointer shadow-sm rounded-lg border border-slate-100 p-1 bg-slate-50"
              onClick={() => console.log(`Clicked slot ${i}, Sprite Index: ${spriteIndex}`)}
            >
              <Sprite index={spriteIndex} />
            </motion.div>
          ))}
        </div>
        
        <div className="mt-6 text-xs text-slate-400 font-mono uppercase tracking-widest">
          Inventory
        </div>
      </section>

    </div>
  );
}
