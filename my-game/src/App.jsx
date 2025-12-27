import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, Shield, Zap, Heart, Star, Skull, Ghost, Gem, 
  Coins, Anchor, Cloud, Flame, Droplet, Sun, Moon, Snowflake,
  Settings, RefreshCw, Trophy, Aperture, Command,
  BicepsFlexed, Sparkles, Check
} from 'lucide-react';

// --- Configuration & Helpers ---

const GRID_SIZE = 16; // 4x4
const MAX_KEPT = 4;

// 12 Symbols Total: 3 Magic, 3 Armor, 3 Special, 3 Support
const ICON_POOL = [
  // --- Magic Damage (3) ---
  { 
    id: 'magic_1',
    icon: Zap, 
    name: "Arcane Bolt", 
    desc: "Deals 15 Magic Damage ignoring evasion.", 
    color: "text-purple-500" 
  },
  { 
    id: 'magic_2',
    icon: Flame, 
    name: "Incinerate", 
    desc: "Deals 10 Magic Damage + Burn effect.", 
    color: "text-orange-500" 
  },
  { 
    id: 'magic_3',
    icon: Snowflake, 
    name: "Glacial Spike", 
    desc: "Deals 12 Magic Damage and slows target.", 
    color: "text-cyan-500" 
  },

  // --- Armor Damage (3) ---
  { 
    id: 'armor_1',
    icon: Anchor, 
    name: "Heavy Slam", 
    desc: "Reduces enemy Armor by 5.", 
    color: "text-slate-600" 
  },
  { 
    id: 'armor_2',
    icon: Sword, 
    name: "Sunder Strike", 
    desc: "Deals Physical Damage. Bonus vs Shields.", 
    color: "text-red-600" 
  },
  { 
    id: 'armor_3',
    icon: BicepsFlexed, 
    name: "Shield Breaker", 
    desc: "Instantly destroys 1 layer of enemy defense.", 
    color: "text-amber-700" 
  },

  // --- Special (3) ---
  { 
    id: 'special_1',
    icon: Skull, 
    name: "Doom Curse", 
    desc: "Apply Doom: Target perishes in 3 turns.", 
    color: "text-pink-500" // "Skulls are always pink"
  },
  { 
    id: 'special_2',
    icon: Moon, 
    name: "Nightshade", 
    desc: "Steals buffs from the enemy.", 
    color: "text-indigo-400" 
  },
  { 
    id: 'special_3',
    icon: Star, 
    name: "Cosmic Wish", 
    desc: "Rerolls grid with guaranteed high-tier loot.", 
    color: "text-yellow-400" 
  },

  // --- Support/Resource (3) ---
  { 
    id: 'supp_1',
    icon: Heart, 
    name: "Vitality", 
    desc: "Restores 20 Health Points.", 
    color: "text-red-500" 
  },
  { 
    id: 'supp_2',
    icon: Shield, 
    name: "Iron Skin", 
    desc: "Gain 15 Armor for next turn.", 
    color: "text-emerald-500" 
  },
  { 
    id: 'supp_3',
    icon: Coins, 
    name: "Plunder", 
    desc: "Gain 50 Gold instantly.", 
    color: "text-amber-400" 
  },
];

const generateGrid = () => {
  return Array.from({ length: GRID_SIZE }).map((_, index) => {
    // Each cell has equal chance for any of the 12 symbols
    const data = ICON_POOL[Math.floor(Math.random() * ICON_POOL.length)];
    return {
      uniqueId: `${index}-${Date.now()}`, // Unique ID for React keys if needed, though index is used below
      index: index,
      ...data
    };
  });
};

// Helper component for defense rows
const DefenseRow = ({ icon: Icon, count, color, bgFill }) => (
  <div className="flex justify-center gap-3 py-1">
    {Array.from({ length: count }).map((_, i) => (
      <Icon 
        key={i} 
        size={20} 
        className={`${color} ${bgFill ? 'fill-current opacity-80' : ''}`} 
        strokeWidth={2}
      />
    ))}
  </div>
);

export default function App() {
  const [gridItems, setGridItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // Tracks grid index (0-15)
  const [keptIds, setKeptIds] = useState([]); // Tracks kept grid indices
  
  // Memoize the selected item to avoid re-searching the array on every render
  const selectedItem = useMemo(() => 
    gridItems.find(item => item.index === selectedId), 
  [gridItems, selectedId]);

  // Derive kept items for the top panel display
  const keptItems = useMemo(() => 
    keptIds.map(id => gridItems.find(item => item.index === id)).filter(Boolean),
  [gridItems, keptIds]);

  useEffect(() => {
    setGridItems(generateGrid());
  }, []);

  const handleTileClick = (index) => {
    if (selectedId === index) {
      // 2nd Tap logic: Toggle "Keep" status
      if (keptIds.includes(index)) {
        setKeptIds(prev => prev.filter(k => k !== index));
      } else {
        if (keptIds.length < MAX_KEPT) {
          setKeptIds(prev => [...prev, index]);
        }
      }
    } else {
      // 1st Tap logic: Select (View details)
      setSelectedId(index);
    }
  };

  const handleRefresh = () => {
    setSelectedId(null);
    setKeptIds([]);
    setGridItems(generateGrid());
  };

  return (
    // Modern Sans-Serif, High Contrast. h-[100dvh] for mobile browsers.
    <div className="flex flex-col h-[100dvh] w-full bg-[#F5F2EB] text-slate-900 overflow-hidden font-sans select-none">
      
      {/* --- Top Half: Viewport --- */}
      <div className="h-1/2 flex flex-col z-10 relative">
        
        {/* Slim Top Panel: Dark Blue Background */}
        <div className="h-16 flex items-center justify-between px-6 bg-[#0F172A] border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#0F172A]">
              <span className="font-bold text-xs">01</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Current Session</span>
              <span className="text-sm font-bold text-white tracking-tight">DESIGN PROTOCOL</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <Trophy size={20} strokeWidth={1.5} />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <Settings size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Main Split Area */}
        <div className="flex-1 flex bg-[#F5F2EB] min-h-0">
          
          {/* Left Section: Info Display */}
          <div className="w-1/2 border-r border-slate-200 p-6 flex flex-col relative overflow-hidden">
            
            {/* Top Half (Kept Items Display) */}
            <div className="flex-1 min-h-0 pt-2">
              <div className="flex gap-2">
                 {/* Render 4 fixed slots */}
                 {Array.from({ length: MAX_KEPT }).map((_, i) => {
                   const item = keptItems[i];
                   return (
                     <div 
                       key={i} 
                       className={`
                         w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all
                         ${item 
                           ? 'bg-white border-slate-900 shadow-sm' 
                           : 'border-slate-300 border-dashed bg-transparent'}
                       `}
                     >
                       <AnimatePresence mode="wait">
                         {item && (
                           <motion.div
                             initial={{ scale: 0, opacity: 0 }}
                             animate={{ scale: 1, opacity: 1 }}
                             exit={{ scale: 0, opacity: 0 }}
                           >
                             <item.Icon size={20} className={item.color} />
                           </motion.div>
                         )}
                       </AnimatePresence>
                     </div>
                   );
                 })}
              </div>
            </div>

            {/* Bottom Half (Info Area) */}
            <div className="flex-none pt-4">
              {selectedItem ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={selectedItem.index} // Re-animate when ID changes
                  className="flex flex-col"
                >
                  <div className="mb-1">
                    <selectedItem.icon className={`w-10 h-10 ${selectedItem.color} mb-2`} strokeWidth={1.5} />
                    <h2 className="text-2xl font-black leading-none uppercase tracking-tighter text-slate-900 mb-1">
                      {selectedItem.name}
                    </h2>
                    <div className="h-1 w-12 bg-black mb-2"/>
                  </div>
                  <p className="text-sm font-medium text-slate-500 leading-snug">
                    {selectedItem.desc}
                  </p>
                </motion.div>
              ) : (
                <div className="flex flex-col justify-end h-32 text-slate-300 opacity-50 pb-2">
                  <Command size={48} strokeWidth={1} />
                  <span className="mt-4 text-xs font-bold tracking-widest uppercase">Awaiting Input</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Defense Layers */}
          <div className="w-1/2 relative bg-slate-50 flex flex-col justify-end p-6 pb-8">
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
             
             {/* Defense Layers Container */}
             <div className="flex flex-col gap-1 w-full relative z-10">
               <div className="absolute -top-6 left-0 right-0 text-center">
                 <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Target Defenses</span>
               </div>

               {/* 1 Row of Hearts (Top) */}
               <DefenseRow icon={Heart} count={4} color="text-red-500" bgFill />
               
               {/* 1 Row of Biceps (Strength) - Dark Yellow and Solid */}
               <DefenseRow icon={BicepsFlexed} count={4} color="text-yellow-600" bgFill />
               
               {/* 2 Rows of Shields (Middle) - Gray */}
               <DefenseRow icon={Shield} count={4} color="text-slate-400" bgFill />
               <DefenseRow icon={Shield} count={4} color="text-slate-400" bgFill />
               
               {/* 2 Rows of Magic (Bottom - Sparkles) */}
               <DefenseRow icon={Sparkles} count={4} color="text-purple-500" bgFill />
               <DefenseRow icon={Sparkles} count={4} color="text-purple-500" bgFill />
             </div>
          </div>
        </div>
      </div>

      {/* --- Bottom Half: Controls & Grid --- */}
      {/* Deep, Rich Green Background */}
      <div className="h-1/2 bg-[#0A261D] p-6 flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.2)] relative z-20 rounded-t-3xl">
        
        {/* Header */}
        <div className="mb-5 flex justify-between items-end">
          <div>
            <span className="text-[#2F5E4D] text-[10px] font-bold uppercase tracking-widest block mb-1">Control Surface</span>
            <h2 className="text-white text-lg font-bold tracking-tight flex items-center gap-2">
              <Aperture size={18} className="text-[#00FF94]" />
              SYSTEM GRID
            </h2>
          </div>
          <button 
            onClick={handleRefresh}
            className="group flex items-center justify-center w-10 h-10 bg-[#16382D] rounded-full text-[#4A856F] hover:bg-[#00FF94] hover:text-[#0A261D] transition-all duration-300"
          >
            <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        {/* The 4x4 Grid */}
        <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-3">
          {gridItems.map((item) => {
            const isSelected = selectedId === item.index;
            const isKept = keptIds.includes(item.index);
            
            return (
              <button
                key={item.index}
                onClick={() => handleTileClick(item.index)}
                className={`
                  relative rounded-xl flex items-center justify-center
                  transition-all duration-100 ease-out
                  ${isSelected 
                    ? 'bg-[#E63946] -translate-y-1 shadow-[0_10px_20px_rgba(230,57,70,0.4)] z-10 scale-105' 
                    : isKept 
                      // Dark Yellow highlight for kept state, no border
                      ? 'bg-[#574c15] border-2 border-[#D4AF37]/50' 
                      : 'bg-[#16382D] hover:bg-[#1E4538] active:scale-95'}
                `}
              >
                {/* Icon */}
                <item.icon 
                  className={`
                    w-7 h-7 transition-all duration-200
                    ${isSelected ? 'text-white scale-110' : item.color} 
                    ${isKept && !isSelected ? 'opacity-80' : ''}
                  `} 
                  strokeWidth={2}
                />

                {/* Selection Ring (Animated Check) */}
                {isSelected && (
                  <motion.div 
                    layoutId="outline"
                    className="absolute inset-0 border-2 border-white/20 rounded-xl"
                    transition={{ duration: 0.15 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
