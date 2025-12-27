import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, Shield, Zap, Heart, Star, Skull, Ghost, Gem, 
  Coins, Anchor, Cloud, Flame, Droplet, Sun, Moon, Snowflake,
  Settings, RefreshCw, Trophy, Aperture, Command,
  BicepsFlexed, Sparkles, Hammer, Leaf, CircleAlert,
  Rat, TreeDeciduous, X, MousePointerClick, ArrowUpRight,
  Snail, Bomb, TrendingUp, ShieldBan
} from 'lucide-react';

// --- Configuration & Helpers ---

const GRID_SIZE = 16; // 4x4
const MAX_KEPT = 4;

// 12 Symbols Total: 3 Magic, 3 Armor, 3 Physical, 3 Special
const ICON_POOL = [
  // --- Magic (3) -> Deals 1 Magic Damage ---
  { 
    id: 'magic_1',
    icon: Zap, 
    name: "Arcane Bolt", 
    desc: "Deals 1 Magic Damage.", 
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  { 
    id: 'magic_2',
    icon: Flame, 
    name: "Incinerate", 
    desc: "Deals 1 Magic Damage.", 
    color: "text-orange-500",
    bgColor: "bg-orange-100"
  },
  { 
    id: 'magic_3',
    icon: Snowflake, 
    name: "Glacial Spike", 
    desc: "Deals 1 Magic Damage.", 
    color: "text-cyan-600",
    bgColor: "bg-cyan-100"
  },

  // --- Armor (3) -> Deals 1 Armor Damage ---
  { 
    id: 'armor_1',
    icon: Anchor, 
    name: "Heavy Slam", 
    desc: "Deals 1 Armor Damage.", 
    color: "text-slate-600",
    bgColor: "bg-slate-200"
  },
  { 
    id: 'armor_2',
    icon: Shield, 
    name: "Shield Bash", 
    desc: "Deals 1 Armor Damage.", 
    color: "text-blue-700",
    bgColor: "bg-blue-100"
  },
  { 
    id: 'armor_3',
    icon: Gem, 
    name: "Crystal Edge", 
    desc: "Deals 1 Armor Damage.", 
    color: "text-teal-600",
    bgColor: "bg-teal-100"
  },

  // --- Physical (3) -> Deals 3 Physical Damage ---
  { 
    id: 'phys_1',
    icon: Sword, 
    name: "Broadsword", 
    desc: "Deals 3 Physical Damage.", 
    color: "text-red-600",
    bgColor: "bg-red-100"
  },
  { 
    id: 'phys_2',
    icon: Hammer, 
    name: "Warhammer", 
    desc: "Deals 3 Physical Damage.", 
    color: "text-amber-700", 
    bgColor: "bg-amber-100"
  },
  { 
    id: 'phys_3',
    icon: BicepsFlexed, 
    name: "Brute Force", 
    desc: "Deals 3 Physical Damage.", 
    color: "text-orange-700", 
    bgColor: "bg-orange-200"
  },

  // --- Special (3) ---
  { 
    id: 'special_1',
    icon: Star, 
    name: "Cosmic Wish", 
    desc: "Special Effect: Rerolls grid with high-tier loot.", 
    color: "text-yellow-500",
    bgColor: "bg-yellow-100"
  },
  { 
    id: 'special_2',
    icon: Moon, 
    name: "Nightshade", 
    desc: "Special Effect: Steals buffs from the enemy.", 
    color: "text-indigo-500",
    bgColor: "bg-indigo-100" 
  },
  { 
    id: 'special_3',
    icon: Coins, 
    name: "Bounty", 
    desc: "Special Effect: Gain 50 Gold instantly.", 
    color: "text-amber-500",
    bgColor: "bg-amber-100"
  },
];

const generateGrid = () => {
  return Array.from({ length: GRID_SIZE }).map((_, index) => {
    const data = ICON_POOL[Math.floor(Math.random() * ICON_POOL.length)];
    return {
      uniqueId: `${index}-${Date.now()}`, 
      index: index,
      ...data
    };
  });
};

// --- Defense Components ---

// Individual Icon Slot
const DefenseSlot = ({ icon: Icon, isBroken, color, bgFill }) => {
  return (
    // Fixed width/height container ensures layout stability even when empty
    <div className="w-6 h-6 flex items-center justify-center relative">
      <AnimatePresence>
        {!isBroken && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.8, opacity: 0 }} // The "Pop" effect
            transition={{ duration: 0.2 }} // Fast pop
            className="absolute inset-0 flex items-center justify-center"
          >
            <Icon 
              size={22} 
              className={`${color} ${bgFill ? 'fill-current opacity-80' : ''}`} 
              strokeWidth={2}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Row of slots
const DefenseRow = ({ icon, startIndex, rowCount, currentCount, color, bgFill }) => (
  <div className="flex justify-center gap-2 py-0.5">
    {Array.from({ length: rowCount }).map((_, i) => {
       const globalIndex = startIndex + i;
       // Determine if this specific slot is "alive" based on current health count
       // If we have 5 health, indices 0,1,2,3,4 are alive. Index 5 is broken.
       // Note: Visual order is usually left-to-right. 
       // If currentCount is 3, that means 0, 1, 2 exist. 3 is broken.
       // However, we usually lose health from the "end".
       // Let's say max is 4. Health is 3. We show 3 icons. The 4th slot is empty.
       // The `globalIndex` (0 to max-1) compared to `currentCount`.
       // If globalIndex < currentCount, it's alive.
       const isBroken = globalIndex >= currentCount;
       
       return (
         <DefenseSlot 
           key={globalIndex}
           icon={icon} 
           isBroken={isBroken} 
           color={color} 
           bgFill={bgFill}
         />
       );
    })}
  </div>
);

// Group that manages breaking rows
const DefenseGroup = ({ current, max, icon, color, bgFill }) => {
  // We use MAX to determine the grid structure, so it never changes size/shape
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
      />
    );
  }
  
  return <>{rows}</>;
};

export default function App() {
  const [gridItems, setGridItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null); 
  const [keptIds, setKeptIds] = useState([]); 
  const [isBlueTheme, setIsBlueTheme] = useState(false);
  const [activeModal, setActiveModal] = useState(null); 
  const [isRerolling, setIsRerolling] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  
  // Game State
  // We need MAX stats to preserve the grid layout "slots"
  const maxStats = useMemo(() => ({
    magic: 8,
    armor: 8,
    physical: 4,
    heart: 4
  }), []);

  const [enemyStats, setEnemyStats] = useState({ ...maxStats });
  
  const selectedItem = useMemo(() => 
    gridItems.find(item => item.index === selectedId), 
  [gridItems, selectedId]);

  const keptItems = useMemo(() => 
    keptIds.map(id => gridItems.find(item => item.index === id)).filter(Boolean),
  [gridItems, keptIds]);

  const isAttackReady = keptIds.length === MAX_KEPT;

  useEffect(() => {
    setGridItems(generateGrid());
  }, []);

  const handleTileClick = (index) => {
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
  };

  const handleRefresh = () => {
    if (isAttacking) return;
    setIsRerolling(true);
    setSelectedId(null);
    setKeptIds([]);
    setGridItems(generateGrid());
    setTimeout(() => {
      setIsRerolling(false);
    }, 300);
  };

  const handleAttack = async () => {
    if (isAttacking) return;
    setIsAttacking(true);
    setSelectedId(null);

    // Create a local copy to mutate step-by-step
    let currentStats = { ...enemyStats };
    
    // Iterate through kept items one by one for the visual sequence
    for (const item of keptItems) {
      let targetStat = null;
      let damage = 0;

      // Determine active layer and if this item affects it
      if (currentStats.magic > 0) {
        if (item.id.startsWith('magic')) {
           targetStat = 'magic';
           damage = 1;
        }
      } 
      else if (currentStats.armor > 0) {
        if (item.id.startsWith('armor')) {
           targetStat = 'armor';
           damage = 1;
        }
      }
      else if (currentStats.physical > 0) {
        if (item.id.startsWith('phys')) {
           targetStat = 'physical';
           damage = 3;
        }
      }
      else if (currentStats.heart > 0) {
        targetStat = 'heart';
        if (item.id.startsWith('magic')) damage = 1;
        else if (item.id.startsWith('armor')) damage = 1;
        else if (item.id.startsWith('phys')) damage = 3;
      }

      // Execute Damage Sequence
      if (targetStat && damage > 0) {
        for (let i = 0; i < damage; i++) {
            // Check if there is still hp in this stat to take
            if (currentStats[targetStat] > 0) {
                currentStats[targetStat] -= 1;
                setEnemyStats({ ...currentStats });
                // Fast pop delay (150ms)
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        }
      }
      // If no effect, loop continues immediately (no await)
    }

    // Refill the grid
    const newGrid = [...gridItems];
    keptIds.forEach(id => {
       const newItem = ICON_POOL[Math.floor(Math.random() * ICON_POOL.length)];
       newGrid[id] = {
         uniqueId: `${id}-${Date.now()}`,
         index: id,
         ...newItem
       };
    });

    setGridItems(newGrid);
    setKeptIds([]);
    setIsAttacking(false);
  };

  // Define theme classes based on state
  const theme = {
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
  };

  return (
    // Outer Wrapper
    <div className="flex items-center justify-center w-full min-h-screen bg-neutral-900 font-sans select-none p-0 sm:p-4">
      
      {/* Mobile-Sized Container */}
      <div className="flex flex-col w-full max-w-md h-[100dvh] sm:h-[90vh] sm:max-h-[800px] bg-[#F5F2EB] text-slate-900 overflow-hidden shadow-2xl relative sm:rounded-[2.5rem] border-0 sm:border-4 border-neutral-800">
        
        {/* --- Top Half: Viewport --- */}
        <div className="h-1/2 flex flex-col z-10 relative">
          
          {/* Slim Top Panel */}
          <div className="h-12 shrink-0 flex items-center justify-between px-4 bg-[#450a0a] border-b border-red-950">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#450a0a]">
                <span className="font-bold text-[10px]">01</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-bold tracking-widest text-red-200 leading-tight">Session</span>
                <span className="text-xs font-bold text-white tracking-tight leading-tight">PROTOCOL</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-red-200 hover:text-white">
                <Trophy size={16} strokeWidth={1.5} />
              </button>
              <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-red-200 hover:text-white">
                <Settings size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Main Split Area */}
          <div className="flex-1 flex bg-[#F5F2EB] min-h-0 relative">
            
            {/* Left Section: Info Display */}
            <div className="w-1/2 border-r border-slate-200 relative overflow-hidden">
              
              <div className="absolute top-[25%] left-0 right-0 h-px bg-slate-200 z-10" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 z-10" />

              {/* Top 25%: Theme Buttons */}
              <div className="absolute top-0 left-0 right-0 h-[25%] flex items-center justify-center gap-3">
                 <button 
                    onClick={() => setActiveModal('green')}
                    className={`w-12 h-12 ${theme.squareGreenBg} rounded-lg shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer group`}
                 >
                    <TreeDeciduous size={24} className={`${theme.squareGreenIcon} group-hover:opacity-80`} strokeWidth={2} />
                 </button>
                 
                 <button 
                    onClick={() => setActiveModal('blue')}
                    className={`w-12 h-12 ${theme.squareBlueBg} rounded-lg shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer group`}
                 >
                    <Rat size={24} className={`${theme.squareBlueIcon} group-hover:opacity-80`} strokeWidth={2} />
                 </button>
              </div>

              {/* Middle 25% Band: Kept Items */}
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
                         {/* Static Display of selected items - No idle animations during attack */}
                         {item && (
                           <item.icon size={18} className={item.color} strokeWidth={2.5} />
                         )}
                       </div>
                     );
                   })}
                </div>
              </div>

              {/* Bottom Half: Info Area */}
              <div className="absolute top-1/2 left-0 right-0 bottom-0 flex flex-col justify-start px-3 pt-3">
                <div className="relative flex flex-col h-full">
                  {selectedItem ? (
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
                  ) : (
                   /* REMOVED NO INPUT TEXT HERE */
                   null
                  )}
                </div>
              </div>
            </div>

            {/* Right Section: Defense Layers */}
            <div className="w-1/2 relative bg-slate-50 border-l border-slate-100 -ml-px z-20">
               <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
               <div className="absolute top-[25%] left-0 right-0 h-px bg-slate-200 z-10" />

               {/* Top 25%: Enemy Header & Buffs */}
               <div className="absolute top-0 left-0 right-0 h-[25%] px-4 flex items-center justify-between overflow-hidden">
                  {/* Left: Enemy Icon - Responsive Height */}
                  <div className="h-full py-3 flex items-center justify-center">
                    <Snail className="text-[#4c1d95] h-full w-auto max-h-[80px]" strokeWidth={1.5} />
                  </div>

                  {/* Right: Buffs - Vertical Column */}
                  <div className="flex flex-col justify-center gap-1.5 h-full py-2 mr-1">
                     <Bomb size={18} className="text-red-700" strokeWidth={2} />
                     <TrendingUp size={18} className="text-emerald-700" strokeWidth={2} />
                     <ShieldBan size={18} className="text-slate-600" strokeWidth={2} />
                  </div>
               </div>

               {/* Defense Layers (Dynamic Stack) */}
               <div className="absolute top-[25%] left-0 right-0 bottom-0 flex flex-col items-center justify-center p-2 z-10">
                 <div className="flex flex-col gap-1 w-full">
                   {/* Heart (Last Layer) */}
                   <DefenseGroup current={enemyStats.heart} max={maxStats.heart} icon={Heart} color="text-red-500" bgFill />
                   
                   {/* Physical (3rd Layer) */}
                   <DefenseGroup current={enemyStats.physical} max={maxStats.physical} icon={BicepsFlexed} color="text-yellow-600" bgFill />
                   
                   {/* Armor (2nd Layer) */}
                   <DefenseGroup current={enemyStats.armor} max={maxStats.armor} icon={Shield} color="text-slate-400" bgFill />
                   
                   {/* Magic (1st Layer - Outer Shell) */}
                   <DefenseGroup current={enemyStats.magic} max={maxStats.magic} icon={Sparkles} color="text-purple-500" bgFill />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* --- Bottom Half: Controls & Grid --- */}
        <div className={`h-1/2 ${theme.bg} p-4 flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.2)] relative z-20 rounded-t-2xl transition-colors duration-500`}>
          
          {/* Header */}
          <div className="mb-3 grid grid-cols-3 items-center shrink-0 h-12">
            
            {/* Left: Toggle */}
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

            {/* Center: Attack Button */}
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

            {/* Right: Refresh */}
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

          {/* Grid */}
          <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-2">
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
                      <TreeDeciduous size={32} className="text-[#00FF94]" />
                    ) : (
                      <Rat size={32} className="text-[#38BDF8]" />
                    )}
                  </div>
                  
                  <div className="h-24 bg-slate-200/50 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                      No Data Available
                    </span>
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
