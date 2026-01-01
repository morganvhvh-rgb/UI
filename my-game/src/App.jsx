import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, RefreshCw, FlaskRound, User } from 'lucide-react';

// --- Configuration ---
const SPRITE_SHEET_SRC = '/icons/items.png';
const SPRITE_SIZE = 32;
const SHEET_WIDTH = 352;
const COLS = SHEET_WIDTH / SPRITE_SIZE;
const SCALE = 1.6; // Default scale for generic sprites

// --- Item Definitions ---
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

  // New Items
  192: { name: "Sword Ring 1", type: "Item" },      // 17/5
  187: { name: "Sword Ring 2", type: "Item" },      // 17/0
  253: { name: "Poison Arrow", type: "Item" },      // 23/0
  256: { name: "Multi Arrow", type: "Item" },       // 23/3
  233: { name: "Magic Book", type: "Item" },        // 21/2 
  234: { name: "Holy Book", type: "Item" },         // 21/3
  146: { name: "Gauntlets", type: "Item" }          // 13/3 
};

const ITEM_POOL = Object.keys(ITEM_DEFINITIONS).map(Number);

// --- Monster Configuration ---
const MONSTER_SRC = '/icons/monsters.png';
const MONSTER_SHEET_WIDTH = 384;

// --- Rogue Configuration ---
const ROGUE_SRC = '/icons/rogues.png';
const ROGUE_SHEET_WIDTH = 224;
const ROGUE_SPRITE_SIZE = 32;

// --- Helper Functions ---
const getItemBgColor = (id) => {
  // Switched to '100' values for lower contrast/more subtle look
  if (id === 17 || id === 11) return "bg-sky-100";
  if (id === 36 || id === 78 || id === 48) return "bg-orange-100";
  if (id === 102) return "bg-emerald-100";
  if (id === 115 || id === 118) return "bg-purple-100";
  return "bg-yellow-100";
};

// --- Helper Components ---
const Sprite = ({ index, bgClass, size = SPRITE_SIZE * SCALE, className = "" }) => {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  
  const bgX = -(col * SPRITE_SIZE);
  const bgY = -(row * SPRITE_SIZE);

  // Internal math to map the desired display size to the sprite sheet scale
  const internalScale = size / SPRITE_SIZE;

  return (
    <div
      className={`relative rounded-sm overflow-hidden flex-shrink-0 flex items-center justify-center ${bgClass || 'bg-gray-200'} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${SPRITE_SHEET_SRC})`,
          backgroundPosition: `${bgX * internalScale}px ${bgY * internalScale}px`,
          backgroundSize: `${SHEET_WIDTH * internalScale}px auto`,
          imageRendering: 'pixelated',
          // UPDATED: 0px blur for pixelated look, 2px offset for tighter shadow, 0.6 opacity for darkness
          filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.6))' 
        }}
      />
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

// Component for Rogue rendering
const RogueSprite = ({ row, col, size = 128 }) => {
  const bgX = -(col * ROGUE_SPRITE_SIZE);
  const bgY = -(row * ROGUE_SPRITE_SIZE);
  const internalScale = size / ROGUE_SPRITE_SIZE;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${ROGUE_SRC})`,
          backgroundPosition: `${bgX * internalScale}px ${bgY * internalScale}px`,
          backgroundSize: `${ROGUE_SHEET_WIDTH * internalScale}px auto`,
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

  if (ITEM_DEFINITIONS[id]) {
    name = ITEM_DEFINITIONS[id].name;
    type = ITEM_DEFINITIONS[id].type;
  } else {
    const suffixes = ["of Ruin", "of Light", "of the Wolf", "of Eternity", "of Silence", ""];
    const prefixes = ["Ancient", "Rusty", "Gilded", "Void", "Astral", "Cursed", "Blessed"];
    const roots = ["Dagger", "Potion", "Relic", "Shield", "Tome", "Gem", "Key"];
    name = `${prefixes[rand(1) % prefixes.length]} ${roots[rand(2) % roots.length]} ${suffixes[rand(3) % suffixes.length]}`;
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
  const [keptItems, setKeptItems] = useState([]); 
  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false); 
  
  // Stats State
  const [flaskCount, setFlaskCount] = useState(3);
  const [rerollCount, setRerollCount] = useState(3);
  const [turnCount, setTurnCount] = useState(5);

  useEffect(() => {
    const items = Array.from({ length: 12 }, () => {
      const randomIndex = Math.floor(Math.random() * ITEM_POOL.length);
      return ITEM_POOL[randomIndex];
    });
    setGridItems(items);
  }, []);

  const handleItemClick = (spriteIndex, gridIndex) => {
    const newItem = generateItemData(spriteIndex);
    const uniqueId = `grid-${gridIndex}`;
    
    if (selectedItem && selectedItem.uniqueId === uniqueId) {
      const isAlreadyKept = keptItems.find(k => k.sourceGridIndex === gridIndex);
      
      if (!isAlreadyKept) {
        const itemToKeep = { ...newItem, sourceGridIndex: gridIndex };
        
        if (keptItems.length < 5) {
          setKeptItems(prev => [...prev, itemToKeep]);
        } else {
          setKeptItems(prev => [...prev.slice(1), itemToKeep]);
        }
      }
    } else {
      setSelectedItem({ ...newItem, uniqueId });
    }
  };

  const handleKeptItemClick = (item, slotIndex) => {
    const uniqueId = `kept-${slotIndex}`;
    if (selectedItem && selectedItem.uniqueId === uniqueId) {
      setKeptItems(prev => prev.filter(k => k.sourceGridIndex !== item.sourceGridIndex));
      setSelectedItem(null);
    } else {
      setSelectedItem({ ...item, uniqueId });
    }
  };

  const rerollItems = () => {
    if (rerollCount > 0) {
      setRerollCount(prev => prev - 1);
      const newItems = Array.from({ length: 12 }, () => {
        const randomIndex = Math.floor(Math.random() * ITEM_POOL.length);
        return ITEM_POOL[randomIndex];
      });
      setGridItems(newItems);
      setSelectedItem(null);
    }
  };

  const useFlask = () => {
    if (flaskCount > 0) {
      setFlaskCount(prev => prev - 1);
      // Logic for using flask would go here
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-neutral-900 flex items-center justify-center overflow-hidden font-sans">
      
      <div className="w-full h-[100dvh] sm:w-[420px] sm:h-[800px] sm:max-h-[95vh] bg-slate-50 text-slate-800 select-none flex flex-col relative sm:rounded-[2rem] sm:border-[8px] sm:border-gray-800 sm:shadow-2xl overflow-hidden">
      
        {/* Settings Modal Overlay */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
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

        {/* User Modal Overlay */}
        <AnimatePresence>
          {showUserModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
              onClick={() => setShowUserModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                // UPDATED: Matched Settings modal layout (centered flex col)
                className="w-full bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center min-h-[200px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full flex-1 flex flex-row items-center">
                  {/* Left: Rogue Character with Animation */}
                  <div className="w-1/2 flex flex-col items-center justify-center">
                     <motion.div
                        animate={{ 
                          y: [0, -6, 0], 
                          scale: [1, 1.05, 1] 
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="flex flex-col items-center relative z-10"
                     >
                       {/* No border, just the sprite and shadow */}
                       <RogueSprite row={0} col={2} size={96} />
                       <div className="w-14 h-2 bg-black/30 rounded-[50%] blur-[2px] mt-[-2px]" />
                     </motion.div>
                     <span className="font-serif font-bold text-slate-800 mt-2">The Rogue</span>
                  </div>

                  {/* Right: Blank */}
                  <div className="w-1/2 h-full">
                    {/* Intentionally blank as requested */}
                  </div>
                </div>

                <button 
                  onClick={() => setShowUserModal(false)}
                  // UPDATED: Dark purple color matching button, centered at bottom
                  className="mt-6 px-6 py-2 bg-[#2a0a36] text-white rounded-full text-sm font-medium hover:opacity-90 active:scale-95 transition-all"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- TOP HALF --- */}
        <section className="h-1/2 flex flex-col bg-white relative overflow-hidden z-10">
          <header className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-30 flex-shrink-0 relative">
            <span className="text-slate-800 text-base tracking-tighter flex items-center gap-2 font-serif relative z-10">
              <span><strong>Daily</strong>Rogue</span>
            </span>
            <div className="absolute left-1/2 -translate-x-1/2 text-xs text-slate-600 font-sans leading-relaxed whitespace-nowrap">
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
               <div className="h-1/2 w-full border-b border-slate-100 overflow-hidden relative bg-slate-50/50">
                  <AnimatePresence mode="wait">
                    {selectedItem ? (
                      <motion.div
                        key={selectedItem.uniqueId || selectedItem.id}
                        className={`absolute inset-0 flex items-center justify-center ${getItemBgColor(selectedItem.id)}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                         <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2, delay: 0.05 }}
                         >
                            <motion.div
                                animate={{ 
                                  y: [0, -4, 0],
                                  scale: [1, 1.1, 1] 
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Sprite index={selectedItem.id} size={120} bgClass="bg-transparent" />
                            </motion.div>
                         </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="empty"
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* NEW USER BUTTON POSITION: Top Left Quadrant (Symbol Display), Bottom Left Corner */}
                  <div className="absolute bottom-2 left-2 z-20">
                     <motion.button
                       whileTap={{ scale: 0.9 }}
                       onClick={() => setShowUserModal(true)}
                       // Darker purple theme: bg-[#2a0a36]
                       className="w-8 h-8 rounded bg-[#2a0a36] text-white flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
                     >
                       <User size={16} />
                     </motion.button>
                  </div>
               </div>

               {/* Details Text Area - Custom parchment background */}
               <div className="h-1/2 px-4 pt-2 pb-16 flex flex-col overflow-y-auto no-scrollbar bg-[#eaddcf] relative">
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
                        <h2 className="font-serif font-bold text-base text-slate-800 leading-tight mb-1 mt-1">
                          {selectedItem.name}
                        </h2>
                        <div className="mb-1">
                          <TypeBadge type={selectedItem.type} />
                        </div>
                        <p className="text-xs text-slate-700 font-sans leading-relaxed">
                          {selectedItem.description}
                        </p>
                     </motion.div>
                   ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs text-center px-2">
                      <p>Tap a symbol on the grid.</p>
                      <p className="mt-1">Tap again to keep it.</p>
                    </div>
                   )}
                 </AnimatePresence>
               </div>
            </div>

            {/* RIGHT: Monster Viewport */}
            <div className="w-1/2 h-full bg-slate-100 relative flex flex-col items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-slate-100" />
               <div className="relative z-10 flex items-end justify-center pointer-events-none mb-4">
                 <motion.div
                    animate={{ 
                      y: [0, -8, 0], 
                      rotate: [0, 2, 0, -2, 0],
                      scale: [1, 1.02, 1] 
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center relative z-10"
                 >
                   {/* Changed to row 4, col 2 */}
                   <MonsterSprite row={4} col={2} size={112} />
                   <div className="w-20 h-3 bg-black/40 rounded-[50%] blur-sm mt-[-6px]" />
                 </motion.div>
               </div>

               <div className="relative z-10 flex gap-4 text-xs font-serif text-slate-500 uppercase tracking-wider mb-6">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-bold text-slate-700">MAG</span>
                    <span className="text-purple-500 font-bold">250</span>
                  </div>
                  <div className="w-px h-6 bg-slate-300/50" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-bold text-slate-700">ARM</span>
                    <span className="text-blue-500 font-bold">250</span>
                  </div>
                  <div className="w-px h-6 bg-slate-300/50" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="font-bold text-slate-700">HP</span>
                    <span className="text-red-500 font-bold">250</span>
                  </div>
               </div>

               <div className="relative z-10 w-full px-4 pb-8 flex flex-col items-start gap-1">
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

        {/* --- CENTRAL ACTION BUTTONS --- */}
        
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto"> 
            <motion.button
                disabled={flaskCount === 0}
                whileTap={flaskCount > 0 ? { scale: 0.9, rotate: -45 } : {}}
                className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg transition-colors duration-200
                  ${flaskCount > 0 ? 'bg-pink-900 cursor-pointer' : 'bg-slate-300 cursor-not-allowed text-slate-100'}
                `}
                onClick={useFlask}
            >
                <FlaskRound size={18} />
            </motion.button>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto flex items-center justify-center">
          <AnimatePresence>
            {keptItems.length === 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.4, scale: 1, rotate: 360 }} 
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  opacity: { duration: 0.3 },
                  scale: { duration: 0.3 },
                  rotate: { duration: 4, repeat: Infinity, ease: "linear" } 
                }}
                className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-amber-300 via-red-500 to-transparent blur-[1px]"
              />
            )}
          </AnimatePresence>

          <motion.button
            disabled={keptItems.length < 5}
            animate={keptItems.length === 5 ? { scale: 1.1 } : { scale: 1 }}
            whileHover={keptItems.length === 5 ? { scale: 1.15 } : {}}
            whileTap={{ scale: 0.9 }}
            className={`
              w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 relative z-10
              ${keptItems.length === 5 
                ? 'bg-gradient-to-b from-red-500 to-red-700 cursor-pointer' 
                : 'bg-slate-300 cursor-not-allowed'
              }
            `}
            onClick={() => {
              if (keptItems.length === 5) {
                setTimeout(() => {
                   setKeptItems([]); 
                   setSelectedItem(null);
                }, 150);
              }
            }}
          >
            <Sword 
              size={28} 
              // Changed deactivated color to text-slate-400 (lighter gray)
              className={`transition-colors duration-300 ${keptItems.length === 5 ? 'text-white' : 'text-slate-400'}`} 
              strokeWidth={2.5}
            />
          </motion.button>
        </div>

        <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto"> 
            <motion.button
                disabled={rerollCount === 0}
                whileTap={rerollCount > 0 ? { scale: 0.9, rotate: -45 } : {}}
                className={`w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg transition-colors duration-200
                  ${rerollCount > 0 ? 'bg-blue-950 cursor-pointer' : 'bg-slate-300 cursor-not-allowed text-slate-100'}
                `}
                onClick={rerollItems}
            >
                <RefreshCw size={18} />
            </motion.button>
        </div>

        {/* --- BOTTOM HALF: INVENTORY --- */}
        <section className="h-1/2 bg-slate-900 border-t border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 flex flex-col relative overflow-hidden">
          
          <div className="w-full h-full overflow-hidden flex flex-col items-center p-0">
            
            {/* Kept Items Row */}
            <div className="h-24 w-full flex-shrink-0 border-b border-slate-800 flex items-center justify-center bg-slate-800/30 z-10">
              <div className="flex justify-center items-center gap-3 pt-6">
                {[0, 1, 2, 3, 4].map((slotIndex) => {
                  const item = keptItems[slotIndex];
                  const isSelected = item && selectedItem && selectedItem.uniqueId === `kept-${slotIndex}`;
                  
                  // UPDATED: Dark background for empty slots
                  const slotBgClass = item ? getItemBgColor(item.id) : 'bg-slate-800';
                  
                  return (
                    <div 
                      key={slotIndex} 
                      className={`
                        w-12 h-12 rounded-lg border shadow-sm flex items-center justify-center relative overflow-hidden transition-all duration-200
                        ${isSelected 
                          ? `border-teal-600 ring-2 ring-teal-500 z-10 ${slotBgClass}` 
                          : `${slotBgClass} border-slate-700`
                        }
                      `}
                    >
                      {item ? (
                        <motion.div
                          layoutId={`kept-instance-${item.sourceGridIndex}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="cursor-pointer w-full h-full flex items-center justify-center"
                          onClick={() => handleKeptItemClick(item, slotIndex)}
                        >
                          <Sprite index={item.id} size={40} bgClass="bg-transparent" />
                        </motion.div>
                      ) : (
                        <span className="text-slate-600 font-serif font-bold text-lg select-none">
                          {slotIndex + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inventory Grid */}
            <div className="flex-1 flex items-center justify-center w-full overflow-hidden min-h-0">
              <div className="grid grid-cols-4 gap-2">
                {gridItems.map((spriteIndex, i) => {
                  const isSelected = selectedItem && selectedItem.uniqueId === `grid-${i}`;
                  const isKept = keptItems.some(k => k.sourceGridIndex === i);
                  
                  return (
                    <motion.div
                      key={i}
                      layoutId={`grid-item-${i}`}
                      // UPDATED: Removed padding (p-1) and bg-indigo-200 to make border hug the sprite
                      // UPDATED: Changed Selection to Teal
                      className={`
                        cursor-pointer rounded-sm relative group transition-all duration-100
                        ${isSelected ? 'ring-2 ring-teal-500 shadow-lg z-10 scale-105' : 'hover:shadow-md'}
                        ${isKept ? 'opacity-40 grayscale pointer-events-none' : ''}
                      `}
                      onClick={() => handleItemClick(spriteIndex, i)}
                    >
                      <Sprite index={spriteIndex} bgClass={getItemBgColor(spriteIndex)} size={SPRITE_SIZE * 1.75} />
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* UPDATED: Dynamic stats from state */}
            <div className="h-8 flex items-center justify-center gap-4 text-xs text-slate-500 font-mono uppercase tracking-widest select-none flex-shrink-0">
              <span>Flasks: <span className="text-slate-300">{flaskCount}</span></span>
              <span>|</span>
              <span>Turns: <span className="text-slate-300">{turnCount}</span></span>
              <span>|</span>
              <span>Rerolls: <span className="text-slate-300">{rerollCount}</span></span>
            </div>
            
          </div>
        </section>

      </div>
    </div>
  );
}
