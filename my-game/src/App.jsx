import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion';
import { Sword, RefreshCw, FlaskRound, User } from 'lucide-react';

// --- Configuration ---
const SPRITE_SHEET_SRC = '/icons/items.png';
const SPRITE_SIZE = 32;
const SHEET_WIDTH = 352;
const COLS = SHEET_WIDTH / SPRITE_SIZE; // 11 columns
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
  146: { name: "Gauntlets", type: "Armor" },        // 13/3 
  
  // New Additions
  122: { name: "Heavy Shield", type: "Armor" },     // 11/1
  276: { name: "Bread", type: "Food" },             // 25/1
  277: { name: "Tomato", type: "Food" },            // 25/2

  // Flask
  210: { name: "Flask", type: "Item" }
};

const ITEM_POOL = Object.keys(ITEM_DEFINITIONS).filter(id => id !== "210").map(Number);

// --- Monster Configuration ---
const MONSTER_SRC = '/icons/monsters.png';
const MONSTER_SHEET_WIDTH = 384;

// --- Rogue Configuration ---
const ROGUE_SRC = '/icons/rogues.png';
const ROGUE_SHEET_WIDTH = 224;
const ROGUE_SPRITE_SIZE = 32;

// --- Helper Functions ---
const getItemBgColor = (id) => {
  if (id === 210) return "bg-pink-100"; // Flask
  if (id === 276 || id === 277) return "bg-orange-200"; // Food
  if (id === 146 || id === 122) return "bg-slate-300"; // Armor
  if (id === 17 || id === 11) return "bg-blue-200"; // Swords
  if (id === 36 || id === 78 || id === 48) return "bg-red-200"; // Heavy
  if (id === 102) return "bg-emerald-200"; // Bow
  if (id === 115 || id === 118) return "bg-purple-200"; // Staffs
  return "bg-amber-200"; // Default
};

// --- Helper Components ---
const Sprite = ({ index, bgClass, size = SPRITE_SIZE * SCALE, className = "" }) => {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const bgX = -(col * SPRITE_SIZE);
  const bgY = -(row * SPRITE_SIZE);
  const internalScale = size / SPRITE_SIZE;

  return (
    <div
      className={`relative rounded-sm overflow-hidden flex-shrink-0 flex items-center justify-center ${bgClass || 'bg-gray-200'} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${SPRITE_SHEET_SRC})`,
          backgroundPosition: `${bgX * internalScale}px ${bgY * internalScale}px`,
          backgroundSize: `${SHEET_WIDTH * internalScale}px auto`,
          imageRendering: 'pixelated',
          filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.6))' 
        }}
      />
    </div>
  );
};

const MonsterSprite = ({ row, col, size = 128, isHit }) => {
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
      <motion.div
        animate={isHit ? { x: [-5, 5, -5, 5, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}}
        transition={{ duration: 0.4 }}
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

// --- Formatted Description Component ---
const FormattedDescription = ({ text }) => {
  if (!text) return null;

  // Split text by the relevant phrases to check context
  // Regex looks for patterns like "10 Magic", "10 Armor", "10 Blood"
  const parts = text.split(/(\d+\s+Magic|\d+\s+Armor|\d+\s+Blood)/g);

  return (
    <p className="text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-line">
      {parts.map((part, i) => {
        // 1. Magic Logic
        if (part.match(/\d+\s+Magic/)) {
            const [val, label] = part.split(' ');
            return <span key={i} className="text-purple-600 font-bold">{val} {label}</span>;
        }

        // 2. Armor Logic
        if (part.match(/\d+\s+Armor/)) {
            const [val, label] = part.split(' ');
            return <span key={i} className="text-slate-500 font-bold">{val} {label}</span>;
        }

        // 3. Blood Logic
        if (part.match(/\d+\s+Blood/)) {
            const [val, label] = part.split(' ');
            return <span key={i} className="text-red-600 font-bold">{val} {label}</span>;
        }

        // Default text
        return <span key={i}>{part}</span>;
      })}
    </p>
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
    // Fallback random generation
    const suffixes = ["of Ruin", "of Light", "of the Wolf", "of Eternity", "of Silence", ""];
    const prefixes = ["Ancient", "Rusty", "Gilded", "Void", "Astral", "Cursed", "Blessed"];
    const roots = ["Dagger", "Potion", "Relic", "Shield", "Tome", "Gem", "Key"];
    name = `${prefixes[rand(1) % prefixes.length]} ${roots[rand(2) % roots.length]} ${suffixes[rand(3) % suffixes.length]}`;
    type = "Item";
  }
  
  const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
  const rarity = rarities[rand(5) % rarities.length];
  
  let description = "This is a temporary description. This will have effects and stats later.";
  
  if (type === "Weapon") {
    // Check if it's a staff (ID 115 or 118)
    if (id === 115 || id === 118) {
        description = "Attack: 40 Magic, 10 Armor, 10 Blood.\nNo additional effects.";
    } else {
        description = "Attack: 10 Magic, 20 Armor, 20 Blood.\nNo additional effects.";
    }
  }

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
    Food: "bg-orange-100 text-orange-800",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${colors[type] || "bg-gray-100 text-gray-700"}`}>
      {type}
    </span>
  );
};

// --- VFX Components ---
const ContinuousBloodParticles = () => {
    // UPDATED: More particles (20), larger size range, slightly wider spread
    const particles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 80, 
      y: (Math.random() - 0.5) * 80,
      scale: Math.random() * 0.8 + 0.5, 
      duration: Math.random() * 1 + 1, // 1-2s duration
      delay: Math.random() * 2 
    }));
  
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
            animate={{ 
              opacity: [1, 1, 0], // UPDATED: Stay opaque longer
              y: [0, 30], // Fall further
              x: [0, p.x], 
              scale: [0, p.scale, 0]
            }}
            transition={{ 
                duration: p.duration, 
                repeat: Infinity, 
                delay: p.delay,
                ease: "easeInOut" 
            }}
            // UPDATED: Slightly smaller square particles (w-2 h-2)
            className="absolute w-2 h-2 bg-red-600 shadow-sm"
          />
        ))}
      </div>
    );
  };

// --- Animated Stats Component ---
const AnimatedStat = ({ value, colorClass }) => {
  const displayValue = useMotionValue(value);
  const rounded = useTransform(displayValue, Math.round);
  const prevValue = useRef(value);

  useEffect(() => {
    const diff = Math.abs(value - prevValue.current);
    if (diff === 0) return;
    
    // UPDATED: Faster duration calculation
    const duration = Math.min(0.5, Math.max(0.2, diff * 0.015));

    animate(displayValue, value, {
      duration: duration,
      ease: "circOut"
    });
    
    prevValue.current = value;
  }, [value, displayValue]);

  return <motion.span className={colorClass}>{rounded}</motion.span>;
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

  // Enemy Stats State
  const [enemyStats, setEnemyStats] = useState({ magic: 80, armor: 80, body: 80 });
  
  // Animation States
  const [isBleeding, setIsBleeding] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [monsterIsHit, setMonsterIsHit] = useState(false);

  useEffect(() => {
    const items = Array.from({ length: 12 }, () => {
      const randomIndex = Math.floor(Math.random() * ITEM_POOL.length);
      return ITEM_POOL[randomIndex];
    });
    setGridItems(items);
  }, []);

  const handleItemClick = (spriteIndex, gridIndex) => {
    if (isAttacking) return;
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
    if (isAttacking) return;

    if (item.isFlask) {
      setFlaskCount(prev => prev + 1);
      setKeptItems(prev => prev.filter((_, i) => i !== slotIndex));
      if (selectedItem && selectedItem.uniqueId === item.uniqueId) {
        setSelectedItem(null);
      }
      return;
    }

    const uniqueId = `kept-${slotIndex}`;
    if (selectedItem && selectedItem.uniqueId === uniqueId) {
      setKeptItems(prev => prev.filter(k => k.sourceGridIndex !== item.sourceGridIndex));
      setSelectedItem(null);
    } else {
      setSelectedItem({ ...item, uniqueId });
    }
  };

  const rerollItems = () => {
    if (isAttacking) return;
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

  const handleAttack = async () => {
    if (keptItems.length < 5 || isAttacking) return;

    setIsAttacking(true);
    let currentStats = { ...enemyStats };
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // SEQUENTIAL DAMAGE LOGIC
    for (let i = 0; i < keptItems.length; i++) {
        const item = keptItems[i];
        
        // 1. Highlight current item
        setActiveItemIndex(i);

        // 2. Anticipation/Charge Up (Reduced delay for faster flow)
        await delay(100);

        if (item.type === "Weapon") {
            // Determine damage stats
            let magicDmg = 10;
            let physDmg = 20;

            if (item.id === 115 || item.id === 118) {
                magicDmg = 40;
                physDmg = 10;
            }

            // Calculate impact
            let damageDealt = 0;
            if (currentStats.magic > 0) {
                const prev = currentStats.magic;
                currentStats.magic = Math.max(0, currentStats.magic - magicDmg);
                damageDealt = prev - currentStats.magic;
            } else if (currentStats.armor > 0) {
                const prev = currentStats.armor;
                currentStats.armor = Math.max(0, currentStats.armor - physDmg);
                damageDealt = prev - currentStats.armor;
            } else {
                const prev = currentStats.body;
                currentStats.body = Math.max(0, currentStats.body - physDmg);
                damageDealt = prev - currentStats.body;
            }

            // 3. Impact & Monster Reaction
            if (damageDealt > 0) {
                setEnemyStats({ ...currentStats }); // Trigger number scroll
                setMonsterIsHit(true);
                setTimeout(() => setMonsterIsHit(false), 250);

                if (currentStats.body < 80) setIsBleeding(true);

                // 4. Dynamic Linger based on damage magnitude (Faster multiplier)
                const waitTime = Math.max(250, damageDealt * 10); 
                await delay(waitTime);
            } else {
                await delay(150);
            }
        } else {
            // Non-weapons (e.g. potions or fillers) just flash briefly
            await delay(150);
        }
    }

    // Reset after full sequence (Faster reset)
    await delay(300);
    setActiveItemIndex(null);
    setKeptItems([]);
    setSelectedItem(null);
    setIsAttacking(false);
  };

  const useFlask = () => {
    if (isAttacking) return;
    if (flaskCount > 0 && keptItems.length < 5) {
      setFlaskCount(prev => prev - 1);
      const flaskItem = {
        id: 210, 
        name: "Flask",
        type: "Item",
        rarity: "Common",
        description: "Restores health or mana (Placeholder).",
        isFlask: true,
        uniqueId: `flask-${Date.now()}`
      };
      setKeptItems(prev => [...prev, flaskItem]);
      setSelectedItem(flaskItem);
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
                className="w-full bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center min-h-[200px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full flex-1 flex flex-row items-center">
                  <div className="w-1/2 flex flex-col items-center justify-center">
                     <motion.div
                        animate={{ 
                          y: [0, -6, 0], 
                          scale: [1, 1.05, 1] 
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="flex flex-col items-center relative z-10"
                     >
                       <RogueSprite row={2} col={2} size={96} />
                       <div className="w-14 h-2 bg-black/30 rounded-[50%] blur-[2px] mt-[-2px]" />
                     </motion.div>
                  </div>

                  <div className="w-1/2 h-full flex flex-row items-center justify-center gap-2">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-center shadow-sm">
                       <span className="text-slate-400 font-serif font-bold text-lg select-none">1</span>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-center shadow-sm">
                       <span className="text-slate-400 font-serif font-bold text-lg select-none">2</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowUserModal(false)}
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

                  <div className="absolute bottom-2 left-2 z-20">
                     <motion.button
                       whileTap={{ scale: 0.9 }}
                       onClick={() => setShowUserModal(true)}
                       className="w-10 h-10 rounded bg-[#2a0a36] text-white flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
                     >
                       <User size={20} />
                     </motion.button>
                  </div>
               </div>

               <div className="h-1/2 px-4 pt-2 pb-16 flex flex-col overflow-y-auto no-scrollbar bg-[#f2e8dc] relative">
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
                        {/* UPDATED: Formatted Description */}
                        <FormattedDescription text={selectedItem.description} />
                     </motion.div>
                   ) : (
                    <div className="flex-1"></div>
                   )}
                 </AnimatePresence>
               </div>
            </div>

            {/* RIGHT: Monster Viewport */}
            <div className="w-1/2 h-full bg-slate-100 relative flex flex-col items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-slate-100" />
               
               <div className="relative z-10 flex items-end justify-center pointer-events-none mb-4">
                 {/* UPDATED: Continuous Blood Particles (Square) */}
                 {isBleeding && <ContinuousBloodParticles />}

                 <motion.div
                    // UPDATED: Normal idle animation + Hit Reaction
                    animate={{ 
                      y: [0, -8, 0], 
                      rotate: [0, 2, 0, -2, 0],
                      scale: [1, 1.02, 1] 
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center relative z-10"
                 >
                   <MonsterSprite row={4} col={2} size={112} isHit={monsterIsHit} />
                   <div className="w-20 h-3 bg-black/40 rounded-[50%] blur-sm mt-[-6px]" />
                 </motion.div>
               </div>

               <div className="relative z-10 flex gap-2 text-xs font-serif text-slate-500 tracking-wider mb-6">
                  {/* Magic Stat */}
                  <div className="flex flex-col items-center gap-0">
                    <span className="font-bold text-slate-700">Magic</span>
                    <AnimatedStat value={enemyStats.magic} colorClass="text-purple-600 font-bold text-lg" />
                  </div>
                  <div className="w-px h-6 bg-slate-300/50" />
                  
                  {/* Armor Stat - UPDATED COLOR (Silver/Slate) */}
                  <div className="flex flex-col items-center gap-0">
                    <span className="font-bold text-slate-700">Armor</span>
                    <AnimatedStat value={enemyStats.armor} colorClass="text-slate-500 font-bold text-lg" />
                  </div>
                  <div className="w-px h-6 bg-slate-300/50" />
                  
                  {/* Body/Blood Stat - UPDATED Label and Spacing */}
                  <div className="flex flex-col items-center gap-0">
                    <span className="font-bold text-slate-700">Blood</span>
                    <AnimatedStat value={enemyStats.body} colorClass="text-red-600 font-bold text-lg" />
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
                disabled={flaskCount === 0 || keptItems.length >= 5 || isAttacking}
                whileTap={flaskCount > 0 && keptItems.length < 5 && !isAttacking ? { scale: 0.9, rotate: -45 } : {}}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200
                  ${flaskCount > 0 && keptItems.length < 5 && !isAttacking
                    ? 'bg-pink-900 text-white cursor-pointer' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                `}
                onClick={useFlask}
            >
                <FlaskRound size={18} />
            </motion.button>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto flex items-center justify-center">
          <AnimatePresence>
            {keptItems.length === 5 && !isAttacking && (
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
            disabled={keptItems.length < 5 || isAttacking}
            animate={keptItems.length === 5 && !isAttacking ? { scale: 1.1 } : { scale: 1 }}
            whileHover={keptItems.length === 5 && !isAttacking ? { scale: 1.15 } : {}}
            whileTap={{ scale: 0.9 }}
            className={`
              w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 relative z-10
              ${keptItems.length === 5 && !isAttacking
                ? 'bg-gradient-to-b from-red-500 to-red-700 cursor-pointer text-white' 
                : 'bg-slate-200 cursor-not-allowed text-slate-400'
              }
            `}
            onClick={handleAttack}
          >
            <Sword 
              size={28} 
              strokeWidth={2.5}
            />
          </motion.button>
        </div>

        <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto"> 
            <motion.button
                disabled={rerollCount === 0 || isAttacking}
                whileTap={rerollCount > 0 && !isAttacking ? { scale: 0.9, rotate: -45 } : {}}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200
                  ${rerollCount > 0 && !isAttacking
                    ? 'bg-blue-950 text-white cursor-pointer' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
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
                  const isSelected = item && selectedItem && selectedItem.uniqueId === item.uniqueId;
                  const isActive = activeItemIndex === slotIndex;
                  
                  const slotBgClass = item ? getItemBgColor(item.id) : 'bg-slate-800';
                  
                  return (
                    <motion.div 
                      key={slotIndex}
                      animate={
                        isActive 
                        ? { 
                            scale: 1.15,
                            borderColor: "rgba(239, 68, 68, 1)", // red-500
                            boxShadow: "0 0 0 4px rgba(239, 68, 68, 0.4)"
                          }
                        : isSelected
                          ? {
                              scale: 1.0,
                              borderColor: "rgba(13, 148, 136, 1)", // teal-600
                              boxShadow: "0 0 0 2px rgba(20, 184, 166, 1)" // teal-500
                          }
                          : { 
                              scale: 1,
                              borderColor: "rgba(51, 65, 85, 1)", // slate-700
                              boxShadow: "none"
                          }
                      }
                      transition={{ duration: 0.2 }}
                      className={`
                        w-12 h-12 rounded-lg border flex items-center justify-center relative overflow-hidden
                        ${isActive ? 'z-20' : isSelected ? 'z-10' : ''}
                        ${slotBgClass}
                      `}
                    >
                      {item ? (
                        <motion.div
                          layoutId={item.isFlask ? undefined : `kept-instance-${item.sourceGridIndex}`}
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
                    </motion.div>
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

            {/* Dynamic stats from state */}
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
