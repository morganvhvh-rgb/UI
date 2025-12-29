import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration ---
const SPRITE_SHEET_SRC = '/icons/items.png';
const SPRITE_SIZE = 32;
const SHEET_WIDTH = 352;
const COLS = SHEET_WIDTH / SPRITE_SIZE;
const SCALE = 1.6; // Default scale for generic sprites

// --- Monster Configuration ---
const MONSTER_SRC = '/icons/monsters.png';
const MONSTER_SHEET_WIDTH = 384;
const MONSTER_COLS = MONSTER_SHEET_WIDTH / SPRITE_SIZE;

// --- Helper Components ---
const Sprite = ({ index, bgClass, size = SPRITE_SIZE * SCALE, children, className = "" }) => {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const bgX = -(col * SPRITE_SIZE);
  const bgY = -(row * SPRITE_SIZE);

  // Calculate internal scale based on desired size vs sprite size
  const internalScale = size / SPRITE_SIZE;

  return (
    <div
      className={`relative rounded-sm overflow-hidden flex-shrink-0 ${bgClass || 'bg-gray-300'} ${className}`}
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
      {children}
    </div>
  );
};

// Component for Monster rendering
const MonsterSprite = ({ row, col, size = 128 }) => {
  const bgX = -(col * SPRITE_SIZE);
  const bgY = -(row * SPRITE_SIZE);
  const internalScale = size / SPRITE_SIZE;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${MONSTER_SRC})`,
          backgroundPosition: `${bgX * internalScale}px ${bgY * internalScale}px`,
          backgroundSize: `${MONSTER_SHEET_WIDTH * internalScale}px auto`,
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
    "Standard issue item found in most caches.",
    "Slightly damaged but still functional.",
    "High quality craftsmanship.",
    "Emits a faint glow in low light.",
    "Heavy but durable in combat.",
    "Needs identification.",
    "High trade value.",
    "Useful for crafting.",
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
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${colors[rarity] || colors.Common}`}>
      {rarity}
    </span>
  );
};

export default function App() {
  const [gridItems, setGridItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [keptItems, setKeptItems] = useState([]); // Stores up to 5 items

  useEffect(() => {
    const targetCol = 1; 
    // 4x3 grid = 12 items
    const items = Array.from({ length: 12 }, (_, row) => (row * COLS) + targetCol);
    setGridItems(items);
  }, []);

  const handleItemClick = (spriteIndex) => {
    const newItem = generateItemData(spriteIndex);
    
    if (selectedItem && selectedItem.id === newItem.id) {
      const isAlreadyKept = keptItems.find(k => k.id === newItem.id);
      
      if (!isAlreadyKept) {
        if (keptItems.length < 5) {
          setKeptItems(prev => [...prev, newItem]);
        } else {
          setKeptItems(prev => [...prev.slice(1), newItem]);
        }
      }
    } else {
      setSelectedItem(newItem);
    }
  };

  const removeKeptItem = (id, e) => {
    e.stopPropagation();
    setKeptItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    /* Outer Shell */
    <div className="fixed inset-0 w-full h-full bg-neutral-900 flex items-center justify-center overflow-hidden font-sans">
      
      {/* Device Frame */}
      <div className="w-full h-[100dvh] sm:w-[420px] sm:h-[800px] sm:max-h-[95vh] bg-slate-50 text-slate-800 select-none flex flex-col relative sm:rounded-[2rem] sm:border-[8px] sm:border-gray-800 sm:shadow-2xl overflow-hidden">
      
        {/* --- TOP HALF: SPLIT VIEWPORT --- */}
        <section className="h-1/2 flex flex-col bg-white relative overflow-hidden z-10">
          
          <header className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-30 flex-shrink-0 relative">
            <span className="font-bold text-slate-700 text-sm tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              GAME UI
            </span>
            <div className="flex gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            </div>
          </header>

          <main className="flex-1 w-full relative flex flex-row overflow-hidden">
            
            {/* LEFT: Mini Details */}
            <div className="w-1/2 h-full border-r border-slate-200 bg-slate-50 relative flex flex-col overflow-hidden">
               
               {/* 50% HEIGHT SPACER (For future content) */}
               <div className="h-1/2 w-full flex items-center justify-center border-b border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 opacity-50" />
               </div>

               {/* Scrollable Details Area - Starts at 50% mark */}
               <div className="h-1/2 px-4 py-4 flex flex-col overflow-y-auto no-scrollbar bg-white">
                 <AnimatePresence mode="wait">
                   {selectedItem ? (
                     <motion.div 
                        key={selectedItem.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col h-full"
                     >
                        <div className="flex items-start justify-between mb-1">
                          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest truncate max-w-[70%]">
                            {selectedItem.type}
                          </div>
                        </div>

                        <h2 className="font-serif font-bold text-lg text-slate-800 leading-tight mb-2">
                          {selectedItem.name}
                        </h2>
                        
                        <div className="mb-2">
                          <RarityBadge rarity={selectedItem.rarity} />
                        </div>

                        <p className="text-xs text-slate-600 font-sans leading-relaxed">
                          {selectedItem.description}
                        </p>
                     </motion.div>
                   ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 text-xs text-center px-2">
                      <p>Select an item.</p>
                      <p className="text-[10px] mt-1 opacity-70">Double-tap to keep.</p>
                    </div>
                   )}
                 </AnimatePresence>
               </div>
            </div>

            {/* RIGHT: Monster Viewport */}
            <div className="w-1/2 h-full bg-slate-100 relative flex items-center justify-center overflow-hidden">
               
               {/* Background */}
               <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-slate-100" />

               <div className="relative z-10 flex items-end justify-center pointer-events-none mb-6">
                 
                 {/* Enemy 1 (Left) - Z-INDEX 20 (In front), Negative Margin Increased */}
                 <motion.div
                    animate={{ y: [0, -6, 0], x: [-3, 3, -3] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className="flex flex-col items-center relative -mr-8 z-20"
                 >
                   <MonsterSprite row={3} col={1} size={64} />
                   <div className="w-10 h-2 bg-black/10 rounded-[50%] blur-sm mt-[-4px]" />
                 </motion.div>

                 {/* Enemy 2 (Center) - Z-INDEX 10 (Behind) */}
                 <motion.div
                    animate={{ y: [0, -10, 0], x: [2, -2, 2] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center relative mb-4 z-10"
                 >
                   <MonsterSprite row={4} col={3} size={72} />
                   <div className="w-12 h-2.5 bg-black/10 rounded-[50%] blur-sm mt-[-4px]" />
                 </motion.div>

                 {/* Enemy 3 (Right) - Z-INDEX 20 (In front), Negative Margin Increased */}
                 <motion.div
                    animate={{ y: [0, -7, 0], x: [-4, 4, -4] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="flex flex-col items-center relative -ml-8 z-20"
                 >
                   <MonsterSprite row={7} col={6} size={64} />
                   <div className="w-10 h-2 bg-black/10 rounded-[50%] blur-sm mt-[-4px]" />
                 </motion.div>
                 
               </div>
            </div>

          </main>
        </section>

        {/* --- BOTTOM HALF: INVENTORY --- */}
        <section className="h-1/2 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 flex flex-col relative overflow-hidden">
          
          <div className="w-full h-full overflow-hidden flex flex-col items-center p-0">
            
            {/* Kept Items Row - Fixed Height, Centered Content, Bottom Border */}
            <div className="h-24 w-full flex-shrink-0 border-b border-slate-100 flex items-center justify-center bg-slate-50/30 z-10">
              <div className="flex justify-center items-center gap-3">
                {[0, 1, 2, 3, 4].map((slotIndex) => {
                  const item = keptItems[slotIndex];
                  return (
                    <div 
                      key={slotIndex} 
                      className="w-12 h-12 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center relative overflow-hidden transition-all duration-200"
                    >
                      {item ? (
                        <motion.div
                          layoutId={`kept-${item.id}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="cursor-pointer w-full h-full flex items-center justify-center"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Sprite index={item.id} size={40} bgClass="bg-transparent" />
                          <button 
                            className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 flex items-center justify-center text-white font-bold text-xs"
                            onClick={(e) => removeKeptItem(item.id, e)}
                          >
                            x
                          </button>
                        </motion.div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-100" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inventory Grid - NO SCROLL, CENTERED */}
            <div className="flex-1 flex items-center justify-center w-full overflow-hidden min-h-0">
              <div className="grid grid-cols-4 gap-2">
                {gridItems.map((spriteIndex, i) => {
                  const isSelected = selectedItem && selectedItem.id === spriteIndex;
                  const isKept = keptItems.some(k => k.id === spriteIndex);
                  
                  return (
                    <motion.div
                      key={i}
                      layoutId={`item-${i}`}
                      // Removed generic color transition for INSTANT feel
                      className={`
                        cursor-pointer rounded-xl p-1 relative group
                        ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50 shadow-md z-10' : 'hover:bg-slate-50'}
                        ${isKept ? 'opacity-40 grayscale pointer-events-none' : ''}
                      `}
                      onClick={() => handleItemClick(spriteIndex)}
                    >
                      {/* Reduced Sprite Size to 1.75 to ensure 3 rows fit without scrolling */}
                      <Sprite index={spriteIndex} bgClass="bg-yellow-50" size={SPRITE_SIZE * 1.75} />
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer Label */}
            <div className="h-6 flex items-start justify-center text-[8px] text-slate-300 font-mono uppercase tracking-[0.2em] select-none pb-1 flex-shrink-0">
              Inventory // Bag 1
            </div>
            
          </div>
        </section>

      </div>
    </div>
  );
}
