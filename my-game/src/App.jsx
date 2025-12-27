import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, Shield, Zap, Heart, Star, Skull, Ghost, Gem, 
  Coins, Anchor, Cloud, Flame, Droplet, Sun, Moon, Snowflake,
  Settings, RefreshCw, Trophy, Aperture, Command,
  BicepsFlexed, Sparkles, Hammer, Leaf, CircleAlert
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
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  { 
    id: 'magic_2',
    icon: Flame, 
    name: "Incinerate", 
    desc: "Deals 10 Magic Damage + Burn effect.", 
    color: "text-orange-500",
    bgColor: "bg-orange-100"
  },
  { 
    id: 'magic_3',
    icon: Snowflake, 
    name: "Glacial Spike", 
    desc: "Deals 12 Magic Damage and slows target.", 
    color: "text-cyan-600",
    bgColor: "bg-cyan-100"
  },

  // --- Armor Damage (3) ---
  { 
    id: 'armor_1',
    icon: Anchor, 
    name: "Heavy Slam", 
    desc: "Reduces enemy Armor by 5.", 
    color: "text-slate-600",
    bgColor: "bg-slate-200"
  },
  { 
    id: 'armor_2',
    icon: Sword, 
    name: "Sunder Strike", 
    desc: "Deals Physical Damage. Bonus vs Shields.", 
    color: "text-red-600",
    bgColor: "bg-red-100"
  },
  { 
    id: 'armor_3',
    icon: Hammer, 
    name: "Guard Crush", 
    desc: "Instantly destroys 1 layer of enemy defense.", 
    color: "text-amber-700",
    bgColor: "bg-amber-100"
  },

  // --- Special (3) ---
  { 
    id: 'special_1',
    icon: Skull, 
    name: "Doom Curse", 
    desc: "Apply Doom: Target perishes in 3 turns.", 
    color: "text-pink-600", 
    bgColor: "bg-pink-100"
  },
  { 
    id: 'special_2',
    icon: Moon, 
    name: "Nightshade", 
    desc: "Steals buffs from the enemy.", 
    color: "text-indigo-500",
    bgColor: "bg-indigo-100" 
  },
  { 
    id: 'special_3',
    icon: Star, 
    name: "Cosmic Wish", 
    desc: "Rerolls grid with guaranteed high-tier loot.", 
    color: "text-yellow-500",
    bgColor: "bg-yellow-100"
  },

  // --- Support/Resource (3) ---
  { 
    id: 'supp_1',
    icon: Leaf, 
    name: "Natural Remedy", 
    desc: "Restores 20 Health Points.", 
    color: "text-emerald-600",
    bgColor: "bg-emerald-100"
  },
  { 
    id: 'supp_2',
    icon: Gem, 
    name: "Crystalline Barrier", 
    desc: "Gain 15 Armor for next turn.", 
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  { 
    id: 'supp_3',
    icon: Coins, 
    name: "Plunder", 
    desc: "Gain 50 Gold instantly.", 
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

// Helper component for defense rows
const DefenseRow = ({ icon: Icon, count, color, bgFill }) => (
  <div className="flex justify-center gap-2 py-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <Icon 
        key={i} 
        size={22} 
        className={`${color} ${bgFill ? 'fill-current opacity-80' : ''}`} 
        strokeWidth={2}
      />
    ))}
  </div>
);

export default function App() {
  const [gridItems, setGridItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null); 
  const [keptIds, setKeptIds] = useState([]); 
  const [isBlueTheme, setIsBlueTheme] = useState(false);
  
  const selectedItem = useMemo(() => 
    gridItems.find(item => item.index === selectedId), 
  [gridItems, selectedId]);

  const keptItems = useMemo(() => 
    keptIds.map(id => gridItems.find(item => item.index === id)).filter(Boolean),
  [gridItems, keptIds]);

  useEffect(() => {
    setGridItems(generateGrid());
  }, []);

  const handleTileClick = (index) => {
    // 1. If already kept, strictly ignore clicks (Locked)
    if (keptIds.includes(index)) return;

    if (selectedId === index) {
      // 2. Second tap on selected -> Keep it (if space allows)
      if (keptIds.length < MAX_KEPT) {
        setKeptIds(prev => [...prev, index]);
        setSelectedId(null); // Clear selection after locking in
      }
    } else {
      // 3. First tap -> Select it
      setSelectedId(index);
    }
  };

  const handleRefresh = () => {
    setSelectedId(null);
    setKeptIds([]);
    setGridItems(generateGrid());
  };

  // Define theme classes based on state
  const theme = {
    bg: isBlueTheme ? 'bg-[#0B1121]' : 'bg-[#0A261D]',
    tileBase: isBlueTheme ? 'bg-[#1E293B]' : 'bg-[#16382D]',
    tileHover: isBlueTheme ? 'hover:bg-[#334155]' : 'hover:bg-[#1E4538]',
    refreshBtn: isBlueTheme 
      ? 'bg-[#1E293B] text-[#94A3B8] hover:bg-[#38BDF8] hover:text-[#0F172A]' 
      : 'bg-[#16382D] text-[#4A856F] hover:bg-[#00FF94] hover:text-[#0A261D]',
    toggleTrack: isBlueTheme ? 'bg-[#1E293B] border-[#334155]' : 'bg-[#16382D] border-[#2F5E4D]',
    toggleKnob: isBlueTheme ? 'bg-[#38BDF8]' : 'bg-[#00FF94]',
    
    // Updated Selection Colors (Matching the toggle knobs)
    selectedBg: isBlueTheme ? 'bg-[#38BDF8]' : 'bg-[#00FF94]',
    selectedShadow: isBlueTheme ? 'shadow-[0_0_20px_rgba(56,189,248,0.6)]' : 'shadow-[0_0_20px_rgba(0,255,148,0.6)]',
    selectedText: 'text-[#0F172A]', // Dark text for contrast against bright selection
    
    // Decorative Squares
    squareGreenBg: 'bg-[#00FF94]',
    squareGreenBorder: 'border-[#0A261D]',
    squareBlueBg: 'bg-[#38BDF8]',
    squareBlueBorder: 'border-[#0B1121]'
  };

  return (
    // Outer Wrapper for Desktop Centering
    <div className="flex items-center justify-center w-full min-h-screen bg-neutral-900 font-sans select-none p-0 sm:p-4">
      
      {/* Mobile-Sized Container */}
      <div className="flex flex-col w-full max-w-md h-[100dvh] sm:h-[90vh] sm:max-h-[800px] bg-[#F5F2EB] text-slate-900 overflow-hidden shadow-2xl relative sm:rounded-[2.5rem] border-0 sm:border-4 border-neutral-800">
        
        {/* --- Top Half: Viewport --- */}
        <div className="h-1/2 flex flex-col z-10 relative">
          
          {/* Slim Top Panel - Changed to Dark Red */}
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
              
              {/* THE TOP DIVIDER LINE (Visible divider at 25%) */}
              <div className="absolute top-[25%] left-0 right-0 h-px bg-slate-200 z-10" />
              
              {/* THE MIDLINE (Visible divider at 50%) */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 z-10" />

              {/* Top 25%: Decorative Squares Area */}
              <div className="absolute top-0 left-0 right-0 h-[25%] flex items-center justify-center gap-3">
                 {/* Green Theme Square */}
                 <div className={`w-12 h-12 ${theme.squareGreenBg} border-2 ${theme.squareGreenBorder} rounded-lg shadow-sm`}></div>
                 
                 {/* Blue Theme Square */}
                 <div className={`w-12 h-12 ${theme.squareBlueBg} border-2 ${theme.squareBlueBorder} rounded-lg shadow-sm`}></div>
              </div>

              {/* Middle 25% Band (Between 25% line and 50% line): Kept Items */}
              <div className="absolute top-[25%] bottom-[50%] left-0 right-0 flex items-center justify-center px-3">
                <div className="flex gap-2 z-10 pointer-events-auto">
                   {/* Render 4 fixed slots - Reverted to w-8 h-8 size */}
                   {Array.from({ length: MAX_KEPT }).map((_, i) => {
                     const item = keptItems[i];
                     return (
                       <div 
                         key={i}
                         onClick={() => item && setSelectedId(item.index)}
                         className={`
                           w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-all
                           ${item 
                             ? `${item.bgColor} shadow-sm cursor-pointer hover:scale-105 active:scale-95` 
                             : 'bg-slate-200/50 border border-slate-200/50'} 
                         `}
                       >
                         <AnimatePresence mode="wait">
                           {item && (
                             <motion.div
                               initial={{ scale: 0, opacity: 0 }}
                               animate={{ scale: 1, opacity: 1 }}
                               exit={{ scale: 0, opacity: 0 }}
                             >
                               <item.icon size={18} className={item.color} strokeWidth={2.5} />
                             </motion.div>
                           )}
                         </AnimatePresence>
                       </div>
                     );
                   })}
                </div>
              </div>

              {/* Bottom Half: Info Area (Top Aligned below midline) */}
              <div className="absolute top-1/2 left-0 right-0 bottom-0 flex flex-col justify-start px-3 pt-3">
                <div className="relative flex flex-col h-full">
                  {selectedItem ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={selectedItem.index} 
                      className="flex flex-col h-full"
                    >
                      {/* Header */}
                      <div className="shrink-0 mb-2">
                        <selectedItem.icon className={`w-8 h-8 ${selectedItem.color} mb-1`} strokeWidth={1.5} />
                        <h2 className="text-lg font-black leading-none uppercase tracking-tighter text-slate-900 mb-1">
                          {selectedItem.name}
                        </h2>
                        <div className="h-0.5 w-8 bg-black mb-2"/>
                      </div>
                      
                      {/* Description: Scrollable if too long */}
                      <div className="flex-1 overflow-y-auto pr-1">
                        <p className="text-xs font-semibold text-slate-500 leading-tight">
                          {selectedItem.desc}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col text-slate-300 opacity-50 pb-2">
                      <Command size={32} strokeWidth={1} />
                      <span className="mt-2 text-[10px] font-bold tracking-widest uppercase">No Input</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section: Defense Layers */}
            <div className="w-1/2 relative bg-slate-50 border-l border-slate-100 -ml-px z-20">
               {/* Background Pattern */}
               <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
               
               {/* DIVIDER LINE - 75% up (25% from top) */}
               <div className="absolute top-[25%] left-0 right-0 h-px bg-slate-200 z-10" />

               {/* Top 25%: Enemy Buffs (Redesigned) */}
               <div className="absolute top-0 left-0 right-0 h-[25%] px-3 flex flex-col justify-center gap-0.5 overflow-hidden">
                  {/* Buff 1 */}
                  <div className="flex items-center gap-1.5">
                     <Sword size={14} strokeWidth={1} className="text-red-600 fill-current shrink-0" />
                     <span className="text-xs font-semibold text-slate-500 leading-tight truncate">
                       Enraged: +50% DMG
                     </span>
                  </div>
                  {/* Buff 2 */}
                  <div className="flex items-center gap-1.5">
                     <Shield size={14} strokeWidth={1} className="text-blue-600 fill-current shrink-0" />
                     <span className="text-xs font-semibold text-slate-500 leading-tight truncate">
                       Iron Skin: -2 INC
                     </span>
                  </div>
                  {/* Buff 3 */}
                  <div className="flex items-center gap-1.5">
                     <Zap size={14} strokeWidth={1} className="text-amber-500 fill-current shrink-0" />
                     <span className="text-xs font-semibold text-slate-500 leading-tight truncate">
                       Static: Thorns 3
                     </span>
                  </div>
               </div>

               {/* Defense Layers Container - Centered within the bottom 75% area */}
               <div className="absolute top-[25%] left-0 right-0 bottom-0 flex flex-col items-center justify-center p-2 z-10">
                 <div className="flex flex-col gap-1 w-full">
                   <DefenseRow icon={Heart} count={4} color="text-red-500" bgFill />
                   <DefenseRow icon={BicepsFlexed} count={4} color="text-yellow-600" bgFill />
                   <DefenseRow icon={Shield} count={4} color="text-slate-400" bgFill />
                   <DefenseRow icon={Shield} count={4} color="text-slate-400" bgFill />
                   <DefenseRow icon={Sparkles} count={4} color="text-purple-500" bgFill />
                   <DefenseRow icon={Sparkles} count={4} color="text-purple-500" bgFill />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* --- Bottom Half: Controls & Grid --- */}
        <div className={`h-1/2 ${theme.bg} p-4 flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.2)] relative z-20 rounded-t-2xl transition-colors duration-500`}>
          
          {/* Header */}
          <div className="mb-3 flex justify-between items-center shrink-0 h-10">
            {/* Toggle Switch */}
            <div 
              className={`w-14 h-8 rounded-full border ${theme.toggleTrack} flex items-center px-1 cursor-pointer transition-colors duration-300`}
              onClick={() => setIsBlueTheme(!isBlueTheme)}
            >
              <motion.div 
                className={`w-5 h-5 rounded-full shadow-md ${theme.toggleKnob}`}
                animate={{ x: isBlueTheme ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>

            {/* Refresh Button */}
            <button 
              onClick={handleRefresh}
              className={`group flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${theme.refreshBtn}`}
            >
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>

          {/* The 4x4 Grid */}
          <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-2">
            {gridItems.map((item) => {
              const isSelected = selectedId === item.index;
              const isKept = keptIds.includes(item.index);
              
              return (
                <button
                  key={item.index}
                  onClick={() => handleTileClick(item.index)}
                  className={`
                    relative rounded-lg flex items-center justify-center
                    transition-all duration-100 ease-out
                    ${isKept
                      ? 'bg-slate-700/80 border border-slate-600 cursor-not-allowed' // Gray, visible but distinct
                      : isSelected 
                        ? `${theme.selectedBg} ${theme.selectedShadow} -translate-y-1 z-10` // Dynamic Bright Color, NO Scale
                        : `${theme.tileBase} ${theme.tileHover} active:scale-95` // Default
                    }
                  `}
                >
                  <item.icon 
                    className={`
                      w-6 h-6 transition-all duration-200
                      ${isKept 
                        ? 'opacity-60 grayscale-[30%]' // Less severe blackout, color still faintly visible
                        : isSelected 
                          ? `${theme.selectedText}` // Dark text on bright bg, NO Scale
                          : item.color
                      }
                    `} 
                    strokeWidth={2}
                  />
                  
                  {isSelected && (
                    <motion.div 
                      layoutId="outline"
                      className="absolute inset-0 border-2 border-white/30 rounded-lg"
                      transition={{ duration: 0.15 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
