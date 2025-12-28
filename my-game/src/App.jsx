import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- ASSET SYSTEM (PNG + EMOJI FALLBACK) ---

const Emoji = ({ symbol, size = 24, className = "", label }) => (
  <span 
    role="img" 
    aria-label={label || "icon"}
    className={`inline-flex items-center justify-center select-none leading-none ${className}`}
    style={{ 
      fontSize: typeof size === 'number' ? `${size}px` : size, 
      width: typeof size === 'number' ? `${size}px` : size, 
      height: typeof size === 'number' ? `${size}px` : size,
    }}
  >
    {symbol}
  </span>
);

/**
 * GameIcon:
 * Tries to render an image from /public/icons/{src}.
 * If that fails (file missing), it renders the fallback Emoji.
 */
const GameIcon = ({ src, fallback, size = 24, className = "", alt, filterStyle = "" }) => {
  const [imgError, setImgError] = useState(false);

  // If no source or error occurred, show Emoji
  if (!src || imgError) {
    return <Emoji symbol={fallback} size={size} className={className} label={alt} />;
  }

  return (
    <img 
      src={src} 
      alt={alt}
      onError={() => setImgError(true)}
      draggable={false}
      className={`select-none object-contain ${className} ${filterStyle}`}
      style={{ 
        width: typeof size === 'number' ? `${size}px` : size, 
        height: typeof size === 'number' ? `${size}px` : size, 
      }}
    />
  );
};

// --- CONFIGURATION & CONSTANTS ---

const GRID_SIZE = 16;
const MAX_KEPT = 4;
const INITIAL_SHINY_HP = 3;

// Game Balance / Stats
const MAX_STATS = {
  magic: 7,
  armor: 4,
  physical: 5,
  heart: 3
};

// Item Types
const ITEM_TYPES = {
  MAGIC: 'magic',
  ARMOR: 'armor',
  PHYSICAL: 'physical',
  SPECIAL: 'special'
};

// Data-Driven Icon Pool
// NOTE: 'imgSrc' assumes you have a folder in 'public' called 'icons'.
const ICON_POOL = [
  // --- Magic (Purple Backgrounds) ---
  { 
    id: 'magic_1',
    type: ITEM_TYPES.MAGIC,
    damage: 2,
    fallback: "⚡", 
    imgSrc: "/icons/staff_1.png",
    name: "Arcane Bolt", 
    desc: "Deals 2 Magic Damage.", 
    fallbackColor: "text-white", 
    bgColor: "bg-purple-600",
    borderColor: "border-purple-800"
  },
  { 
    id: 'magic_2',
    type: ITEM_TYPES.MAGIC,
    damage: 2,
    fallback: "🔥",
    imgSrc: "/icons/staff_2.png",
    name: "Incinerate", 
    desc: "Deals 2 Magic Damage.", 
    fallbackColor: "text-white",
    bgColor: "bg-purple-600",
    borderColor: "border-purple-800"
  },
  { 
    id: 'magic_3',
    type: ITEM_TYPES.MAGIC,
    damage: 2,
    fallback: "❄️",
    imgSrc: "/icons/gem_iron_old.png",
    name: "Glacial Spike", 
    desc: "Deals 2 Magic Damage.", 
    fallbackColor: "text-white",
    bgColor: "bg-purple-600",
    borderColor: "border-purple-800"
  },

  // --- Armor (Blue Backgrounds) ---
  { 
    id: 'armor_1',
    type: ITEM_TYPES.ARMOR,
    damage: 2,
    fallback: "⚓",
    imgSrc: "/icons/armor-anchor.png",
    name: "Heavy Slam", 
    desc: "Deals 2 Armor Damage.", 
    fallbackColor: "text-white",
    bgColor: "bg-blue-600",
    borderColor: "border-blue-800"
  },
  { 
    id: 'armor_2',
    type: ITEM_TYPES.ARMOR,
    damage: 2,
    fallback: "🧱",
    imgSrc: "/icons/armor-plate.png",
    name: "Plate Bash", 
    desc: "Deals 2 Armor Damage.", 
    fallbackColor: "text-white",
    bgColor: "bg-blue-600",
    borderColor: "border-blue-800"
  },
  { 
    id: 'armor_3',
    type: ITEM_TYPES.ARMOR,
    damage: 2,
    fallback: "💎",
    imgSrc: "/icons/armor-crystal.png",
    name: "Crystal Edge", 
    desc: "Deals 2 Armor Damage.", 
    fallbackColor: "text-white",
    bgColor: "bg-blue-600",
    borderColor: "border-blue-800"
  },

  // --- Physical (Red Backgrounds) ---
  { 
    id: 'phys_1',
    type: ITEM_TYPES.PHYSICAL,
    damage: 2,
    fallback: "⚔️",
    imgSrc: "/icons/blessed_blade.png",
    name: "Broadsword", 
    desc: "Deals 2 Physical Damage.", 
    fallbackColor: "text-white",
    bgColor: "bg-red-600",
    borderColor: "border-red-800"
  },
  { 
    id: 'phys_2',
    type: ITEM_TYPES.PHYSICAL,
    damage: 2,
    fallback: "🔨",
    imgSrc: "/icons/bardiche_1.png",
    name: "Warhammer", 
    desc: "Deals 2 Physical Damage.", 
    fallbackColor: "text-white", 
    bgColor: "bg-red-600",
    borderColor: "border-red-800"
  },
  { 
    id: 'phys_3',
    type: ITEM_TYPES.PHYSICAL,
    damage: 2,
    fallback: "🪓",
    imgSrc: "/icons/battle_axe_1.png",
    name: "Cleave", 
    desc: "Deals 2 Physical Damage.", 
    fallbackColor: "text-white", 
    bgColor: "bg-red-600",
    borderColor: "border-red-800"
  },

  // --- Special (Yellow Backgrounds) ---
  { 
    id: 'special_1',
    type: ITEM_TYPES.SPECIAL,
    damage: 0,
    fallback: "⭐",
    imgSrc: "/icons/special-star.png",
    name: "Cosmic Wish", 
    desc: "This is a special symbol.", 
    fallbackColor: "text-slate-900",
    bgColor: "bg-yellow-400",
    borderColor: "border-yellow-600"
  },
  { 
    id: 'special_2',
    type: ITEM_TYPES.SPECIAL,
    damage: 0,
    fallback: "🌙",
    imgSrc: "/icons/special-moon.png",
    name: "Nightshade", 
    desc: "This is a special symbol.", 
    fallbackColor: "text-slate-900",
    bgColor: "bg-yellow-400",
    borderColor: "border-yellow-600"
  },
  { 
    id: 'special_3',
    type: ITEM_TYPES.SPECIAL,
    damage: 0,
    fallback: "🪙",
    imgSrc: "/icons/special-coin.png",
    name: "Bounty", 
    desc: "This is a special symbol.", 
    fallbackColor: "text-slate-900",
    bgColor: "bg-yellow-400",
    borderColor: "border-yellow-600"
  },
];

// --- LOGIC HELPERS ---

const generateUniqueId = (index) => `${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const generateGrid = () => {
  return Array.from({ length: GRID_SIZE }).map((_, index) => {
    const data = ICON_POOL[Math.floor(Math.random() * ICON_POOL.length)];
    return {
      uniqueId: generateUniqueId(index),
      index: index,
      ...data
    };
  });
};

const getActiveDefenseLayer = (stats) => {
  if (stats.magic > 0) return 'magic';
  if (stats.armor > 0) return 'armor';
  if (stats.physical > 0) return 'physical';
  if (stats.heart > 0) return 'heart';
  return null;
};

const calculateDamageAction = (item, activeLayer) => {
  if (!activeLayer) return 0;

  if (activeLayer === 'heart') {
    if (item.type === ITEM_TYPES.MAGIC) return 1;
    if (item.type === ITEM_TYPES.ARMOR) return 1;
    if (item.type === ITEM_TYPES.PHYSICAL) return 3;
    return 0;
  }

  if (item.type === activeLayer) {
    return item.damage;
  }

  return 0;
};

// --- SUB-COMPONENTS ---

// Helper for Shiny Styles - EXAGGERATED & OVERLAY SPARKS
const DefenseSlot = React.memo(({ imgSrc, fallback, fallbackColor, isBroken, bgFill, isShiny, shinyHp }) => {
  
  const sparkles = useMemo(() => {
    if (!isShiny) return [];
    const colors = ['bg-slate-300', 'bg-yellow-400', 'bg-red-600', 'bg-neutral-900'];
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      color: colors[i % colors.length],
      angle: (i * 45) * (Math.PI / 180), 
      delay: i * 0.1,
      distance: 18 
    }));
  }, [isShiny]);

  return (
    <div className="w-6 h-6 flex items-center justify-center relative">
      <AnimatePresence>
        {!isBroken && (
          <motion.div
            key="defense-icon-wrapper"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ 
              scale: 1.5, 
              opacity: 0, 
              filter: "blur(10px)",
              transition: { duration: 0.3 } 
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {isShiny ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                    className="relative z-0"
                    animate={{ 
                      y: [-2, 2, -2],
                      rotate: [-12, 12, -12],
                      scale: [0.9, 1.2, 0.9]
                    }}
                    transition={{ 
                      y: { duration: 0.3, repeat: Infinity, ease: "easeInOut" },
                      rotate: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
                      scale: { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
                    }}
                >
                    <GameIcon
                      src={imgSrc}
                      fallback={fallback}
                      size={22} 
                      className={`${fallbackColor} ${bgFill ? 'opacity-90' : ''} drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]`} 
                    />
                </motion.div>

                <div className="absolute inset-0 z-10 pointer-events-none">
                  {sparkles.map((sparkle) => (
                    <motion.div
                      key={sparkle.id}
                      className={`absolute w-1.5 h-1.5 rotate-45 ${sparkle.color}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.4, 0], 
                        opacity: [0, 1, 0],
                        x: [0, Math.cos(sparkle.angle) * sparkle.distance],
                        y: [0, Math.sin(sparkle.angle) * sparkle.distance],
                        rotate: [45, 225]
                      }}
                      transition={{ 
                        duration: 0.8, 
                        repeat: Infinity, 
                        delay: sparkle.delay,
                        ease: "easeOut" 
                      }}
                      style={{
                        left: '50%',
                        top: '50%',
                        marginTop: '-3px',
                        marginLeft: '-3px'
                      }}
                    />
                  ))}
                </div>

                {shinyHp > 0 && shinyHp < INITIAL_SHINY_HP && (
                   <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                     <motion.div 
                       key={`hp-${shinyHp}`}
                       initial={{ scale: 2, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       className="font-black text-white text-[14px] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                       style={{ textShadow: "0px 0px 4px #000" }}
                     >
                       {shinyHp}
                     </motion.div>
                   </div>
                )}
              </div>
            ) : (
              <GameIcon
                src={imgSrc}
                fallback={fallback}
                size={22} 
                className={`${fallbackColor} ${bgFill ? 'opacity-80' : ''} relative z-10 drop-shadow-[0_2px_0_rgba(0,0,0,1)]`} 
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// --- MAIN APP ---

export default function App() {
  const [gridItems, setGridItems] = useState(() => generateGrid());
  const [selectedId, setSelectedId] = useState(null); 
  const [keptIds, setKeptIds] = useState([]); 
  const [isBlueTheme, setIsBlueTheme] = useState(false);
  const [activeModal, setActiveModal] = useState(null); 
  const [isRerolling, setIsRerolling] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  
  // Player Stats
  const [playerHp, setPlayerHp] = useState(50);
  const [maxPlayerHp, setMaxPlayerHp] = useState(50);

  const [enemyStats, setEnemyStats] = useState({ ...MAX_STATS });
  
  // Updated Shiny State for 4 Layers
  const [shinyHealth, setShinyHealth] = useState({ 
    magic: INITIAL_SHINY_HP, 
    armor: INITIAL_SHINY_HP, 
    physical: INITIAL_SHINY_HP, 
    heart: INITIAL_SHINY_HP 
  });
  
  const [shinyIndices, setShinyIndices] = useState({ 
    magic: -1, 
    armor: -1, 
    physical: -1, 
    heart: -1 
  });

  useEffect(() => {
    setShinyIndices({
      magic: Math.floor(Math.random() * MAX_STATS.magic),
      armor: Math.floor(Math.random() * MAX_STATS.armor),
      physical: Math.floor(Math.random() * MAX_STATS.physical),
      heart: Math.floor(Math.random() * MAX_STATS.heart),
    });
  }, []); 

  const selectedItem = useMemo(() => 
    gridItems.find(item => item.index === selectedId), 
  [gridItems, selectedId]);

  const keptItems = useMemo(() => 
    keptIds.map(id => gridItems.find(item => item.index === id)).filter(Boolean),
  [gridItems, keptIds]);

  const isAttackReady = keptIds.length === MAX_KEPT;

  const theme = useMemo(() => ({
    bg: isBlueTheme ? 'bg-[#0B1121]' : 'bg-[#0A261D]',
    tileBase: isBlueTheme ? 'bg-[#1E293B]' : 'bg-[#16382D]',
    tileHover: isBlueTheme ? 'hover:bg-[#334155]' : 'hover:bg-[#1E4538]',
    neonColor: isBlueTheme ? 'text-[#38BDF8]' : 'text-[#00FF94]',
    neonBg: isBlueTheme ? 'bg-[#38BDF8]' : 'bg-[#00FF94]',
    toggleTrack: isBlueTheme ? 'bg-[#1E293B] border-[#334155]' : 'bg-[#16382D] border-[#2F5E4D]',
    toggleKnob: isBlueTheme ? 'bg-[#38BDF8]' : 'bg-[#00FF94]',
    selectedBg: isBlueTheme ? 'bg-[#38BDF8]' : 'bg-[#00FF94]',
    selectedShadow: isBlueTheme ? 'shadow-[0_0_20px_rgba(56,189,248,0.6)]' : 'shadow-[0_0_20px_rgba(0,255,148,0.6)]',
    selectedText: 'text-[#0F172A]',
    squareGreenBg: 'bg-[#0A261D]', 
    squareBlueBg: 'bg-[#0B1121]', 
    squareGreenIcon: 'text-[#00FF94]',
    squareBlueIcon: 'text-[#38BDF8]',
  }), [isBlueTheme]);

  // Construct the Defense Grid Flat List
  // Order: Heart (Innermost) -> Physical -> Armor -> Magic (Outermost)
  const defenseRows = useMemo(() => {
    const types = ['heart', 'physical', 'armor', 'magic'];
    const configs = {
      // Aligned colors with new Grid Logic
      heart: { fallback: "❤️", imgSrc: "/icons/stat-heart.png", color: 'text-red-500', glow: 'teal' },
      physical: { fallback: "💪", imgSrc: "/icons/stat-muscle.png", color: 'text-red-500', glow: 'teal' }, 
      armor: { fallback: "🛡️", imgSrc: "/icons/stat-shield.png", color: 'text-blue-500', glow: 'teal' }, 
      magic: { fallback: "✨", imgSrc: "/icons/misc_phial.png", color: 'text-purple-500', glow: 'teal' } 
    };

    let flatList = [];
    
    types.forEach(type => {
      const max = MAX_STATS[type];
      const current = enemyStats[type];
      const shinyIdx = shinyIndices[type];

      for (let i = 0; i < max; i++) {
        flatList.push({
           uniqueKey: `${type}-${i}`,
           type,
           fallback: configs[type].fallback,
           imgSrc: configs[type].imgSrc,
           color: configs[type].color,
           glowColor: configs[type].glow,
           // Check logic: if current is 3, then 0,1,2 are active. 3,4... are broken.
           isBroken: i >= current,
           isShiny: i === shinyIdx,
           shinyHp: shinyHealth[type]
        });
      }
    });

    // Chunk into 4s
    const rows = [];
    for (let i = 0; i < flatList.length; i += 4) {
        rows.push(flatList.slice(i, i + 4));
    }
    return rows;
  }, [enemyStats, shinyIndices, shinyHealth]);

  const handleTileClick = useCallback((index) => {
    if (isAttacking) return;
    if (keptIds.includes(index)) return;
    
    if (selectedId === index) {
      if (keptIds.length < MAX_KEPT) {
        setKeptIds(prev => [...prev, index]);
      }
    } else {
      setSelectedId(index);
    }
  }, [isAttacking, keptIds, selectedId]);

  const handleRefresh = useCallback(() => {
    if (isAttacking) return;
    setIsRerolling(true);
    setSelectedId(null);
    setKeptIds([]);
    setGridItems(generateGrid());
    setTimeout(() => {
      setIsRerolling(false);
    }, 300);
  }, [isAttacking]);

  const handleAttack = async () => {
    if (isAttacking) return;
    setIsAttacking(true);
    setSelectedId(null);

    let currentStats = { ...enemyStats };
    let currentShinyHealth = { ...shinyHealth }; 

    for (const item of keptItems) {
      const targetLayer = getActiveDefenseLayer(currentStats);
      const damage = calculateDamageAction(item, targetLayer);

      if (targetLayer && damage > 0) {
        for (let i = 0; i < damage; i++) {
            if (currentStats[targetLayer] > 0) {
                const topIndex = currentStats[targetLayer] - 1;
                const isShinyTarget = shinyIndices[targetLayer] === topIndex;

                if (isShinyTarget) {
                   if (currentShinyHealth[targetLayer] > 1) {
                      currentShinyHealth[targetLayer] -= 1;
                      setShinyHealth({ ...currentShinyHealth });
                      await new Promise(resolve => setTimeout(resolve, 150));
                      continue; 
                   } else {
                      currentShinyHealth[targetLayer] = 0;
                      setShinyHealth({ ...currentShinyHealth });
                   }
                }

                currentStats[targetLayer] -= 1;
                setEnemyStats({ ...currentStats });
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        }
      }
    }

    const newGrid = [...gridItems];
    keptIds.forEach(id => {
       const newItem = ICON_POOL[Math.floor(Math.random() * ICON_POOL.length)];
       newGrid[id] = {
         uniqueId: generateUniqueId(id),
         index: id,
         ...newItem
       };
    });

    setGridItems(newGrid);
    setKeptIds([]);
    setIsAttacking(false);
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-neutral-900 font-sans select-none p-0 sm:p-4">
      <div className="flex flex-col w-full max-w-md h-[100dvh] sm:h-[90vh] sm:max-h-[800px] bg-[#F5F2EB] text-slate-900 overflow-hidden shadow-2xl relative border-0">
        
        {/* --- Top Half: Viewport --- */}
        <div className="h-1/2 flex flex-col z-10 relative">
          
          {/* Header Bar */}
          <div className="h-12 shrink-0 flex items-center justify-between px-2 sm:px-4 bg-[#450a0a] border-b border-red-950 overflow-hidden relative">
            
            {/* Left Half: Protocol & Money */}
            <div className="w-1/2 h-full flex border-r border-red-900/30 pr-1 overflow-hidden">
              
              {/* Protocol - 50% width fixed */}
              <div className="w-1/2 flex items-center justify-start gap-1.5 sm:gap-2 shrink-0 z-10 pl-1">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#450a0a]">
                  <span className="font-bold text-[10px]">01</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold tracking-widest text-red-200 leading-tight">Day 1</span>
                  <span className="text-xs font-bold text-white tracking-tight leading-tight">Hunted</span>
                </div>
              </div>

              {/* Money - 50% width fixed */}
              <div className="w-1/2 flex items-center justify-start gap-1.5 sm:gap-2 shrink-0 z-10 pl-2">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-[#450a0a] shadow-sm">
                   <GameIcon fallback="🪙" imgSrc="/icons/ui-coin.png" size={14} />
                </div>
                <div className="flex flex-col">
                   <span className="text-[8px] uppercase font-bold tracking-widest text-red-200 leading-tight">Money</span>
                   <span className="text-xs font-bold text-white tracking-tight leading-tight">100</span>
                </div>
              </div>

            </div>
            
            {/* Right Half: Player HP (Restricted to right side) */}
            <div className="w-1/2 h-full flex items-center justify-start pl-3 sm:pl-4">
                <div className="flex items-center gap-2 shrink-0 z-10">
                    <div className="flex flex-col items-end justify-center mr-1">
                        <span className="text-[10px] font-bold text-red-200 leading-none mb-0.5">HP</span>
                        <span className="text-xs font-black text-white leading-none tracking-tight">{playerHp}/{maxPlayerHp}</span>
                    </div>
                    <div className="w-20 sm:w-24 h-3 bg-black/40 rounded-full border border-red-900/50 relative overflow-hidden">
                        <motion.div 
                          className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-600 to-red-500"
                          initial={{ width: '100%' }}
                          animate={{ width: `${(playerHp / maxPlayerHp) * 100}%` }}
                          transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        />
                        {/* Shine effect on bar */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/20" />
                    </div>
                    <GameIcon fallback="❤️" imgSrc="/icons/ui-heart.png" size={18} className="text-red-500" />
                </div>
            </div>

          </div>

          {/* Main Display Area */}
          <div className="flex-1 flex bg-[#F5F2EB] min-h-0 relative">
            
            {/* Left Section: Info & Selection */}
            <div className="w-1/2 border-r border-slate-200 relative overflow-hidden">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 z-10" />

              {/* Theme Buttons */}
              <div className="absolute top-0 left-0 right-0 h-[25%] flex items-center justify-center gap-3">
                 <button 
                    onClick={() => setActiveModal('green')}
                    className={`w-12 h-12 ${theme.squareGreenBg} rounded-lg shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer group`}
                 >
                    <GameIcon fallback="🌱" imgSrc="/icons/ui-sprout.png" size={24} className={`${theme.squareGreenIcon} group-hover:opacity-80`} />
                 </button>
                 <button 
                    onClick={() => setActiveModal('blue')}
                    className={`w-12 h-12 ${theme.squareBlueBg} rounded-lg shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer group`}
                 >
                    <GameIcon fallback="💀" imgSrc="/icons/ui-skull.png" size={24} className={`${theme.squareBlueIcon} group-hover:opacity-80`} />
                 </button>
              </div>

              {/* Kept Items Display */}
              <div className="absolute top-[25%] bottom-[50%] left-0 right-0 flex items-center justify-center px-3">
                <div className="flex gap-2 z-10 pointer-events-auto">
                   {Array.from({ length: MAX_KEPT }).map((_, i) => {
                     const item = keptItems[i];
                     return (
                       <div 
                         key={i}
                         onClick={() => item && !isAttacking && setSelectedId(item.index)}
                         className={`
                           w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-all
                           ${item 
                             ? `${item.bgColor} shadow-sm cursor-pointer` 
                             : 'bg-slate-200/50 border border-slate-200/50'} 
                           ${item && !isAttacking ? 'hover:scale-105 active:scale-95' : ''}
                         `}
                       >
                         {item && (
                           <GameIcon 
                              src={item.imgSrc}
                              fallback={item.fallback}
                              size={18} 
                              className="drop-shadow-sm" 
                              filterStyle="grayscale brightness-75 opacity-75"
                            />
                         )}
                       </div>
                     );
                   })}
                </div>
              </div>

              {/* Item Details Panel */}
              <div className="absolute top-1/2 left-0 right-0 bottom-0 flex flex-col justify-start px-3 pt-3">
                <div className="relative flex flex-col h-full">
                  {selectedItem && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={selectedItem.index} 
                      className="flex flex-col h-full"
                    >
                      <div className="shrink-0 mb-2">
                         <div className={`w-8 h-8 rounded flex items-center justify-center mb-1 ${selectedItem.bgColor}`}>
                             <GameIcon 
                                src={selectedItem.imgSrc}
                                fallback={selectedItem.fallback}
                                size={20} 
                                className="drop-shadow-sm" 
                              />
                         </div>
                        <h2 className="text-lg font-black leading-none uppercase tracking-tighter text-slate-900 mb-1">
                          {selectedItem.name}
                        </h2>
                        <div className="h-0.5 w-8 bg-black mb-2"/>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-1">
                        <p className="text-xs font-semibold text-slate-500 leading-tight">
                          {selectedItem.desc}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section: Enemy & Defense Layers */}
            <div className="w-1/2 relative bg-slate-50 border-l border-slate-100 -ml-px z-20">
               <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
               
               {/* Enemy Header */}
               <div className="absolute top-0 left-0 right-0 h-[25%] px-4 flex items-center justify-between overflow-hidden bg-[#241a16] -mr-[1px] -mt-[1px] border-b border-[#3a2a24]">
                  <div className="h-full py-3 flex items-center justify-start gap-1">
                    <GameIcon fallback="🐌" imgSrc="/icons/ui-snail.png" className="text-purple-300 h-full w-auto max-h-[50px]" />
                    <div className="flex flex-col justify-center h-full">
                       <span className="text-[#e7dace] font-black uppercase text-base tracking-wider leading-none">Snail</span>
                       <span className="text-[#8c6b5d] text-[10px] font-bold tracking-widest uppercase">Lvl 12</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2 h-full py-2 mr-1">
                     <GameIcon fallback="📈" imgSrc="/icons/ui-stats.png" size={22} className="text-emerald-300" />
                     <GameIcon fallback="🚫" imgSrc="/icons/ui-block.png" size={22} className="text-slate-300" />
                  </div>
               </div>

               {/* Defense Stack */}
               <div className="absolute top-[25%] left-0 right-0 bottom-0 flex flex-col items-center justify-center p-2 z-10">
                 <div className="flex flex-col gap-1 w-fit mx-auto max-h-full overflow-hidden">
                    {defenseRows.map((row, rIdx) => (
                      <div key={rIdx} className="flex justify-start gap-2 py-0.5">
                        {row.map(slot => (
                           <DefenseSlot 
                             key={slot.uniqueKey}
                             imgSrc={slot.imgSrc}
                             fallback={slot.fallback}
                             isBroken={slot.isBroken} 
                             fallbackColor={slot.color} 
                             bgFill 
                             isShiny={slot.isShiny}
                             shinyHp={slot.shinyHp}
                             shinyBgColor="bg-teal-400/30"
                           />
                        ))}
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* --- Bottom Half: Controls & Grid --- */}
        <div className={`h-1/2 ${theme.bg} px-4 pt-2 pb-8 flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.2)] relative z-20 rounded-t-2xl transition-colors duration-500`}>
          
          {/* Controls Header */}
          <div className="mb-1 grid grid-cols-3 items-center shrink-0 h-12">
            
            {/* Theme Toggle */}
            <div className="flex justify-start">
              <div 
                className={`w-14 h-8 rounded-full border ${theme.toggleTrack} flex items-center px-1 cursor-pointer transition-colors duration-300`}
                onClick={() => !isAttacking && setIsBlueTheme(!isBlueTheme)}
              >
                <motion.div 
                  className={`w-5 h-5 rounded-full shadow-md ${theme.toggleKnob}`}
                  animate={{ x: isBlueTheme ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </div>

            {/* Attack Button */}
            <div className="flex justify-center">
              <button 
                disabled={!isAttackReady || isAttacking}
                onClick={handleAttack}
                className={`
                  w-20 h-10 rounded-lg border flex items-center justify-center group relative overflow-hidden transition-all duration-300
                  ${isAttackReady && !isAttacking
                    ? 'bg-[#dc2626] border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)] active:scale-95 cursor-pointer' 
                    : 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                 {isAttackReady && !isAttacking && (
                   <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 pointer-events-none" />
                 )}
                 <GameIcon
                    fallback="⚔️"
                    imgSrc="/icons/ui-sword-attack.png"
                    className={`
                      transition-transform duration-300
                      ${isAttackReady && !isAttacking
                        ? 'text-[#450a0a] group-hover:scale-110' 
                        : 'text-slate-500 opacity-50 grayscale' 
                      }
                    `} 
                    size={24} 
                 />
              </button>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end">
              <button 
                disabled={isAttacking}
                onClick={handleRefresh}
                className={`
                  group flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200
                  ${isRerolling 
                    ? 'bg-yellow-600 text-yellow-100 scale-110 shadow-[0_0_15px_rgba(234,179,8,0.6)]' 
                    : `bg-slate-800/50 ${theme.neonColor} ${!isAttacking ? 'hover:bg-white/10' : 'opacity-50'}` 
                  }
                `}
              >
                <GameIcon 
                  fallback="🔄" 
                  imgSrc="/icons/ui-refresh.png"
                  size={18} 
                  className={`transition-transform duration-500 ${isRerolling ? 'rotate-180' : 'group-hover:rotate-45'}`} 
                />
              </button>
            </div>
          </div>

          {/* Grid Area */}
          <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-2 min-h-0">
            {gridItems.map((item) => {
              const isSelected = selectedId === item.index;
              const isKept = keptIds.includes(item.index);
              
              return (
                <button
                  key={item.index}
                  disabled={isAttacking}
                  onClick={() => handleTileClick(item.index)}
                  className={`
                    relative rounded-lg flex items-center justify-center overflow-hidden
                    border-b-4 transition-transform duration-100 ease-out
                    ${isKept
                      ? 'bg-slate-700/80 border-slate-900 cursor-not-allowed opacity-50'
                      : isSelected 
                        ? `${theme.selectedBg} border-white ${theme.selectedShadow} z-10 -translate-y-1`
                        : `${item.bgColor} ${item.borderColor} hover:brightness-110 ${!isAttacking ? 'active:border-b-0 active:translate-y-1' : ''}`
                    }
                  `}
                >
                  <GameIcon
                    src={item.imgSrc}
                    fallback={item.fallback}
                    size={42} // Larger size for Grid
                    className={`
                      transition-all duration-200 drop-shadow-lg
                      ${isKept 
                        ? ''
                        : isSelected 
                          ? 'scale-110'
                          : ''
                      }
                    `}
                    filterStyle={isKept ? 'grayscale blur-[1px]' : ''}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* --- MODALS --- */}
        <AnimatePresence>
          {activeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className={`
                  w-full max-w-sm bg-[#F5F2EB] rounded-2xl shadow-2xl border-4 overflow-hidden
                  ${activeModal === 'green' ? 'border-[#0A261D]' : 'border-[#0B1121]'}
                `}
              >
                <div className={`
                  px-4 py-3 flex items-center justify-between
                  ${activeModal === 'green' ? 'bg-[#0A261D]' : 'bg-[#0B1121]'}
                `}>
                  <h3 className={`font-bold uppercase tracking-wider text-sm ${activeModal === 'green' ? 'text-emerald-100' : 'text-sky-100'}`}>
                    {activeModal === 'green' ? 'Nature Protocol' : 'Vermin Protocol'}
                  </h3>
                  <button 
                    onClick={() => setActiveModal(null)}
                    className={`${activeModal === 'green' ? 'text-emerald-300 hover:text-white' : 'text-sky-300 hover:text-white'} transition-colors`}
                  >
                    <Emoji symbol="❌" size={20} />
                  </button>
                </div>

                <div className="p-6">
                  <div className={`
                    w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-inner
                    ${activeModal === 'green' ? 'bg-[#0A261D]' : 'bg-[#0B1121]'}
                  `}>
                    {activeModal === 'green' ? (
                      <GameIcon fallback="🌱" imgSrc="/icons/ui-sprout.png" size={32} className="text-[#00FF94]" />
                    ) : (
                      <GameIcon fallback="💀" imgSrc="/icons/ui-skull.png" size={32} className="text-[#38BDF8]" />
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3].map((num) => (
                      <div key={num} className="bg-slate-200/50 p-2 rounded-lg flex items-center gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                         <span className="text-xs font-semibold text-slate-500 leading-tight">Buff {num}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
