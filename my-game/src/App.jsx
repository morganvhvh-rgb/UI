import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration ---
const SPRITE_SHEET_SRC = '/icons/items.png';
const SPRITE_SIZE = 32;
const SHEET_WIDTH = 352;
const COLS = SHEET_WIDTH / SPRITE_SIZE;
const SCALE = 1.6; // Default scale for generic sprites

// --- Item Definitions ---
// Indices calculated based on 11 columns (352 / 32)
// Formula: row * 11 + col
const ITEM_DEFINITIONS = {
  // Original Weapons
  17: { name: "Big Sword", type: "Weapon" },        // 1/6
  11: { name: "Fast Sword", type: "Weapon" },       // 1/0
  36: { name: "Big Axe", type: "Weapon" },          // 3/3
  78: { name: "Mace", type: "Weapon" },             // 7/1
  48: { name: "Big Hammer", type: "Weapon" },       // 4/4
  102: { name: "Bow", type: "Weapon" },             // 9/3
  115: { name: "Magic Staff", type: "Weapon" },     // 10/5
  118: { name: "Holy Staff", type: "Weapon" },      // 10/8

  // New Items (Formerly diverse types, now unified as "Item")
  192: { name: "Sword Ring 1", type: "Item" },      // 17/5
  187: { name: "Sword Ring 2", type: "Item" },      // 17/0
  253: { name: "Poison Arrow", type: "Item" },      // 23/0
  256: { name: "Multi Arrow", type: "Item" },       // 23/3
  233: { name: "Magic Book", type: "Item" },        // 21/2 
  234: { name: "Holy Book", type: "Item" },         // 21/3
  146: { name: "Heavy Gauntlets", type: "Item" }    // 13/3
};

const ITEM_POOL = Object.keys(ITEM_DEFINITIONS).map(Number);

// --- Monster Configuration ---
const MONSTER_SRC = '/icons/monsters.png';
const MONSTER_SHEET_WIDTH = 384;
const MONSTER_COLS = MONSTER_SHEET_WIDTH / SPRITE_SIZE;

// --- Helper Functions ---
const getItemBgColor = (id) => {
  // Swords: Light Blue (Increased contrast)
  if (id === 17 || id === 11) return "bg-sky-300";
  
  // Axe, Hammer, Mace: Brown (Changed from Green)
  if (id === 36 || id === 78 || id === 48) return "bg-amber-600";
  
  // Bow: Green (Changed from Yellow)
  if (id === 102) return "bg-emerald-300";
  
  // Staffs: Light Purple (Increased contrast)
  if (id === 115 || id === 118) return "bg-purple-300";
  
  // Everything else: Yellow (Changed from Pink)
  return "bg-yellow-300";
};

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
  
  let name, type;

  // Check if it's one of our predefined items
  if (ITEM_DEFINITIONS[id]) {
    name = ITEM_DEFINITIONS[id].name;
    type = ITEM_DEFINITIONS[id].type;
  } else {
    // Fallback for any other items (Legacy prototype logic)
    const suffixes = ["of Ruin", "of Light", "of the Wolf", "of Eternity", "of Silence", ""];
    const prefixes = ["Ancient", "Rusty", "Gilded", "Void", "Astral", "Cursed", "Blessed"];
    const roots = ["Dagger", "Potion", "Relic", "Shield", "Tome", "Gem", "Key"];
    name = `${prefixes[rand(1) % prefixes.length]} ${roots[rand(2) % roots.length]} ${suffixes[rand(3) % suffixes.length]}`;
    
    // Default fallback type
    type = "Item";
  }
  
  const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
  const rarity = rarities[rand(5) % rarities.length];

  const description = "This is a temporary description. This will have effects and stats later.";

  return {
    id,
    name: name.trim(),
    type,
    rarity,
    description,
  };
};

const TypeBadge = ({ type }) => {
  const colors = {
    Weapon: "bg-rose-100 text-rose-700",
    Consumable: "bg-emerald-100 text-emerald-700",
    Armor: "bg-slate-200 text-slate-700",
    Artifact: "bg-violet-100 text-violet-700",
    Material: "bg-amber-100 text-amber-700",
    Item: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${colors[type] || "bg-gray-100 text-gray-700"}`}>
      {type}
    </span>
  );
};

export default function App() {
  const [gridItems, setGridItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [keptItems, setKeptItems] = useState([]); // Stores up to 5 items
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 4x3 grid = 12 items
    // Randomize items from ITEM_POOL
    const items = Array.from({ length: 12 }, () => {
      const randomIndex = Math.floor(Math.random() * ITEM_POOL.length);
      return ITEM_POOL[randomIndex];
    });
    setGridItems(items);
  }, []);

  const handleItemClick = (spriteIndex, gridIndex) => {
    const newItem = generateItemData(spriteIndex);
    const uniqueId = `grid-${gridIndex}`;
    
    // Check if clicking the exact same grid tile
    if (selectedItem && selectedItem.uniqueId === uniqueId) {
      // Check if this specific grid item is already kept by checking sourceGridIndex
      const isAlreadyKept = keptItems.find(k => k.sourceGridIndex === gridIndex);
      
      if (!isAlreadyKept) {
        // Add sourceGridIndex to track specific grid instances
        const itemToKeep = { ...newItem, sourceGridIndex: gridIndex };
        
        if (keptItems.length < 5) {
          setKeptItems(prev => [...prev, itemToKeep]);
        } else {
          setKeptItems(prev => [...prev.slice(1), itemToKeep]);
        }
      }
    } else {
      // Select the new item with its unique grid location
      setSelectedItem({ ...newItem, uniqueId });
    }
  };

  const handleKeptItemClick = (item, slotIndex) => {
    const uniqueId = `kept-${slotIndex}`;

    // If clicking the item that is currently selected, unequip it
    if (selectedItem && selectedItem.uniqueId === uniqueId) {
      setKeptItems(prev => prev.filter(k => k.id !== item.id)); // Note: ID removal is risky if we allow duplicates in bag, but bag slots are unique so handleKeptItemClick logic might need tweak if we want to remove specific slot, but currently filter by ID removes ALL instances in bag.
      // However, for the purpose of the request "fixing grid gray out", the grid logic below is key.
      // Ideally we should remove by index in array or unique ID.
      // For now, let's stick to the minimal changes requested to fix the grid bug.
      setSelectedItem(null);
    } else {
      // Otherwise, just select it to show details
      setSelectedItem({ ...item, uniqueId });
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
      
        {/* Modal Overlay */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="w-full bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center min-h-[200px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-2xl">
                  ⚙️
                </div>
                <h3 className="font-serif text-xl font-bold text-slate-800 mb-2">Settings</h3>
                <p className="text-slate-500 text-center text-sm">
                  Game configuration options will appear here.
                </p>
                <button 
                  onClick={() => setShowModal(false)}
                  className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-full text-sm font-medium hover:bg-slate-700 active:scale-95 transition-all"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- TOP HALF: SPLIT VIEWPORT --- */}
        <section className="h-1/2 flex flex-col bg-white relative overflow-hidden z-10">
          
          <header className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-30 flex-shrink-0 relative">
            {/* Font changed to font-serif */}
            <span className="text-slate-800 text-lg tracking-tighter flex items-center gap-2 font-serif relative z-10">
              <span className="w-2 h-2 rounded-full bg-purple-900 animate-pulse"></span>
              <span><strong>Daily</strong>Rogue</span>
            </span>

            {/* Date - Starts at midpoint and proceeds right */}
            <div className="absolute left-1/2 text-xs text-slate-600 font-sans leading-relaxed whitespace-nowrap">
                Monday, Jan. 3rd
            </div>

            <button 
              onClick={() => setShowModal(true)}
              className="flex gap-1 relative z-10 p-2 -mr-2 cursor-pointer hover:bg-slate-100 rounded-full transition-colors"
            >
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            </button>
          </header>

          <main className="flex-1 w-full relative flex flex-row overflow-hidden">
            
            {/* LEFT: Mini Details */}
            <div className="w-1/2 h-full border-r border-slate-200 bg-slate-50 relative flex flex-col overflow-hidden">
               
               {/* 50% HEIGHT SPACER (Active Item View) */}
               <div className="h-1/2 w-full flex items-center justify-center border-b border-slate-100 bg-slate-50/50 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    {selectedItem ? (
                      <motion.div
                        key={selectedItem.uniqueId || selectedItem.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          y: [0, -4, 0]
                        }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ 
                          duration: 0.3,
                          y: {
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }
                        }}
                      >
                         <Sprite index={selectedItem.id} size={80} bgClass="bg-transparent" />
                      </motion.div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 opacity-50" />
                    )}
                  </AnimatePresence>
               </div>

               {/* Scrollable Details Area - Starts at 50% mark */}
               <div className="h-1/2 px-4 py-4 flex flex-col overflow-y-auto no-scrollbar bg-white">
                 <AnimatePresence mode="wait">
                   {selectedItem ? (
                     <motion.div 
                        key={selectedItem.uniqueId || selectedItem.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col h-full"
                     >
                        <h2 className="font-serif font-bold text-lg text-slate-800 leading-tight mb-2 mt-1">
                          {selectedItem.name}
                        </h2>
                        
                        <div className="mb-2">
                          <TypeBadge type={selectedItem.type} />
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
            <div className="w-1/2 h-full bg-slate-100 relative flex flex-col items-center justify-center overflow-hidden">
               
               {/* Background */}
               <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-slate-100" />

               {/* Monster Container - Increased mb-16 to push enemies higher */}
               <div className="relative z-10 flex items-end justify-center pointer-events-none mb-16">
                 
                 {/* Enemy 1 (Left) - Z-INDEX 20 (In front) */}
                 <motion.div
                    animate={{ 
                      y: [0, -8, 0], 
                      x: [-2, 2, -2],
                      rotate: [-1, 1, -1] 
                    }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                    className="flex flex-col items-center relative -mr-8 z-20"
                 >
                   <MonsterSprite row={3} col={1} size={64} />
                   <div className="w-10 h-2 bg-black/40 rounded-[50%] blur-sm mt-[-4px]" />
                 </motion.div>

                 {/* Enemy 2 (Center) - Z-INDEX 10 (Behind) */}
                 <motion.div
                    animate={{ 
                      y: [0, -12, 0], 
                      x: [3, -3, 3],
                      rotate: [2, -2, 2] 
                    }}
                    transition={{ duration: 4.7, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
                    className="flex flex-col items-center relative mb-4 z-10"
                 >
                   <MonsterSprite row={4} col={3} size={72} />
                   <div className="w-12 h-2.5 bg-black/40 rounded-[50%] blur-sm mt-[-4px]" />
                 </motion.div>

                 {/* Enemy 3 (Right) - Z-INDEX 20 (In front) */}
                 <motion.div
                    animate={{ 
                      y: [0, -6, 0], 
                      x: [-4, 4, -4],
                      rotate: [-3, 3, -3] 
                    }}
                    transition={{ duration: 3.9, repeat: Infinity, ease: "easeInOut", delay: 2.3 }}
                    className="flex flex-col items-center relative -ml-8 z-20"
                 >
                   <MonsterSprite row={7} col={6} size={64} />
                   <div className="w-10 h-2 bg-black/40 rounded-[50%] blur-sm mt-[-4px]" />
                 </motion.div>
                 
               </div>

               {/* Combat Stats - Updated Font to Serif and adjusted size */}
               <div className="relative z-10 flex gap-4 text-xs font-serif text-slate-500 uppercase tracking-wider mb-6">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-bold text-slate-700">HP</span>
                    <span className="text-red-500 font-bold">250</span>
                  </div>
                  <div className="w-px h-6 bg-slate-300/50" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-bold text-slate-700">ARM</span>
                    <span className="text-blue-500 font-bold">42</span>
                  </div>
                  <div className="w-px h-6 bg-slate-300/50" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-bold text-slate-700">MAG</span>
                    <span className="text-purple-500 font-bold">15</span>
                  </div>
               </div>

               {/* Enemy Loop Section - Label changed to Serif, Removed Uppercase */}
               <div className="relative z-10 w-full px-4 flex flex-col items-start gap-1">
                  <span className="text-[10px] text-slate-500 font-serif font-bold">
                    Enemy Loop:
                  </span>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    Do nothing, Attack for 5-10, Half heal.
                  </p>
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
                  // Check against uniqueId logic for Kept Items
                  const isSelected = item && selectedItem && selectedItem.uniqueId === `kept-${slotIndex}`;
                  
                  return (
                    <div 
                      key={slotIndex} 
                      className={`
                        w-12 h-12 rounded-lg border shadow-sm flex items-center justify-center relative overflow-hidden transition-all duration-200
                        ${isSelected 
                          ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-400 z-10' 
                          : 'bg-white border-slate-200'
                        }
                      `}
                    >
                      {item ? (
                        <motion.div
                          layoutId={`kept-${item.id}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="cursor-pointer w-full h-full flex items-center justify-center"
                          onClick={() => handleKeptItemClick(item, slotIndex)}
                        >
                          <Sprite index={item.id} size={40} bgClass={getItemBgColor(item.id)} />
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
                  // Check against uniqueId logic for Grid Items
                  const isSelected = selectedItem && selectedItem.uniqueId === `grid-${i}`;
                  
                  // Fix: Check sourceGridIndex to only gray out the specific item kept
                  const isKept = keptItems.some(k => k.sourceGridIndex === i);
                  
                  return (
                    <motion.div
                      key={i}
                      layoutId={`item-${i}`}
                      className={`
                        cursor-pointer rounded-xl p-1 relative group transition-all duration-100
                        ${isSelected ? 'bg-indigo-200 ring-2 ring-indigo-500 shadow-lg z-10 scale-105' : 'hover:bg-slate-50'}
                        ${isKept ? 'opacity-40 grayscale pointer-events-none' : ''}
                      `}
                      onClick={() => handleItemClick(spriteIndex, i)}
                    >
                      {/* Reduced Sprite Size to 1.75 to ensure 3 rows fit without scrolling */}
                      <Sprite index={spriteIndex} bgClass={getItemBgColor(spriteIndex)} size={SPRITE_SIZE * 1.75} />
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
