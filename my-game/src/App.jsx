import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration ---
const SPRITE_SHEET_SRC = '/icons/items.png';
const SPRITE_SIZE = 32;
const SHEET_WIDTH = 352;
const COLS = SHEET_WIDTH / SPRITE_SIZE;
const SCALE = 1.6; // Grid scale

// --- Helper Components ---
const Sprite = ({ index, bgClass, size = SPRITE_SIZE * SCALE }) => {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const bgX = -(col * SPRITE_SIZE);
  const bgY = -(row * SPRITE_SIZE);

  // Calculate internal scale based on desired size vs sprite size
  const internalScale = size / SPRITE_SIZE;

  return (
    <div
      className={`relative rounded-sm overflow-hidden flex-shrink-0 ${bgClass || 'bg-gray-300'}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated',
      }}
    >
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `url(${SPRITE_SHEET_SRC})`,
          backgroundPosition: `${bgX * internalScale}px ${bgY * internalScale}px`,
          backgroundSize: `${SHEET_WIDTH * internalScale}px auto`,
        }}
      />
    </div>
  );
};

// --- Mock Data Generator ---
const generateItemData = (id) => {
  const seed = id * 123456;
  const rand = (n) => Math.floor((Math.abs(Math.sin(seed + n) * 10000)));

  const prefixes = ["Ancient", "Rusty", "Gilded", "Void", "Astral", "Cursed", "Blessed"];
  const roots = ["Dagger", "Potion", "Relic", "Shield", "Tome", "Gem", "Key"];
  const suffixes = ["of Ruin", "of Light", "of the Wolf", "of Eternity", "of Silence", ""];
  
  const name = `${prefixes[rand(1) % prefixes.length]} ${roots[rand(2) % roots.length]} ${suffixes[rand(3) % suffixes.length]}`;
  
  const types = ["Weapon", "Consumable", "Armor", "Artifact", "Material"];
  const type = types[rand(4) % types.length];
  
  const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
  const rarity = rarities[rand(5) % rarities.length];

  const descriptions = [
    "A standard issue item found in most caches.",
    "Slightly damaged but still functional.",
    "High quality craftsmanship evident in the design.",
    "Emits a faint glow in low light conditions.",
    "Heavy to carry but durable in combat.",
    "Requires identification to determine full properties.",
    "Can be traded with local merchants for high value.",
    "Useful for crafting advanced equipment.",
  ];

  return {
    id,
    name: name.trim(),
    type,
    rarity,
    description: descriptions[rand(8) % descriptions.length],
  };
};

const RarityBadge = ({ rarity }) => {
  const colors = {
    Common: "bg-slate-200 text-slate-600",
    Uncommon: "bg-green-100 text-green-700",
    Rare: "bg-blue-100 text-blue-700",
    Epic: "bg-purple-100 text-purple-700",
    Legendary: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors[rarity] || colors.Common}`}>
      {rarity}
    </span>
  );
};

export default function App() {
  const [gridItems, setGridItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    // RESTORED: Original logic using targetCol = 1 to get the specific vertical strip of items
    const targetCol = 1; 
    const items = Array.from({ length: 16 }, (_, row) => (row * COLS) + targetCol);
    setGridItems(items);
  }, []);

  const handleItemClick = (spriteIndex) => {
    setSelectedItem(generateItemData(spriteIndex));
  };

  return (
    /* Outer Shell: Dark backdrop for desktop focus */
    <div className="fixed inset-0 w-full h-full bg-neutral-900 flex items-center justify-center overflow-hidden font-sans">
      
      {/* Device Frame */}
      <div className="w-full h-[100dvh] sm:w-[420px] sm:h-[800px] sm:max-h-[95vh] bg-slate-50 text-slate-800 select-none flex flex-col relative sm:rounded-[2rem] sm:border-[8px] sm:border-gray-800 sm:shadow-2xl overflow-hidden">
      
        {/* --- TOP HALF: SPLIT VIEWPORT --- */}
        <section className="h-1/2 flex flex-col bg-white relative overflow-hidden z-10">
          
          <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-30 flex-shrink-0 relative">
            <span className="font-bold text-slate-700 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              GAME UI
            </span>
            <div className="flex gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            </div>
          </header>

          <main className="flex-1 w-full relative flex flex-row overflow-hidden">
            
            {/* LEFT: Item Details */}
            {/* Added overflow-hidden to parent to force containment */}
            <div className="w-1/2 h-full border-r border-slate-200 bg-slate-50 relative flex flex-col overflow-hidden">
               
               {/* Removed overflow-y-auto to prevent scrollbars. Using flex-col justification to center content vertically. */}
               <div className="flex-1 p-4 flex flex-col justify-center">
                 <AnimatePresence mode="wait">
                   {selectedItem && (
                     <motion.div 
                        key={selectedItem.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-start"
                     >
                        {/* Smaller Type Label */}
                        <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">
                          {selectedItem.type}
                        </div>
                        
                        {/* Enlarged Sprite without box/border - Scaled down to 64px to save space */}
                        <div className="mb-2">
                           <Sprite 
                             index={selectedItem.id} 
                             size={64} 
                             bgClass="bg-transparent" 
                           />
                        </div>
                        
                        {/* Reduced Title Size */}
                        <h2 className="font-serif font-bold text-lg text-slate-800 leading-tight mb-2">
                          {selectedItem.name}
                        </h2>
                        
                        <div className="mb-2">
                          <RarityBadge rarity={selectedItem.rarity} />
                        </div>

                        {/* Smaller Description with line clamping to ensure no overflow */}
                        <p className="text-xs text-slate-600 font-sans leading-relaxed line-clamp-4">
                          {selectedItem.description}
                        </p>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
            </div>

            {/* RIGHT: World Viewport */}
            <div className="w-1/2 h-full bg-slate-100 relative flex items-center justify-center overflow-hidden">
               {/* Decorative Grid */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
               
               <div className="relative z-10 text-center">
                 <div className="w-16 h-16 bg-white rounded-full shadow-sm mx-auto mb-2 flex items-center justify-center text-2xl border border-slate-200">
                    🌍
                 </div>
                 <div className="text-slate-400 font-mono text-[10px] tracking-[0.2em] uppercase">
                   World View
                 </div>
               </div>
            </div>

          </main>
        </section>

        {/* --- BOTTOM HALF: INVENTORY --- */}
        <section className="h-1/2 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 flex flex-col relative overflow-hidden">
          
          <div className="w-full h-full overflow-hidden flex flex-col items-center justify-center p-2">
            
            <div className="grid grid-cols-4 gap-2 flex-shrink-0">
              {gridItems.map((spriteIndex, i) => {
                const isSelected = selectedItem && selectedItem.id === spriteIndex;
                
                const row = Math.floor(i / 4);
                let cellColor = 'bg-gray-300';
                if (row < 2) cellColor = 'bg-red-100';         
                else if (row === 2) cellColor = 'bg-blue-100'; 
                else if (row === 3) cellColor = 'bg-yellow-100';

                return (
                  <motion.div
                    key={i}
                    layoutId={`item-${i}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      borderColor: isSelected ? 'rgb(99 102 241)' : 'rgba(241, 245, 249, 1)'
                    }}
                    transition={{ delay: i * 0.02 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      cursor-pointer rounded-xl p-0.5 relative group
                      border-2 transition-colors duration-200 bg-slate-50
                      ${isSelected ? 'shadow-md ring-2 ring-indigo-100 ring-offset-2 z-10' : 'border-slate-100 shadow-sm hover:border-slate-300'}
                    `}
                    onClick={() => handleItemClick(spriteIndex)}
                  >
                    <Sprite index={spriteIndex} bgClass={cellColor} />
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-2 text-[10px] text-slate-300 font-mono uppercase tracking-[0.25em] text-center pb-2 select-none">
              Inventory // Bag 1
            </div>
            
          </div>
        </section>

      </div>
    </div>
  );
}
