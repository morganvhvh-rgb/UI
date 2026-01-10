import React, { useState, useEffect, useRef, useReducer, useMemo } from 'react';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion';
import { Sword, RefreshCw, FlaskRound, User, Heart } from 'lucide-react';

/* =============================================================================
  DailyRogue - Architecture Refactor
  =============================================================================
  
  Sections:
  1. CONFIGURATION & ASSETS - Constants and sprites
  2. DATA LAYER - Item definitions using a Tag/Attribute system
  3. COMBAT ENGINE - Pure logic for damage calculation and synergies
  4. PRESENTATIONAL COMPONENTS - Dumb components for UI
  5. MAIN APP - State management and loop orchestration
*/

// =============================================================================
// 1. CONFIGURATION & ASSETS
// =============================================================================

const CONFIG = {
  SPRITE_SHEET_SRC: '/icons/items.png',
  MONSTER_SRC: '/icons/monsters.png',
  ROGUE_SRC: '/icons/rogues.png',
  SPRITE_SIZE: 32,
  SHEET_WIDTH: 352,
  MONSTER_SHEET_WIDTH: 384,
  ROGUE_SHEET_WIDTH: 224,
  COLS: 11,
  SCALE: 1.6,
  COLORS: {
    DARK_PURPLE: "#4c1d59",
    BG_DEFAULT: "bg-amber-200",
  }
};

// =============================================================================
// 2. DATA LAYER
// =============================================================================

// Base templates for types to reduce repetition
const TYPE_COLORS = {
  Weapon: "bg-rose-100 text-rose-700",
  Consumable: "bg-emerald-100 text-emerald-700",
  Armor: "bg-slate-200 text-slate-700",
  Artifact: "bg-violet-100 text-violet-700",
  Material: "bg-amber-100 text-amber-700",
  Item: "bg-yellow-100 text-yellow-800",
  Food: "bg-orange-100 text-orange-800",
  Monster: "bg-slate-800 text-slate-100",
};

const ITEM_BG_COLORS = {
  Flask: "bg-pink-100",
  Food: "bg-orange-200",
  Armor: "bg-slate-300",
  Sword: "bg-blue-200",
  Heavy: "bg-red-200",
  Bow: "bg-emerald-200",
  Staff: "bg-purple-200",
  Book: "bg-indigo-200",
  Special: "bg-slate-800 text-white",
  Default: "bg-amber-200"
};

/* ITEM REGISTRY
  Refactored from simple ID check to a robust Attribute system.
  - tags: used for synergies (e.g., 'sword', 'heavy')
  - stats: base damage values
  - behavior: special flags for the engine
*/
const ITEM_REGISTRY = {
  // --- WEAPONS ---
  17: { name: "Big Sword", type: "Weapon", tags: ["sword", "heavy"], stats: { m: 10, a: 20, b: 20 }, bg: "Sword" },
  11: { name: "Fast Sword", type: "Weapon", tags: ["sword"], stats: { m: 10, a: 20, b: 20 }, bg: "Sword" },
  36: { name: "Big Axe", type: "Weapon", tags: ["heavy"], stats: { m: 10, a: 20, b: 20 }, bg: "Heavy" },
  78: { name: "Mace", type: "Weapon", tags: ["heavy"], stats: { m: 10, a: 20, b: 20 }, bg: "Heavy" },
  48: { name: "Big Hammer", type: "Weapon", tags: ["heavy"], stats: { m: 10, a: 20, b: 20 }, bg: "Heavy" },
  
  102: { name: "Bow", type: "Weapon", tags: ["bow"], stats: { m: 10, a: 20, b: 20 }, bg: "Bow" },
  
  115: { name: "Magic Staff", type: "Weapon", tags: ["staff", "magic_staff"], stats: { m: 80, a: 40, b: 40 }, bg: "Staff" },
  118: { name: "Holy Staff", type: "Weapon", tags: ["staff", "holy_staff"], stats: { m: 40, a: 20, b: 20 }, bg: "Staff" },

  // --- SYNERGY ITEMS ---
  192: { 
    name: "Sword Ring 1", type: "Item", bg: "Default",
    description: "+10 Armor attack for all following swords.",
    synergy: { type: 'PASSIVE_BUFF', targetTag: 'sword', stat: 'a', value: 10 }
  },
  
  // Poison Ring
  187: { 
    name: "Poison Ring", type: "Item", bg: "Default", 
    description: "All equipped symbols will deal 2x damage to a poisoned enemy.", 
    synergy: { type: 'GLOBAL_CONDITIONAL_MULTIPLIER', condition: 'ENEMY_POISONED', multiplier: 2 }
  },
  
  146: { 
    name: "Gauntlets", type: "Armor", bg: "Armor",
    description: "+10 Armor attack for all following heavy weapons.",
    synergy: { type: 'PASSIVE_BUFF', targetTag: 'heavy', stat: 'a', value: 10 }
  },

  253: { 
    name: "Poison Arrow", type: "Item", bg: "Bow",
    description: "Next Bow deals +5 damage and inflicts poison.",
    synergy: { type: 'NEXT_USE_BUFF', targetTag: 'bow', stat: 'all', value: 5, effect: 'poison' }
  },
  
  256: { 
    name: "Multi Arrow", type: "Item", bg: "Bow",
    description: "Next Bow attacks 3 times.\nRemoves all Bows from pool.",
    synergy: { type: 'NEXT_USE_MODIFIER', targetTag: 'bow', hits: 3, removeTypeFromPool: 102 }
  },

  233: { 
    name: "Magic Book", type: "Item", bg: "Book",
    description: "Doubles next Magic Staff damage.\nRemoves all books from pool.",
    synergy: { type: 'NEXT_USE_MODIFIER', targetTag: 'magic_staff', multiplier: 2, removeTypeFromPool: 233 }
  },
  
  234: { 
    name: "Holy Book", type: "Item", bg: "Book",
    description: "Doubles next Holy Staff damage.",
    synergy: { type: 'NEXT_USE_MODIFIER', targetTag: 'holy_staff', multiplier: 2 }
  },

  122: { 
    name: "Heavy Shield", type: "Armor", bg: "Armor",
    description: "Blocks enemy action.\nRemoves all shields from pool.",
    synergy: { type: 'IMMEDIATE', action: 'BLOCK_ENEMY', removeTypeFromPool: 122 }
  },

  276: { name: "Bread", type: "Food", tags: ["food"], bg: "Food" },
  277: { name: "Tomato", type: "Food", tags: ["food"], bg: "Food" },

  // --- SPECIAL ---
  900: { 
    name: "Hired Help", type: "Monster", bg: "Special",
    description: "Attack: 60/60/60\nRequires 2 equipped food symbols.",
    stats: { m: 60, a: 60, b: 60 },
    condition: { type: 'COUNT_TAG', tag: 'food', min: 2 }
  },

  210: { 
    name: "Flask", type: "Item", bg: "Flask",
    description: "Replenish 1 Heart.",
    synergy: { type: 'IMMEDIATE', action: 'HEAL_PLAYER', value: 1 }
  }
};

const ITEM_POOL_IDS = Object.keys(ITEM_REGISTRY).filter(id => id !== "210").map(Number);

// =============================================================================
// 3. COMBAT ENGINE (Logic Layer)
// =============================================================================

/**
 * Generates a full description based on the item's potential output
 * given the current context of kept items (synergies).
 */
const getDynamicDescription = (item, previousItems = []) => {
  const baseDesc = ITEM_REGISTRY[item.id]?.description;
  if (baseDesc) return baseDesc; // Return static description if defined
  
  if (!item.stats) return "No effect.";

  // Calculate stats based on context
  const { damage, hits } = calculateItemOutput(item, previousItems);
  
  // Format based on hit count
  let desc = `Attack: ${damage.m}/${damage.a}/${damage.b}`;
  if (hits > 1) desc += ` (x${hits})`;
  
  return desc;
};

/**
 * Core Logic: Calculates the output of a specific item
 * based on the history of items played before it in the chain.
 */
const calculateItemOutput = (itemData, previousItems) => {
  const def = ITEM_REGISTRY[itemData.id] || {};
  const stats = { m: def.stats?.m || 0, a: def.stats?.a || 0, b: def.stats?.b || 0 };
  const tags = def.tags || [];
  
  let hits = 1;
  let multiplier = 1;
  let effects = [];
  
  // 1. Replay previous items to build context state
  // This approach is O(N^2) but N=5 so it's instantaneous.
  // We use this "replay" strategy to ensure the logic is pure and stateless.
  let passiveBuffs = { m: 0, a: 0, b: 0 };
  let nextUseModifiers = []; // Queue of modifiers waiting for a matching tag
  
  previousItems.forEach(prevItem => {
    const prevDef = ITEM_REGISTRY[prevItem.id];
    if (!prevDef?.synergy) return;

    const syn = prevDef.synergy;

    if (syn.type === 'PASSIVE_BUFF') {
      // e.g. Sword Ring: adds to the passive pool for specific tags
      if (!passiveBuffs[syn.targetTag]) passiveBuffs[syn.targetTag] = { m:0, a:0, b:0 };
      passiveBuffs[syn.targetTag][syn.stat] += syn.value;
    }
    
    else if (syn.type === 'NEXT_USE_BUFF' || syn.type === 'NEXT_USE_MODIFIER') {
      // e.g. Poison Arrow or Book
      // We push to a queue. The next matching item consumes it.
      nextUseModifiers.push({ ...syn, sourceId: prevItem.id });
    }
  });

  // 2. Consume modifiers meant for THIS item
  // We process the queue. If we match, we consume (remove from calculation, though here we just apply).
  // Since we are calculating for *this* specific item at the end of the chain, we just need to find
  // if there are active modifiers that haven't been "eaten" by intermediate items yet.
  
  // To do this correctly in a replay, we actually have to simulate the consumption logic:
  let availableModifiers = []; 
  
  // Re-run the consumption logic for the whole chain to see what's left for us
  let tempModifiers = [];
  previousItems.forEach(prevItem => {
    const prevDef = ITEM_REGISTRY[prevItem.id];
    
    // Add new modifiers to pool
    if (prevDef?.synergy?.type === 'NEXT_USE_BUFF' || prevDef?.synergy?.type === 'NEXT_USE_MODIFIER') {
      tempModifiers.push(prevDef.synergy);
    }
    
    // Check if this previous item consumed anything itself
    const prevTags = prevDef.tags || [];
    if (prevTags.length > 0) {
      // Find modifiers that match this item
      const remaining = [];
      tempModifiers.forEach(mod => {
        if (prevTags.includes(mod.targetTag)) {
           // Consumed! Don't carry over.
        } else {
           remaining.push(mod);
        }
      });
      tempModifiers = remaining;
    }
  });
  
  availableModifiers = tempModifiers;

  // 3. Apply Context to Current Item
  
  // A. Passive Buffs (Sword Ring, Gauntlets)
  tags.forEach(t => {
     if (passiveBuffs[t]) {
        stats.m += passiveBuffs[t].m || 0;
        stats.a += passiveBuffs[t].a || 0;
        stats.b += passiveBuffs[t].b || 0;
     }
  });

  // B. Consumable Modifiers (Books, Arrows)
  availableModifiers.forEach(mod => {
    if (tags.includes(mod.targetTag)) {
      if (mod.multiplier) multiplier *= mod.multiplier;
      if (mod.value) {
         if (mod.stat === 'all') {
            stats.m += mod.value;
            stats.a += mod.value;
            stats.b += mod.value;
         } else {
            stats.m += (mod.stat === 'm' ? mod.value : 0);
            stats.a += (mod.stat === 'a' ? mod.value : 0);
            stats.b += (mod.stat === 'b' ? mod.value : 0);
         }
      }
      if (mod.hits) hits = mod.hits;
      if (mod.effect) effects.push(mod.effect);
    }
  });

  // C. Special Conditions (Hired Help)
  if (def.condition && def.condition.type === 'COUNT_TAG') {
      const count = previousItems.filter(i => ITEM_REGISTRY[i.id]?.tags?.includes(def.condition.tag)).length;
  }

  return {
    damage: {
        m: stats.m * multiplier,
        a: stats.a * multiplier,
        b: stats.b * multiplier
    },
    hits,
    effects,
    canAttack: def.type === 'Weapon' || def.type === 'Monster'
  };
};

const generateRandomItem = (id) => {
    const def = ITEM_REGISTRY[id];
    if (def) return { ...def, id };
    
    return { 
        id, 
        name: "Unknown Artifact", 
        type: "Item", 
        description: "A mysterious item.", 
        bg: "Default" 
    };
};

// =============================================================================
// 4. PRESENTATIONAL COMPONENTS
// =============================================================================

const Sprite = ({ index, size = CONFIG.SPRITE_SIZE * CONFIG.SCALE, className = "" }) => {
  const itemDef = ITEM_REGISTRY[index];
  let sheetSrc = CONFIG.SPRITE_SHEET_SRC;
  let sheetWidth = CONFIG.SHEET_WIDTH;
  let bgX, bgY;
  
  const internalScale = size / CONFIG.SPRITE_SIZE;

  // Hired Help special handling
  if (index === 900) {
      sheetSrc = CONFIG.MONSTER_SRC;
      sheetWidth = CONFIG.MONSTER_SHEET_WIDTH;
      bgX = -(2 * CONFIG.SPRITE_SIZE); 
      bgY = -(1 * CONFIG.SPRITE_SIZE);
  } else {
      const col = index % CONFIG.COLS;
      const row = Math.floor(index / CONFIG.COLS);
      bgX = -(col * CONFIG.SPRITE_SIZE);
      bgY = -(row * CONFIG.SPRITE_SIZE);
  }

  const bgClass = itemDef 
    ? ITEM_BG_COLORS[itemDef.bg] || ITEM_BG_COLORS.Default
    : "bg-gray-200";

  return (
    <div
      className={`relative rounded-sm overflow-hidden flex-shrink-0 flex items-center justify-center ${bgClass} ${className}`}
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

const AnimatedStat = ({ value, colorClass }) => {
  const displayValue = useMotionValue(value);
  const rounded = useTransform(displayValue, Math.round);
  const prevValue = useRef(value);

  useEffect(() => {
    const diff = Math.abs(value - prevValue.current);
    if (diff === 0) return;
    const duration = Math.min(0.5, Math.max(0.2, diff * 0.015));
    animate(displayValue, value, { duration, ease: "circOut" });
    prevValue.current = value;
  }, [value, displayValue]);

  return <motion.span className={colorClass}>{rounded}</motion.span>;
};

const TypeBadge = ({ type }) => (
  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${TYPE_COLORS[type] || "bg-gray-100 text-gray-700"}`}>
    {type}
  </span>
);

const FormattedDescription = ({ text }) => {
  if (!text) return null;
  // Attack: X/X/X pattern highlighter
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
  return <p className="text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-line">{text}</p>;
};

// =============================================================================
// 5. MAIN APP & STATE
// =============================================================================

export default function App() {
  // --- Game State ---
  const [gridItems, setGridItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [keptItems, setKeptItems] = useState([]); 
  
  const [stats, setStats] = useState({
      flaskCount: 3,
      rerollCount: 3,
      playerHealth: 3
  });
  
  const [removedItemIds, setRemovedItemIds] = useState([]); 
  const [enemy, setEnemy] = useState({ magic: 160, armor: 80, body: 120 });
  const [enemyActionIndex, setEnemyActionIndex] = useState(0); 
  
  // --- Animation State ---
  const [animState, setAnimState] = useState({
      isBleeding: false,
      isPoisoned: false,
      isAttacking: false,
      activeItemIndex: null,
      monsterIsHit: false,
      monsterIsBlocked: false,
      enemyIsAttacking: false,
      playerIsHit: false
  });
  
  const [modals, setModals] = useState({ settings: false, user: false });

  // Initialize Grid
  useEffect(() => {
    generateGrid();
  }, []);

  const generateGrid = (preservedIndices = []) => {
    const pool = ITEM_POOL_IDS.filter(id => !removedItemIds.includes(id));
    const finalPool = pool.length > 0 ? pool : ITEM_POOL_IDS;
    
    setGridItems(prev => {
        const newItems = Array.from({ length: 12 }, (_, i) => {
            if (preservedIndices.includes(i) && prev[i]) return prev[i];
            const randomId = finalPool[Math.floor(Math.random() * finalPool.length)];
            return randomId; // Store just ID
        });
        return newItems;
    });
  };

  // --- ACTIONS ---

  const handleReroll = () => {
    if (animState.isAttacking || stats.rerollCount <= 0) return;
    setStats(s => ({ ...s, rerollCount: s.rerollCount - 1 }));
    const keptIndices = keptItems.map(k => k.sourceGridIndex).filter(idx => idx !== undefined);
    generateGrid(keptIndices);
    
    // Deselect if logic requires (only if not kept)
    if (selectedItem && selectedItem.uniqueId.startsWith('grid-')) {
        const idx = parseInt(selectedItem.uniqueId.split('-')[1]);
        if (!keptIndices.includes(idx)) setSelectedItem(null);
    }
  };

  const handleGridItemClick = (id, index) => {
    if (animState.isAttacking) return;
    const itemData = { ...ITEM_REGISTRY[id], id, sourceGridIndex: index, uniqueId: `grid-${index}` };
    
    // Smart Equipping logic
    if (selectedItem && selectedItem.uniqueId === itemData.uniqueId) {
        // Double click / Click on selected -> Try to equip
        const isAlreadyKept = keptItems.some(k => k.sourceGridIndex === index);
        if (!isAlreadyKept) {
            const newItem = { ...itemData, uniqueId: `kept-${Date.now()}` }; // Temp ID, normalized later
            if (keptItems.length < 5) setKeptItems(prev => [...prev, newItem]);
            else setKeptItems(prev => [...prev.slice(1), newItem]);
        }
    } else {
        setSelectedItem(itemData);
    }
  };

  const handleKeptItemClick = (item, index) => {
    if (animState.isAttacking) return;
    const uniqueId = `kept-slot-${index}`;
    // If we click the item that is already selected (in the context of the slot), remove it
    if (selectedItem && (selectedItem.uniqueId === uniqueId || selectedItem.uniqueId === item.uniqueId)) {
        // Unequip
        if (item.id === 210) setStats(s => ({ ...s, flaskCount: s.flaskCount + 1 }));
        setKeptItems(prev => prev.filter((_, i) => i !== index));
        setSelectedItem(null);
    } else {
        setSelectedItem({ ...item, uniqueId });
    }
  };

  const useFlask = () => {
    if (animState.isAttacking || stats.flaskCount <= 0 || keptItems.length >= 5) return;
    setStats(s => ({ ...s, flaskCount: s.flaskCount - 1 }));
    const flask = { ...ITEM_REGISTRY[210], id: 210, uniqueId: `flask-${Date.now()}` };
    setKeptItems(p => [...p, flask]);
    setSelectedItem(flask);
  };

  // --- COMBAT SEQUENCE ---

  const executeCombat = async () => {
    if (keptItems.length < 5 || animState.isAttacking) return;
    
    setSelectedItem(null);
    // UPDATED: Removed isPoisoned: false from here to allow persistence
    setAnimState(s => ({ ...s, isAttacking: true, monsterIsBlocked: false }));
    
    const delay = ms => new Promise(r => setTimeout(r, ms));
    
    let currentEnemy = { ...enemy };
    let combatState = {
        blockEnemy: false,
        itemsToRemove: new Set()
    };

    // Check for Poison Ring (ID 187) presence globally
    const hasPoisonRing = keptItems.some(k => k.id === 187);
    
    // Local tracking. We start with the existing persistent poison state.
    // If persistent state is true, we consider the target already poisoned for multipliers.
    // Note: The visual state (animState.isPoisoned) acts as the source of truth for "Enemy is Poisoned".
    let isTargetPoisoned = animState.isPoisoned; 

    // 1. Player Turn
    for (let i = 0; i < keptItems.length; i++) {
        const item = keptItems[i];
        setAnimState(s => ({ ...s, activeItemIndex: i }));
        await delay(100);

        // --- ENGINE CALL ---
        const output = calculateItemOutput(item, keptItems.slice(0, i));
        
        // Hired Help Special Check (Needs full array context)
        if (item.id === 900) {
            const foodCount = keptItems.filter(k => ITEM_REGISTRY[k.id]?.tags?.includes('food')).length;
            if (foodCount < 2) output.canAttack = false; // Disable if condition failed
        }

        // Apply Immediate Effects
        const def = ITEM_REGISTRY[item.id];
        if (def.synergy?.type === 'IMMEDIATE') {
            if (def.synergy.action === 'HEAL_PLAYER') setStats(s => ({...s, playerHealth: Math.min(3, s.playerHealth + 1)}));
            if (def.synergy.action === 'BLOCK_ENEMY') combatState.blockEnemy = true;
        }
        if (def.synergy?.removeTypeFromPool) {
            combatState.itemsToRemove.add(def.synergy.removeTypeFromPool);
        }

        // Deal Damage
        if (output.canAttack) {
            // Apply Poison Ring Multiplier
            let currentItemMultiplier = 1;
            if (hasPoisonRing && isTargetPoisoned) {
                currentItemMultiplier = 2;
            }

            for (let hit = 0; hit < output.hits; hit++) {
                let damageDealt = 0;
                
                // Damage Waterfall
                if (currentEnemy.magic > 0) {
                    const dmg = output.damage.m * currentItemMultiplier;
                    const prev = currentEnemy.magic;
                    currentEnemy.magic = Math.max(0, currentEnemy.magic - dmg);
                    damageDealt = prev - currentEnemy.magic;
                } else if (currentEnemy.armor > 0) {
                    const dmg = output.damage.a * currentItemMultiplier;
                    const prev = currentEnemy.armor;
                    currentEnemy.armor = Math.max(0, currentEnemy.armor - dmg);
                    damageDealt = prev - currentEnemy.armor;
                } else {
                    const dmg = output.damage.b * currentItemMultiplier;
                    const prev = currentEnemy.body;
                    currentEnemy.body = Math.max(0, currentEnemy.body - dmg);
                    damageDealt = prev - currentEnemy.body;
                }

                if (damageDealt > 0) {
                    setEnemy({ ...currentEnemy });
                    setAnimState(s => ({ ...s, monsterIsHit: true }));
                    setTimeout(() => setAnimState(s => ({ ...s, monsterIsHit: false })), 250);
                    
                    if (currentEnemy.body < 80) setAnimState(s => ({ ...s, isBleeding: true }));
                    
                    // Logic update for poison
                    if (output.effects.includes('poison')) {
                        setAnimState(s => ({ ...s, isPoisoned: true }));
                        isTargetPoisoned = true; 
                    }
                    
                    const wait = output.hits > 1 ? 150 : Math.max(250, damageDealt * 10);
                    await delay(wait);
                } else {
                    await delay(150);
                }
            }
        } else {
            // Passive item delay
            await delay(150);
        }
    }

    // End Player Turn
    await delay(300);
    setAnimState(s => ({ ...s, activeItemIndex: null }));
    setKeptItems([]);
    setSelectedItem(null);

    // Update Pool
    if (combatState.itemsToRemove.size > 0) {
        setRemovedItemIds(prev => [...prev, ...Array.from(combatState.itemsToRemove)]);
    }

    // 2. Enemy Turn
    if (!combatState.blockEnemy) {
        const action = enemyActionIndex % 3;
        if (action === 0) {
            // Attack
            setAnimState(s => ({ ...s, enemyIsAttacking: true }));
            await delay(400);
            setAnimState(s => ({ ...s, enemyIsAttacking: false, playerIsHit: true }));
            await delay(400);
            setStats(s => ({ ...s, playerHealth: Math.max(0, s.playerHealth - 1) }));
            setAnimState(s => ({ ...s, playerIsHit: false }));
        } else if (action === 2) {
            // Restore Armor
            setEnemy(e => ({ ...e, armor: 80 }));
        }
        // Action 1 is Wait
    } else {
        setAnimState(s => ({ ...s, monsterIsBlocked: true }));
        await delay(600);
        setAnimState(s => ({ ...s, monsterIsBlocked: false }));
    }

    setEnemyActionIndex(i => i + 1);
    setAnimState(s => ({ ...s, isAttacking: false }));
  };

  // --- RENDERING HELPERS ---

  // Calculate description for Selected Item based on context
  const selectedDescription = useMemo(() => {
    if (!selectedItem) return null;
    
    // If the selected item is in the Kept bar, we need to find its index to calculate synergy
    if (selectedItem.uniqueId && selectedItem.uniqueId.startsWith('kept-')) {
        const index = keptItems.findIndex(k => k.uniqueId === selectedItem.uniqueId);
        if (index !== -1) {
             return getDynamicDescription(selectedItem, keptItems.slice(0, index));
        }
    }
    // Fallback for inventory items (no synergy applied yet)
    return getDynamicDescription(selectedItem, []);
  }, [selectedItem, keptItems]);

  return (
    <div className="fixed inset-0 w-full h-full bg-neutral-900 flex items-center justify-center overflow-hidden font-sans">
      <div className="w-full h-[100dvh] sm:w-[420px] sm:h-[800px] sm:max-h-[95vh] bg-slate-50 text-slate-800 select-none flex flex-col relative sm:rounded-[2rem] sm:border-[8px] sm:border-gray-800 sm:shadow-2xl overflow-hidden">
        
        {/* TOP BAR */}
        <header className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-30 flex-shrink-0 relative">
          <span className="text-slate-800 text-base tracking-tighter flex items-center gap-2 font-serif relative z-10">
            <span><strong>Daily</strong>Rogue</span>
          </span>
          <div className="absolute left-1/2 -translate-x-1/2 text-xs text-slate-600 font-sans leading-relaxed whitespace-nowrap">
              Monday, Jan. 3rd
          </div>
          <button onClick={() => setModals({...modals, settings: true})} className="flex gap-1 relative z-10 p-2 cursor-pointer hover:bg-slate-100 rounded-full">
             <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
             <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          </button>
        </header>

        {/* MAIN VIEWPORT */}
        <div className="flex-1 w-full relative flex flex-row overflow-hidden">
            
            {/* LEFT PANEL: INFO */}
            <div className="w-1/2 h-full border-r border-slate-200 bg-slate-50 relative flex flex-col overflow-hidden">
               <div className="h-1/2 w-full border-b border-slate-100 overflow-hidden relative bg-slate-50/50 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {selectedItem ? (
                      <motion.div
                        key={selectedItem.uniqueId || selectedItem.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 flex items-center justify-center ${ITEM_BG_COLORS[selectedItem.bg] || ITEM_BG_COLORS.Default}`}
                      >
                        <motion.div animate={{ y: [0, -4, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                            <Sprite index={selectedItem.id} size={120} bgClass="bg-transparent" />
                        </motion.div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {/* Player Health */}
                  <motion.div 
                    className="absolute bottom-2 left-2 z-20 flex items-end gap-2"
                    animate={animState.playerIsHit ? { x: [-3, 3, -3, 3, 0] } : { x: 0 }}
                  >
                     <motion.button
                       whileTap={{ scale: 0.9 }}
                       onClick={() => setModals({...modals, user: true})}
                       style={{ backgroundColor: animState.playerIsHit ? undefined : CONFIG.COLORS.DARK_PURPLE }}
                       className={`w-10 h-10 rounded text-white flex items-center justify-center shadow-md transition-colors duration-200 ${animState.playerIsHit ? 'bg-red-600' : 'hover:opacity-90'}`}
                     >
                       <User size={20} />
                     </motion.button>
                     <div className="flex gap-1 mb-1">
                        {[0, 1, 2].map(i => (
                          <Heart key={i} size={12} fill={i < stats.playerHealth ? (animState.playerIsHit ? '#dc2626' : CONFIG.COLORS.DARK_PURPLE) : '#cbd5e1'} color={i < stats.playerHealth ? (animState.playerIsHit ? '#dc2626' : CONFIG.COLORS.DARK_PURPLE) : '#cbd5e1'} />
                        ))}
                     </div>
                  </motion.div>
               </div>

               {/* Description Panel */}
               <div className="h-1/2 px-4 pt-2 pb-16 flex flex-col overflow-y-auto no-scrollbar bg-[#f2e8dc]">
                 <AnimatePresence mode="wait">
                   {selectedItem ? (
                     <motion.div 
                        key={selectedItem.uniqueId || selectedItem.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col h-full"
                     >
                        <h2 className="font-serif font-bold text-base text-slate-800 leading-tight mb-1 mt-1">{selectedItem.name}</h2>
                        <div className="mb-1"><TypeBadge type={selectedItem.type} /></div>
                        <FormattedDescription text={selectedDescription} />
                     </motion.div>
                   ) : <div className="flex-1" />}
                 </AnimatePresence>
               </div>
            </div>

            {/* RIGHT PANEL: MONSTER */}
            <div className="w-1/2 h-full flex flex-col relative overflow-hidden bg-[#354f46]">
               
               {/* Monster Visual */}
               <div className="h-1/2 w-full relative flex flex-col items-center justify-center overflow-hidden border-b border-white/5">
                   <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-black/10 pointer-events-none" />
                   <div className="relative z-10 flex items-center justify-center pointer-events-none mb-4">
                     {animState.isBleeding && (
                        <div className="absolute inset-0 flex items-center justify-center z-50">
                            {Array.from({length:10}).map((_,i)=><motion.div key={i} initial={{opacity:0,y:0}} animate={{opacity:[1,0],y:[0,50],x:[(Math.random()-0.5)*50,(Math.random()-0.5)*100]}} transition={{duration:1,repeat:Infinity,delay:Math.random()}} className="absolute w-2 h-2 bg-red-600 rounded-full"/>)}
                        </div>
                     )}
                     {animState.isPoisoned && (
                        <div className="absolute inset-0 flex items-center justify-center z-50">
                            {Array.from({length:8}).map((_,i)=><motion.div key={i} initial={{opacity:0}} animate={{opacity:[0,1,0],y:[10,-30],x:(Math.random()-0.5)*40}} transition={{duration:1.5,repeat:Infinity,delay:Math.random()}} className="absolute w-3 h-3 bg-green-500 border border-green-700 opacity-80"/>)}
                        </div>
                     )}
                     <motion.div
                        animate={animState.enemyIsAttacking ? { scale: 1.4, y: 10 } : { y: 0, scale: 1, filter: animState.monsterIsBlocked ? "grayscale(100%) opacity(0.8)" : "brightness(1)" }}
                     >
                        <div className="w-24 h-24 relative overflow-hidden">
                           <motion.div 
                              animate={animState.monsterIsHit ? { x: [-5, 5, -5, 5, 0], filter: "brightness(2)" } : { x: 0, filter: "brightness(1)" }}
                              className="w-full h-full"
                              style={{ 
                                backgroundImage: `url(${CONFIG.MONSTER_SRC})`, 
                                backgroundPosition: `-${2 * CONFIG.SPRITE_SIZE * (96/CONFIG.SPRITE_SIZE)}px -${4 * CONFIG.SPRITE_SIZE * (96/CONFIG.SPRITE_SIZE)}px`, // Row 4 Col 2
                                backgroundSize: `${CONFIG.MONSTER_SHEET_WIDTH * (96/CONFIG.SPRITE_SIZE)}px auto`,
                                imageRendering: 'pixelated'
                              }} 
                           />
                           {animState.monsterIsBlocked && <div className="absolute inset-0 flex items-center justify-center"><span className="text-red-600 font-bold bg-white/80 px-2 rounded -rotate-12 border border-red-500">BLOCKED</span></div>}
                        </div>
                     </motion.div>
                   </div>
               </div>

               {/* UPDATED: UNIFIED BATTLE HUD (Stats + Actions) */}
               <div className="h-1/2 w-full flex items-center justify-center relative z-0">
                  <div className="w-full max-w-[280px] bg-neutral-900/90 backdrop-blur-md rounded-xl border border-neutral-700 shadow-2xl flex flex-col overflow-hidden">
                    
                    {/* TOP: Stats */}
                    <div className="grid grid-cols-3 divide-x divide-neutral-800 border-b border-neutral-800 bg-neutral-900/50 py-2">
                        <div className="flex flex-col items-center gap-1"><span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Magic</span><AnimatedStat value={enemy.magic} colorClass="text-fuchsia-400 font-bold text-xl font-serif leading-none" /></div>
                        <div className="flex flex-col items-center gap-1"><span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Armor</span><AnimatedStat value={enemy.armor} colorClass="text-slate-200 font-bold text-xl font-serif leading-none" /></div>
                        <div className="flex flex-col items-center gap-1"><span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Health</span><AnimatedStat value={enemy.body} colorClass="text-red-500 font-bold text-xl font-serif leading-none" /></div>
                    </div>

                    {/* MIDDLE: Header */}
                    <div className="w-full bg-neutral-950/50 py-1 flex items-center justify-center border-b border-neutral-800">
                        <span className="text-[10px] font-bold text-neutral-400 font-serif tracking-widest uppercase">Action Pool</span>
                    </div>

                    {/* BOTTOM: Actions */}
                    <div className="p-3 w-full flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                        <span className={`text-xs font-sans leading-relaxed text-center ${enemyActionIndex % 3 === 0 ? "font-bold text-emerald-400" : "text-neutral-600"}`}>
                            Attack
                        </span>
                        <span className={`text-xs font-sans leading-relaxed text-center ${enemyActionIndex % 3 === 1 ? "font-bold text-emerald-400" : "text-neutral-600"}`}>
                            Skip
                        </span>
                        <span className={`text-xs font-sans leading-relaxed text-center ${enemyActionIndex % 3 === 2 ? "font-bold text-emerald-400" : "text-neutral-600"}`}>
                            Restore Armor
                        </span>
                    </div>
                  </div>
               </div>
            </div>
        </div>

        {/* CONTROLS */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 z-50"> 
            <motion.button
                disabled={stats.flaskCount === 0 || keptItems.length >= 5 || animState.isAttacking}
                whileTap={{ scale: 0.9 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${stats.flaskCount > 0 && keptItems.length < 5 && !animState.isAttacking ? 'bg-pink-900 text-white' : 'bg-slate-200 text-slate-400'}`}
                onClick={useFlask}
            ><FlaskRound size={18} /></motion.button>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center">
          <AnimatePresence>
            {keptItems.length === 5 && !animState.isAttacking && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.4, scale: 1, rotate: 360 }} exit={{ opacity: 0 }} transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" } }} className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-amber-300 via-red-500 to-transparent blur-[1px]" />
            )}
          </AnimatePresence>
          <motion.button
            disabled={keptItems.length < 5 || animState.isAttacking}
            animate={keptItems.length === 5 && !animState.isAttacking ? { scale: 1.1 } : { scale: 1 }}
            whileHover={keptItems.length === 5 && !animState.isAttacking ? { scale: 1.15 } : {}}
            whileTap={{ scale: 0.9 }}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors relative z-10 ${keptItems.length === 5 && !animState.isAttacking ? 'bg-gradient-to-b from-red-500 to-red-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            onClick={executeCombat}
          ><Sword size={28} strokeWidth={2.5} /></motion.button>
        </div>
        <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 z-50"> 
            <motion.button
                disabled={stats.rerollCount === 0 || animState.isAttacking}
                whileTap={{ scale: 0.9, rotate: -45 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${stats.rerollCount > 0 && !animState.isAttacking ? 'bg-blue-950 text-white' : 'bg-slate-200 text-slate-400'}`}
                onClick={handleReroll}
            ><RefreshCw size={18} /></motion.button>
        </div>

        {/* INVENTORY / BOTTOM PANEL */}
        <section className="h-1/2 bg-slate-900 border-t border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 flex flex-col relative overflow-hidden">
          <div className="w-full h-full overflow-hidden flex flex-col items-center p-0">
            {/* Kept Items Row */}
            <div className="h-24 w-full flex-shrink-0 border-b border-slate-800 flex items-center justify-center bg-slate-800/30 z-10">
              <div className="flex justify-center items-center gap-3 pt-6">
                {[0, 1, 2, 3, 4].map((slotIndex) => {
                  const item = keptItems[slotIndex];
                  const isActive = animState.activeItemIndex === slotIndex;
                  const isSelected = item && selectedItem && selectedItem.uniqueId === item.uniqueId;
                  
                  return (
                    <motion.div 
                      key={slotIndex}
                      animate={isActive ? { scale: 1.15, borderColor: "rgba(51, 65, 85, 1)" } : isSelected ? { scale: 1, borderColor: "rgba(13, 148, 136, 1)", boxShadow: "0 0 0 2px rgba(20, 184, 166, 1)" } : { scale: 1, borderColor: "rgba(51, 65, 85, 1)", boxShadow: "none" }}
                      className={`w-12 h-12 rounded-lg border flex items-center justify-center relative overflow-hidden ${item ? ITEM_BG_COLORS[item.bg] : 'bg-slate-800'}`}
                    >
                      {item ? (
                        <motion.div layoutId={`kept-${item.uniqueId}`} className="cursor-pointer w-full h-full flex items-center justify-center" onClick={() => handleKeptItemClick(item, slotIndex)}>
                          <Sprite index={item.id} size={40} bgClass="bg-transparent" />
                        </motion.div>
                      ) : <span className="text-slate-600 font-serif font-bold text-lg select-none">{slotIndex + 1}</span>}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 flex items-center justify-center w-full overflow-hidden min-h-0">
              <div className="grid grid-cols-4 gap-2">
                {gridItems.map((id, i) => {
                  const uniqueId = `grid-${i}`;
                  const isSelected = selectedItem && selectedItem.uniqueId === uniqueId;
                  const isKept = keptItems.some(k => k.sourceGridIndex === i);
                  
                  return (
                    <motion.div
                      key={uniqueId}
                      layoutId={`grid-item-${uniqueId}`}
                      className={`cursor-pointer rounded-sm relative transition-all duration-100 ${isSelected ? 'ring-2 ring-teal-500 shadow-lg z-10 scale-105' : 'hover:shadow-md'} ${isKept ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                      onClick={() => handleGridItemClick(id, i)}
                    >
                      <Sprite index={id} size={CONFIG.SPRITE_SIZE * 1.75} />
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="h-8 flex items-center justify-center gap-4 text-xs text-slate-500 font-mono uppercase tracking-widest select-none flex-shrink-0">
              <span>Flasks: <span className="text-slate-300">{stats.flaskCount}</span></span><span>|</span><span>Rerolls: <span className="text-slate-300">{stats.rerollCount}</span></span>
            </div>
          </div>
        </section>

        {/* MODALS */}
        <AnimatePresence>
          {modals.settings && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setModals({...modals, settings: false})}>
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center">
                 <h3 className="font-serif text-xl font-bold text-slate-800">Settings</h3>
                 <p className="text-slate-500 text-sm mt-2">Configuration options here.</p>
                 <button onClick={() => setModals({...modals, settings: false})} className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-full text-sm font-medium">Close</button>
              </motion.div>
            </motion.div>
          )}
           {modals.user && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setModals({...modals, user: false})}>
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center">
                 <div className="w-full flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center"><div style={{ backgroundImage: `url(${CONFIG.ROGUE_SRC})`, width: 96, height: 96, backgroundPosition: `-${2*32*3}px -${2*32*3}px`, backgroundSize: `${224*3}px`, imageRendering: 'pixelated'}} /></div>
                    <div className="flex gap-2">
                        <div className="w-12 h-12 border rounded-lg flex items-center justify-center text-slate-300 font-serif font-bold">1</div>
                        <div className="w-12 h-12 border rounded-lg flex items-center justify-center text-slate-300 font-serif font-bold">2</div>
                    </div>
                 </div>
                 <button onClick={() => setModals({...modals, user: false})} className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-full text-sm font-medium">Close</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
