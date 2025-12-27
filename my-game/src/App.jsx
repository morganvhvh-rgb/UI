import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, Shield, Zap, Heart, Star, Skull, Ghost, Gem, 
  Coins, Anchor, Cloud, Flame, Droplet, Sun, Moon, Snowflake,
  Settings, RefreshCw, Trophy, Aperture, Command,
  BicepsFlexed, Sparkles, Hammer, Leaf, CircleAlert,
  Sprout, X, MousePointerClick, ArrowUpRight,
  Snail, Bomb, TrendingUp, ShieldBan, Rat, TreeDeciduous,
  Axe, Hexagon, FlaskRound
} from 'lucide-react';

// --- CONFIGURATION & CONSTANTS ---

const GRID_SIZE = 16;
const MAX_KEPT = 4;
const INITIAL_SHINY_HP = 3;

// Game Balance / Stats
const MAX_STATS = {
  magic: 8,
  armor: 8,
  physical: 4,
  heart: 4
};

// Item Types - For scalability & easier logic checks
const ITEM_TYPES = {
  MAGIC: 'magic',
  ARMOR: 'armor',
  PHYSICAL: 'physical',
  SPECIAL: 'special'
};

// Data-Driven Icon Pool
const ICON_POOL = [
  // --- Magic (3) ---
  { 
    id: 'magic_1',
    type: ITEM_TYPES.MAGIC,
    damage: 1,
    icon: Zap, 
    name: "Arcane Bolt", 
    desc: "Deals 1 Magic Damage.", 
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  { 
    id: 'magic_2',
    type: ITEM_TYPES.MAGIC,
    damage: 1,
    icon: Flame, 
    name: "Incinerate", 
    desc: "Deals 1 Magic Damage.", 
    color: "text-orange-500",
    bgColor: "bg-orange-100"
  },
  { 
    id: 'magic_3',
    type: ITEM_TYPES.MAGIC,
    damage: 1,
    icon: Snowflake, 
    name: "Glacial Spike", 
    desc: "Deals 1 Magic Damage.", 
    color: "text-cyan-600",
    bgColor: "bg-cyan-100"
  },

  // --- Armor (3) ---
  { 
    id: 'armor_1',
    type: ITEM_TYPES.ARMOR,
    damage: 1,
    icon: Anchor, 
    name: "Heavy Slam", 
    desc: "Deals 1 Armor Damage.", 
    color: "text-slate-600",
    bgColor: "bg-slate-200"
  },
  { 
    id: 'armor_2',
    type: ITEM_TYPES.ARMOR,
    damage: 1,
    icon: Hexagon, 
    name: "Plate Bash", 
    desc: "Deals 1 Armor Damage.", 
    color: "text-blue-700",
    bgColor: "bg-blue-100"
  },
  { 
    id: 'armor_3',
    type: ITEM_TYPES.ARMOR,
    damage: 1,
    icon: Gem, 
    name: "Crystal Edge", 
    desc: "Deals 1 Armor Damage.", 
    color: "text-teal-600",
    bgColor: "bg-teal-100"
  },

  // --- Physical (3) ---
  { 
    id: 'phys_1',
    type: ITEM_TYPES.PHYSICAL,
    damage: 3,
    icon: Sword, 
    name: "Broadsword", 
    desc: "Deals 3 Physical Damage.", 
    color: "text-red-600",
    bgColor: "bg-red-100"
  },
  { 
    id: 'phys_2',
    type: ITEM_TYPES.PHYSICAL,
    damage: 3,
    icon: Hammer, 
    name: "Warhammer", 
    desc: "Deals 3 Physical Damage.", 
    color: "text-amber-700", 
    bgColor: "bg-amber-100"
  },
  { 
    id: 'phys_3',
    type: ITEM_TYPES.PHYSICAL,
    damage: 3,
    icon: Axe, 
    name: "Cleave", 
    desc: "Deals 3 Physical Damage.", 
    color: "text-orange-700", 
    bgColor: "bg-orange-200"
  },

  // --- Special (3) ---
  { 
    id: 'special_1',
    type: ITEM_TYPES.SPECIAL,
    damage: 0,
    icon: Star, 
    name: "Cosmic Wish", 
    desc: "This is a special symbol.", 
    color: "text-yellow-500",
    bgColor: "bg-yellow-100"
  },
  { 
    id: 'special_2',
    type: ITEM_TYPES.SPECIAL,
    damage: 0,
    icon: Moon, 
    name: "Nightshade", 
    desc: "This is a special symbol.", 
    color: "text-indigo-500",
    bgColor: "bg-indigo-100" 
  },
  { 
    id: 'special_3',
    type: ITEM_TYPES.SPECIAL,
    damage: 0,
    icon: Coins, 
    name: "Bounty", 
    desc: "This is a special symbol.", 
    color: "text-amber-500",
    bgColor: "bg-amber-100"
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

// Helper for Shiny Styles - Replaced with uniform teal pulsing effect below
const DefenseSlot = React.memo(({ icon: Icon, isBroken, color, bgFill, isShiny, shinyHp, shinyBgColor }) => {
  
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
                
                {/* 1. Pulsing Teal Background */}
                <motion.div
                  className="absolute inset-[-2px] rounded-full bg-teal-400/20 blur-[1px] z-0"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* 2. Crisp Inner Circle (Static or subtle pulse) */}
                <motion.div 
                    className="absolute inset-0 rounded-full bg-teal-500/10 border border-teal-400/30 z-0"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />

                {/* 3. Icon (Floating) */}
                <motion.div
                    className="relative z-10"
                    animate={{ y: [-1, 1, -1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Icon 
                      size={22} 
                      className={`${color} ${bgFill ? 'fill-current opacity-80' : ''} drop-shadow-[0_0_6px_rgba(45,212,191,0.6)]`} 
                      strokeWidth={2}
                    />
                </motion.div>

                {/* 4. Glint Effect (Keep existing) */}
                <div className="absolute inset-0 rounded-full overflow-hidden z-20 pointer-events-none">
                  <motion.div 
                    className="absolute top-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/80 to-transparent"
                    style={{ skewX: -20, width: '50%' }}
                    initial={{ x: '-200%' }}
                    animate={{ x: '300%' }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      repeatDelay: 2.5, 
                      ease: "easeInOut" 
                    }}
                  />
                </div>

                {/* 5. HP Indicator */}
                {shinyHp > 0 && shinyHp < INITIAL_SHINY_HP && (
                   <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                     <motion.div 
                       key={`hp-${shinyHp}`}
                       initial={{ scale: 1.5, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       className="font-black text-white text-[14px] drop-shadow-md"
                       style={{ textShadow: "0px 0px 3px #000, 0px 0px 3px #000" }}
                     >
                       {shinyHp}
                     </motion.div>
                   </div>
                )}
              </div>
            ) : (
              <Icon 
                size={22} 
                className={`${color} ${bgFill ? 'fill-current opacity-80' : ''} relative z-10`} 
                strokeWidth={2}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const DefenseRow = ({ icon, startIndex, rowCount, currentCount, color, bgFill, shinyIndex, shinyHp, shinyBgColor, glowColor }) => (
  <div className="flex justify-center gap-2 py-0.5">
    {Array.from({ length: rowCount }).map((_, i) => {
       const globalIndex = startIndex + i;
       const isBroken = globalIndex >= currentCount;
       const isShiny = shinyIndex === globalIndex;
       
       return (
         <DefenseSlot 
           key={globalIndex}
           icon={icon} 
           isBroken={isBroken} 
           color={color} 
           bgFill={bgFill}
           isShiny={isShiny}
           shinyHp={shinyHp}
           shinyBgColor={shinyBgColor}
           glowColor={glowColor}
         />
       );
    })}
  </div>
);

const DefenseGroup = ({ current, max, icon, color, bgFill, shinyIndex, shinyHp, shinyBgColor, glowColor }) => {
  const fullRows = Math.floor(max / 4);
  const remainder = max % 4;
  const rows = [];
  let currentIndexTracker = 0;

  for (let i = 0; i < fullRows; i++) {
    rows.push(
      <DefenseRow 
        key={`${color}-full-${i}`} 
        icon={icon} 
        startIndex={currentIndexTracker}
        rowCount={4} 
        currentCount={current}
        color={color} 
        bgFill={bgFill} 
        shinyIndex={shinyIndex}
        shinyHp={shinyHp}
        shinyBgColor={shinyBgColor}
        glowColor={glowColor}
      />
    );
    currentIndexTracker += 4;
  }
  if (remainder > 0) {
    rows.push(
      <DefenseRow 
        key={`${color}-remainder`} 
        icon={icon} 
        startIndex={currentIndexTracker}
        rowCount={remainder} 
        currentCount={current}
        color={color} 
        bgFill={bgFill} 
        shinyIndex={shinyIndex}
        shinyHp={shinyHp}
        shinyBgColor={shinyBgColor}
        glowColor={glowColor}
      />
    );
  }
  return <>{rows}</>;
};

// --- MAIN APP ---

export default function App() {
  const [gridItems, setGridItems] = useState(() => generateGrid());
  const [selectedId, setSelectedId] = useState(null); 
  const [keptIds, setKeptIds] = useState([]); 
  const [isBlueTheme, setIsBlueTheme] = useState(false);
  const [activeModal, setActiveModal] = useState(null); 
  const [isRerolling, setIsRerolling] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  
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

  const handleTileClick = useCallback((index) => {
    if (isAttacking) return;
    if (keptIds.includes(index)) return;
    
    if (selectedId === index) {
      if (keptIds.length < MAX_KEPT) {
        setKeptIds(prev => [...prev, index]);
        setSelectedId(null); 
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
          <div className="h-12 shrink-0 flex items-center justify-between px-2 sm:px-4 bg-[#450a0a] border-b border-red-950 overflow-hidden">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#450a0a]">
                <span className="font-bold text-[10px]">01</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-bold tracking-widest text-red-200 leading-tight">Session</span>
                <span className="text-xs font-bold text-white tracking-tight leading-tight">PROTOCOL</span>
              </div>
            </div>
            
            {/* New Stats Section: Gold & Flasks */}
            <div className="flex items-center gap-2 sm:gap-6 mx-1 sm:mx-4 shrink min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-black/20 rounded-full border border-red-900/30 whitespace-nowrap">
                    <Coins size={14} className="text-amber-400 sm:w-4 sm:h-4" strokeWidth={2.5} />
                    <span className="text-xs sm:text-sm font-bold text-amber-100/90 tracking-wide">100</span>
                </div>
                <div className="flex items-center gap-1">
                    <FlaskRound size={16} className="text-red-500 fill-red-500/20 sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                    <FlaskRound size={16} className="text-blue-500 fill-blue-500/20 sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                    <FlaskRound size={16} className="text-emerald-500 fill-emerald-500/20 sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                </div>
            </div>
            
            <div className="flex gap-1 sm:gap-2 shrink-0">
              <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-red-200 hover:text-white">
                <Trophy size={16} strokeWidth={1.5} />
              </button>
              <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-red-200 hover:text-white">
                <Settings size={16} strokeWidth={1.5} />
              </button>
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
                    <Sprout size={24} className={`${theme.squareGreenIcon} group-hover:opacity-80`} strokeWidth={2} />
                 </button>
                 <button 
                    onClick={() => setActiveModal('blue')}
                    className={`w-12 h-12 ${theme.squareBlueBg} rounded-lg shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer group`}
                 >
                    <Skull size={24} className={`${theme.squareBlueIcon} group-hover:opacity-80`} strokeWidth={2} />
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
                           <item.icon size={18} className={item.color} strokeWidth={2.5} />
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
                        <selectedItem.icon className={`w-8 h-8 ${selectedItem.color} mb-1`} strokeWidth={1.5} />
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
                    <Snail className="text-purple-300 h-full w-auto max-h-[80px]" strokeWidth={1.5} />
                    <div className="flex flex-col justify-center h-full">
                       <span className="text-[#e7dace] font-black uppercase text-lg tracking-wider leading-none">Snail</span>
                       <span className="text-[#8c6b5d] text-[10px] font-bold tracking-widest uppercase">Lvl 12</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-1.5 h-full py-2 mr-1">
                     <Bomb size={18} className="text-red-300" strokeWidth={2} />
                     <TrendingUp size={18} className="text-emerald-300" strokeWidth={2} />
                     <ShieldBan size={18} className="text-slate-300" strokeWidth={2} />
                  </div>
               </div>

               {/* Defense Stack */}
               <div className="absolute top-[25%] left-0 right-0 bottom-0 flex flex-col items-center justify-center p-2 z-10">
                 <div className="flex flex-col gap-1 w-full">
                   <DefenseGroup 
                     current={enemyStats.heart} 
                     max={MAX_STATS.heart} 
                     icon={Heart} 
                     color="text-red-500" 
                     bgFill 
                     shinyIndex={shinyIndices.heart}
                     shinyHp={shinyHealth.heart}
                     shinyBgColor="bg-teal-400/30"
                     glowColor="teal"
                   />
                   <DefenseGroup 
                     current={enemyStats.physical} 
                     max={MAX_STATS.physical} 
                     icon={BicepsFlexed} 
                     color="text-yellow-600" 
                     bgFill 
                     shinyIndex={shinyIndices.physical}
                     shinyHp={shinyHealth.physical}
                     shinyBgColor="bg-teal-400/30"
                     glowColor="teal"
                   />
                   <DefenseGroup 
                     current={enemyStats.armor} 
                     max={MAX_STATS.armor} 
                     icon={Shield} 
                     color="text-slate-400" 
                     bgFill 
                     shinyIndex={shinyIndices.armor}
                     shinyHp={shinyHealth.armor}
                     shinyBgColor="bg-teal-400/30"
                     glowColor="teal"
                   />
                   <DefenseGroup 
                     current={enemyStats.magic} 
                     max={MAX_STATS.magic} 
                     icon={Sparkles} 
                     color="text-purple-500" 
                     bgFill 
                     shinyIndex={shinyIndices.magic}
                     shinyHp={shinyHealth.magic}
                     shinyBgColor="bg-teal-400/30"
                     glowColor="teal"
                   />
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
                 <ArrowUpRight 
                    className={`
                      transition-transform duration-300
                      ${isAttackReady && !isAttacking
                        ? 'text-[#450a0a] group-hover:scale-110' 
                        : 'text-slate-500' 
                      }
                    `} 
                    size={24} 
                    strokeWidth={2.5}
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
                <RefreshCw size={18} className={`transition-transform duration-500 ${isRerolling ? 'rotate-180' : 'group-hover:rotate-45'}`} />
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
                    relative rounded-lg flex items-center justify-center
                    transition-transform duration-100 ease-out
                    ${isKept
                      ? 'bg-slate-700/80 border border-slate-600 cursor-not-allowed'
                      : isSelected 
                        ? `${theme.selectedBg} ${theme.selectedShadow} z-10`
                        : `${theme.tileBase} ${theme.tileHover} ${!isAttacking ? 'active:scale-95' : ''}`
                    }
                  `}
                >
                  <item.icon 
                    className={`
                      w-6 h-6 transition-all duration-200
                      ${isKept 
                        ? 'opacity-60 grayscale-[30%]'
                        : isSelected 
                          ? `${theme.selectedText}`
                          : item.color
                      }
                    `} 
                    strokeWidth={2}
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
                className="w-full max-w-sm bg-[#F5F2EB] rounded-2xl shadow-2xl border-4 border-[#450a0a] overflow-hidden"
              >
                <div className="bg-[#450a0a] px-4 py-3 flex items-center justify-between">
                  <h3 className="text-red-100 font-bold uppercase tracking-wider text-sm">
                    {activeModal === 'green' ? 'Nature Protocol' : 'Vermin Protocol'}
                  </h3>
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="text-red-300 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6">
                  <div className={`
                    w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-inner
                    ${activeModal === 'green' ? 'bg-[#0A261D]' : 'bg-[#0B1121]'}
                  `}>
                    {activeModal === 'green' ? (
                      <Sprout size={32} className="text-[#00FF94]" />
                    ) : (
                      <Skull size={32} className="text-[#38BDF8]" />
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
