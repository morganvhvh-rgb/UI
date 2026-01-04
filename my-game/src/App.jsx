import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion';
import { Sword, RefreshCw, FlaskRound, User, Heart } from 'lucide-react';

// --- Configuration ---
const SPRITE_SHEET_SRC = '/icons/items.png';
const MONSTER_SRC = '/icons/monsters.png'; // Added here for easy access
const SPRITE_SIZE = 32;
const SHEET_WIDTH = 352;
const MONSTER_SHEET_WIDTH = 384;
const COLS = SHEET_WIDTH / SPRITE_SIZE; // 11 columns
const SCALE = 1.6; // Default scale for generic sprites
const DARK_PURPLE = "#4c1d59"; // Lighter shade as requested

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
  
  // Special
  900: { name: "Hired Help", type: "Monster" },     // Special ID for Hired Help

  // Flask
  210: { name: "Flask", type: "Item" }
};

const ITEM_POOL = Object.keys(ITEM_DEFINITIONS).filter(id => id !== "210").map(Number);

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
  if (id === 233 || id === 234) return "bg-indigo-200"; // Books
  if (id === 900) return "bg-slate-800 text-white"; // Hired Help (Black theme)
  return "bg-amber-200"; // Default
};

// --- Helper Components ---
const Sprite = ({ index, bgClass, size = SPRITE_SIZE * SCALE, className = "" }) => {
  let sheetSrc = SPRITE_SHEET_SRC;
  let sheetWidth = SHEET_WIDTH;
  let bgX, bgY;
  
  const internalScale = size / SPRITE_SIZE;

  if (index === 900) {
      // Hired Help: Use monsters.png
      sheetSrc = MONSTER_SRC;
      sheetWidth = MONSTER_SHEET_WIDTH;
      // Row 1 (index 1), Col 2 (index 2)
      bgX = -(2 * SPRITE_SIZE); 
      bgY = -(1 * SPRITE_SIZE);
  } else {
      // Standard Item Logic
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      bgX = -(col * SPRITE_SIZE);
      bgY = -(row * SPRITE_SIZE);
  }

  return (
    <div
      className={`relative rounded-sm overflow-hidden flex-shrink-0 flex items-center justify-center ${bgClass || 'bg-gray-200'} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${sheetSrc})`,
          backgroundPosition: `${bgX * internalScale}px ${bgY * internalScale}px`,
          backgroundSize: `${sheetWidth * internalScale}px auto`,
          imageRendering: 'pixelated',
          filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.6))' 
        }}
      />
    </div>
  );
};

const MonsterSprite = ({ row, col, size = 128, isHit, isBlocked }) => {
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
        position: 'relative'
      }}
    >
      <motion.div
        animate={isHit 
          ? { x: [-5, 5, -5, 5, 0], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } 
          : { x: 0, filter: isBlocked ? "grayscale(100%) opacity(0.5)" : "brightness(1)" }
        }
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${MONSTER_SRC})`,
          backgroundPosition: `${bgX * internalScale}px ${bgY * internalScale}px`,
          backgroundSize: `${MONSTER_SHEET_WIDTH * internalScale}px auto`,
        }}
      />
      {isBlocked && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-red-600 font-bold font-serif text-lg bg-white/80 px-2 rounded border border-red-500 transform -rotate-12">
               BLOCKED
            </span>
         </div>
      )}
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

  // New logic for Attack: X/X/X pattern
  const attackRegex = /Attack:\s+(\d+)\/(\d+)\/(\d+)(.*)/;
  const match = text.match(attackRegex);

  if (match) {
    const [fullStr, m, a, b, extra] = match;
    const parts = text.split(fullStr);
    return (
       <p className="text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-line">
         {parts[0]}
         <span className="font-bold font-serif text-slate-600">Attack: </span>
         <span className="text-purple-600 font-bold font-serif">{m}</span>
         <span className="text-slate-400 font-bold mx-0.5">/</span>
         <span className="text-slate-500 font-bold font-serif">{a}</span>
         <span className="text-slate-400 font-bold mx-0.5">/</span>
         <span className="text-red-600 font-bold font-serif">{b}</span>
         {extra && <span className="text-slate-800 font-bold font-serif ml-1">{extra}</span>}
         {parts[1]}
       </p>
    );
  }

  // Fallback for other patterns (keeping legacy support just in case)
  const parts = text.split(/(\d+\s+Magic|\d+\s+Armor|\d+\s+Blood)/g);

  return (
    <p className="text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-line">
      {parts.map((part, i) => {
        if (part.match(/\d+\s+Magic/)) {
            const [val, label] = part.split(' ');
            return <span key={i} className="text-purple-600 font-bold font-serif">{val} {label}</span>;
        }
        if (part.match(/\d+\s+Armor/)) {
            const [val, label] = part.split(' ');
            return <span key={i} className="text-slate-500 font-bold font-serif">{val} {label}</span>;
        }
        if (part.match(/\d+\s+Blood/)) {
            const [val, label] = part.split(' ');
            return <span key={i} className="text-red-600 font-bold font-serif">{val} {label}</span>;
        }
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
    if (id === 115) {
        description = "Attack: 80/40/40\nNo additional effects.";
    } else if (id === 118) {
        description = "Attack: 40/20/20\nNo additional effects.";
    } else {
        description = "Attack: 10/20/20\nNo additional effects.";
    }
  }

  // Magic Book Description
  if (id === 233) {
      description = "Doubles next Magic Staff damage.\nRemoves all books from pool.";
  }
  // Holy Book Description
  if (id === 234) {
      description = "Doubles next Holy Staff damage.";
  }
  // Sword Ring 1 Description
  if (id === 192) {
      description = "+10 Armor attack for all following swords.";
  }
  // Poison Arrow Description
  if (id === 253) {
      description = "Next Bow deals +5 damage and inflicts poison.";
  }
  // Multi Arrow Description
  if (id === 256) {
      description = "Next Bow attacks 3 times.\nRemoves all Bows from pool.";
  }
  
  // Flask
  if (id === 210) {
      description = "Replenish 1 Heart.";
  }

  // Heavy Shield
  if (id === 122) {
      description = "Blocks enemy action.\nRemoves all shields from pool.";
  }

  // Hired Help
  if (id === 900) {
      description = "Attack: 60/60/60\nRequires 2 equipped food symbols.";
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
    Monster: "bg-slate-800 text-slate-100",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${colors[type] || "bg-gray-100 text-gray-700"}`}>
      {type}
    </span>
  );
};

// --- VFX Components ---
const ContinuousBloodParticles = () => {
    const particles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 80, 
      y: (Math.random() - 0.5) * 80,
      scale: Math.random() * 0.8 + 0.5, 
      duration: Math.random() * 1 + 1, 
      delay: Math.random() * 2 
    }));
  
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
            animate={{ 
              opacity: [1, 1, 0], 
              y: [0, 30], 
              x: [0, p.x], 
              scale: [0, p.scale, 0]
            }}
            transition={{ 
                duration: p.duration, 
                repeat: Infinity, 
                delay: p.delay,
                ease: "easeInOut" 
            }}
            className="absolute w-2 h-2 bg-red-600 shadow-sm"
          />
        ))}
      </div>
    );
  };

const ContinuousPoisonParticles = () => {
    const particles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 60, 
      y: (Math.random() - 0.5) * 40,
      scale: Math.random() * 0.8 + 0.5, 
      duration: Math.random() * 1.5 + 1, 
      delay: Math.random() * 2 
    }));
  
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10, x: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0], // Fully opaque at peak
              y: [10, -40], 
              x: [0, p.x], 
              scale: [0, p.scale, 0],
              rotate: [0, 90]
            }}
            transition={{ 
                duration: p.duration, 
                repeat: Infinity, 
                delay: p.delay,
                ease: "linear" 
            }}
            // Made opaque and added border for better visibility
            className="absolute w-3 h-3 bg-green-500 border border-green-700 opacity-100 shadow-sm" 
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
  const [playerHealth, setPlayerHealth] = useState(3);
  const [removedItemIds, setRemovedItemIds] = useState([]); // Track removed/banned items

  // Enemy Stats State
  const [enemyStats, setEnemyStats] = useState({ magic: 160, armor: 80, body: 120 });
  const [enemyActionIndex, setEnemyActionIndex] = useState(0); // 0: Attack, 1: Wait, 2: Heal Armor
  
  // Animation States
  const [isBleeding, setIsBleeding] = useState(false);
  const [isPoisoned, setIsPoisoned] = useState(false); 
  const [isAttacking, setIsAttacking] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [monsterIsHit, setMonsterIsHit] = useState(false);
  const [monsterIsBlocked, setMonsterIsBlocked] = useState(false); // New blocked state
  const [enemyIsAttacking, setEnemyIsAttacking] = useState(false);
  const [playerIsHit, setPlayerIsHit] = useState(false);

  useEffect(() => {
    const items = Array.from({ length: 12 }, () => {
      const randomIndex = Math.floor(Math.random() * ITEM_POOL.length);
      return ITEM_POOL[randomIndex];
    });
    setGridItems(items);
  }, []);

  // Sync selectedItem with keptItems to ensure buffs show immediately
  useEffect(() => {
    if (keptItems.length > 0 && selectedItem && !selectedItem.uniqueId.startsWith('kept-')) {
       // Check if the last added item matches the currently selected grid item
       const lastKept = keptItems[keptItems.length - 1];
       if (lastKept.sourceGridIndex === selectedItem.sourceGridIndex) {
           // Switch selection to the kept version immediately
           const keptId = `kept-${keptItems.length - 1}`;
           setSelectedItem({ ...lastKept, uniqueId: keptId });
       }
    }
  }, [keptItems, selectedItem]);

  // UPDATED: Function to calculate buffed stats for description preview
  const getEffectiveDescription = (item) => {
    if (!item) return "";
    
    // Check if it's a kept item by looking at the uniqueId format
    if (item.uniqueId && item.uniqueId.startsWith('kept-')) {
         const slotIndex = parseInt(item.uniqueId.split('-')[1]);
         
         if (slotIndex >= 0 && slotIndex < keptItems.length) {
             const currentItem = keptItems[slotIndex]; 

             if (currentItem.id !== item.id) return item.description;
             
             let desc = item.description;

             // 1. Staff Synergy (Previous Item)
             if (slotIndex > 0) {
                const prevItem = keptItems[slotIndex - 1];
                const isMagicSynergy = prevItem.id === 233 && currentItem.id === 115;
                const isHolySynergy = prevItem.id === 234 && currentItem.id === 118;

                if (isMagicSynergy || isHolySynergy) {
                    desc = desc.replace(/Attack:\s+(\d+)\/(\d+)\/(\d+)/, (match, m, a, b) => {
                        return `Attack: ${parseInt(m)*2}/${parseInt(a)*2}/${parseInt(b)*2}`;
                    });
                }
             }

             // 2. Sword Ring Synergy (All Previous)
             if (currentItem.id === 17 || currentItem.id === 11) {
                 let ringBuff = 0;
                 for (let i = 0; i < slotIndex; i++) {
                     if (keptItems[i].id === 192) {
                         ringBuff += 10;
                     }
                 }
                 
                 if (ringBuff > 0) {
                     desc = desc.replace(/Attack:\s+(\d+)\/(\d+)\/(\d+)/, (match, m, a, b) => {
                         return `Attack: ${m}/${parseInt(a) + ringBuff}/${b}`;
                     });
                 }
             }

            // 3. Poison Arrow Synergy (Bow)
            if (currentItem.id === 102) { // Bow
                 let poisonBuff = false;
                 let multiBuff = false; // Check for Multi Arrow

                 // Check history for specific items
                 let tempPoisonActive = false;
                 let tempMultiActive = false;
                 
                 for (let i = 0; i < slotIndex; i++) {
                     if (keptItems[i].id === 253) tempPoisonActive = true;
                     if (keptItems[i].id === 256) tempMultiActive = true;
                     
                     // Consume flags on previous Bows
                     if (keptItems[i].id === 102) {
                         if (tempPoisonActive) tempPoisonActive = false;
                         if (tempMultiActive) tempMultiActive = false;
                     }
                 }
                 poisonBuff = tempPoisonActive;
                 multiBuff = tempMultiActive;
                 
                 if (poisonBuff) {
                     desc = desc.replace(/Attack:\s+(\d+)\/(\d+)\/(\d+)/, (match, m, a, b) => {
                         return `Attack: ${parseInt(m)+5}/${parseInt(a)+5}/${parseInt(b)+5}`;
                     });
                     desc += "\nInflicts Poison";
                 }

                 if (multiBuff) {
                     desc = desc.replace(/Attack:\s+(\d+)\/(\d+)\/(\d+)/, (match, m, a, b) => {
                         return `Attack: ${m}/${a}/${b} (x3)`;
                     });
                 }
            }

             return desc;
         }
    }
    return item.description;
  };

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
      // Filter the pool
      const availablePool = ITEM_POOL.filter(id => !removedItemIds.includes(id));
      
      const poolToUse = availablePool.length > 0 ? availablePool : ITEM_POOL;

      const newItems = Array.from({ length: 12 }, () => {
        const randomIndex = Math.floor(Math.random() * poolToUse.length);
        return poolToUse[randomIndex];
      });
      setGridItems(newItems);
      setSelectedItem(null);
    }
  };

  const handleAttack = async () => {
    if (keptItems.length < 5 || isAttacking) return;

    setSelectedItem(null);
    setIsAttacking(true);
    let currentStats = { ...enemyStats };
    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    
    // Reset status effects for the new turn
    setIsPoisoned(false);
    setMonsterIsBlocked(false);

    // Synergy flags
    let boostNextMagicStaff = false;
    let boostNextHolyStaff = false;
    let boostNextBowPoison = false; 
    let boostNextBowMulti = false; // Multi Arrow Synergy
    let booksFound = false;
    let multiArrowsFound = false; // For removing bows later
    let shieldFound = false; // For Heavy Shield
    let blockEnemyAction = false; // Flag to block enemy logic
    let swordArmorBuff = 0; 

    // SEQUENTIAL DAMAGE LOGIC
    for (let i = 0; i < keptItems.length; i++) {
        const item = keptItems[i];
        
        // 1. Highlight current item
        setActiveItemIndex(i);

        // 2. Anticipation/Charge Up
        await delay(100);

        let currentDamageMultiplier = 1;
        let attackCount = 1; // Default attacks per item trigger
        
        // Check for Synergy Books/Arrows/Shields
        if (item.id === 233) booksFound = true;
        if (item.id === 192) swordArmorBuff += 10;
        if (item.id === 253) boostNextBowPoison = true; 
        if (item.id === 256) {
             boostNextBowMulti = true;
             multiArrowsFound = true;
        }
        
        // --- CONSUMABLE LOGIC ---
        // Flask Heal
        if (item.id === 210) {
            setPlayerHealth(prev => Math.min(3, prev + 1));
        }
        
        // Heavy Shield Logic
        if (item.id === 122) {
            blockEnemyAction = true;
            shieldFound = true;
        }

        // --- DAMAGE CALCULATION ---
        let magicDmg = 0;
        let armorDmg = 0;
        let bodyDmg = 0;
        let triggersAttack = false;
        let triggerPoison = false;

        if (item.type === "Weapon") {
            triggersAttack = true;
            // Default Base
            magicDmg = 10;
            armorDmg = 20;
            bodyDmg = 20;

            // Magic Staff (115)
            if (item.id === 115) {
                magicDmg = 80;
                armorDmg = 40;
                bodyDmg = 40;
                if (boostNextMagicStaff) currentDamageMultiplier = 2;
            }
            // Holy Staff (118)
            else if (item.id === 118) {
                magicDmg = 40;
                armorDmg = 20;
                bodyDmg = 20;
                if (boostNextHolyStaff) currentDamageMultiplier = 2;
            }
            // Swords (17, 11) - Apply Sword Ring Buff
            else if (item.id === 17 || item.id === 11) {
                magicDmg = 10;
                armorDmg = 20 + swordArmorBuff; // Apply Buff
                bodyDmg = 20;
            }
            // Bow (102)
            else if (item.id === 102) {
                // Base 10/20/20
                if (boostNextBowPoison) {
                    magicDmg += 5;
                    armorDmg += 5;
                    bodyDmg += 5;
                    triggerPoison = true;
                    boostNextBowPoison = false; // Consumed
                }
                
                if (boostNextBowMulti) {
                    attackCount = 3;
                    boostNextBowMulti = false; // Consumed
                }
            }
        } 
        
        // Hired Help Logic
        else if (item.id === 900) {
            // Count food in kept items
            const foodCount = keptItems.filter(k => k.type === "Food").length;
            if (foodCount >= 2) {
                triggersAttack = true;
                magicDmg = 60;
                armorDmg = 60;
                bodyDmg = 60;
            }
        }


        // Apply Multiplier and Deal Damage
        if (triggersAttack) {
            magicDmg *= currentDamageMultiplier;
            armorDmg *= currentDamageMultiplier;
            bodyDmg *= currentDamageMultiplier;

            // LOOP for Multi-Attacks (default 1, Bow+Multi = 3)
            for (let hit = 0; hit < attackCount; hit++) {
                
                // Calculate impact against CURRENT stats (which might have changed in previous loop iteration)
                let damageDealt = 0;
                
                // Dynamic Targeting: Check stats in order Magic -> Armor -> Body
                if (currentStats.magic > 0) {
                    const prev = currentStats.magic;
                    currentStats.magic = Math.max(0, currentStats.magic - magicDmg);
                    damageDealt = prev - currentStats.magic;
                } else if (currentStats.armor > 0) {
                    const prev = currentStats.armor;
                    currentStats.armor = Math.max(0, currentStats.armor - armorDmg);
                    damageDealt = prev - currentStats.armor;
                } else {
                    const prev = currentStats.body;
                    currentStats.body = Math.max(0, currentStats.body - bodyDmg);
                    damageDealt = prev - currentStats.body;
                }

                // 3. Impact & Monster Reaction
                if (damageDealt > 0) {
                    setEnemyStats({ ...currentStats }); 
                    setMonsterIsHit(true);
                    setTimeout(() => setMonsterIsHit(false), 250);

                    if (currentStats.body < 80) setIsBleeding(true);
                    if (triggerPoison) setIsPoisoned(true); 

                    // Shorter delay for multi-hits to make it feel like a combo
                    const waitTime = attackCount > 1 ? 150 : Math.max(250, damageDealt * 10); 
                    await delay(waitTime);
                } else {
                    await delay(150);
                }
            }
        } else {
            // Non-triggering item
            await delay(150);
        }
        
        // Set flag for NEXT item.
        boostNextMagicStaff = (item.id === 233);
        boostNextHolyStaff = (item.id === 234);
    }

    // Reset after full sequence
    await delay(300);
    setActiveItemIndex(null);
    setKeptItems([]);
    setSelectedItem(null);
    
    // Update Removed Items Pool
    setRemovedItemIds(prev => {
        const newSet = new Set(prev);
        if (booksFound) {
            newSet.add(233);
            newSet.add(234);
        }
        if (multiArrowsFound) {
            newSet.add(102); // Remove Bows
        }
        if (shieldFound) {
            newSet.add(122); // Remove Heavy Shields
        }
        return Array.from(newSet);
    });

    // --- Enemy Turn Logic ---
    if (!blockEnemyAction) {
        const action = enemyActionIndex % 3;
        
        if (action === 0) {
            setEnemyIsAttacking(true); 
            await delay(400); 
            
            setEnemyIsAttacking(false);
            setPlayerIsHit(true); 
            
            await delay(400); 
            setPlayerHealth(prev => Math.max(0, prev - 1)); 
            setPlayerIsHit(false);

            await delay(200);
        } else if (action === 1) {
            await delay(200);
        } else if (action === 2) {
            setEnemyStats(prev => ({ ...prev, armor: 80 }));
            await delay(200);
        }
    } else {
        // Blocked visual cue
        setMonsterIsBlocked(true);
        await delay(600);
        setMonsterIsBlocked(false);
    }
    
    setEnemyActionIndex(prev => (prev + 1) % 3);
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
        description: "Replenish 1 Heart.",
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
                  style={{ backgroundColor: DARK_PURPLE }}
                  className="mt-6 px-6 py-2 text-white rounded-full text-sm font-medium hover:opacity-90 active:scale-95 transition-all"
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

                  <motion.div 
                    className="absolute bottom-2 left-2 z-20 flex items-end gap-2"
                    animate={playerIsHit ? { x: [-3, 3, -3, 3, 0] } : { x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                     <motion.button
                       whileTap={{ scale: 0.9 }}
                       onClick={() => setShowUserModal(true)}
                       style={{ backgroundColor: playerIsHit ? undefined : DARK_PURPLE }}
                       className={`w-10 h-10 rounded text-white flex items-center justify-center shadow-md transition-colors duration-200 ${playerIsHit ? 'bg-red-600' : 'hover:opacity-90'}`}
                     >
                       <User size={20} />
                     </motion.button>
                     <div className="flex gap-1 mb-1">
                        {[0, 1, 2].map(i => (
                          <Heart 
                             key={i} 
                             size={12} 
                             style={{
                                color: i < playerHealth ? (playerIsHit ? '#dc2626' : DARK_PURPLE) : '#cbd5e1',
                                fill: i < playerHealth ? (playerIsHit ? '#dc2626' : DARK_PURPLE) : '#cbd5e1'
                             }}
                          />
                        ))}
                     </div>
                  </motion.div>
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
                        {/* UPDATED: Formatted Description using the new helper */}
                        <FormattedDescription text={getEffectiveDescription(selectedItem)} />
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
                 {/* VFX Layers */}
                 {isBleeding && <ContinuousBloodParticles />}
                 {isPoisoned && <ContinuousPoisonParticles />}

                 <motion.div
                    // UPDATED: Normal idle animation + Hit Reaction + Attack Zoom + Blocked Visual
                    animate={
                      enemyIsAttacking 
                      ? { scale: 1.4, y: 10, filter: "brightness(1.2)" } 
                      : { 
                          y: [0, -8, 0], 
                          rotate: [0, 2, 0, -2, 0],
                          scale: [1, 1.02, 1],
                          filter: monsterIsBlocked ? "grayscale(100%) opacity(0.8)" : "brightness(1)"
                        }
                    }
                    transition={enemyIsAttacking ? { duration: 0.2 } : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center relative z-10"
                 >
                   <MonsterSprite row={4} col={2} size={112} isHit={monsterIsHit} isBlocked={monsterIsBlocked} />
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
                  
                  {/* Armor Stat */}
                  <div className="flex flex-col items-center gap-0">
                    <span className="font-bold text-slate-700">Armor</span>
                    <AnimatedStat value={enemyStats.armor} colorClass="text-slate-500 font-bold text-lg" />
                  </div>
                  <div className="w-px h-6 bg-slate-300/50" />
                  
                  {/* Body/Blood Stat */}
                  <div className="flex flex-col items-center gap-0">
                    <span className="font-bold text-slate-700">Blood</span>
                    <AnimatedStat value={enemyStats.body} colorClass="text-red-600 font-bold text-lg" />
                  </div>
               </div>

               <div className="relative z-10 w-full px-4 pb-8 flex flex-col items-start gap-1">
                  <span className="text-[10px] text-slate-500 font-serif font-bold">
                    Enemy Loop:
                  </span>
                  <div className="flex flex-wrap text-xs text-slate-600 font-sans leading-relaxed">
                     <span className={enemyActionIndex % 3 === 0 ? "text-slate-900 font-bold" : "text-slate-400"}>
                        Attack once
                     </span>
                     <span className="mx-1 text-slate-300">/</span>
                     <span className={enemyActionIndex % 3 === 1 ? "text-slate-900 font-bold" : "text-slate-400"}>
                        Do nothing
                     </span>
                     <span className="mx-1 text-slate-300">/</span>
                     <span className={enemyActionIndex % 3 === 2 ? "text-slate-900 font-bold" : "text-slate-400"}>
                        Restore Armor
                     </span>
                  </div>
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
                            scale: 1.15, // Zoom when active
                            // Removed red border and shadow as requested
                            borderColor: "rgba(51, 65, 85, 1)", // Default slate-700
                            boxShadow: "none"
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
