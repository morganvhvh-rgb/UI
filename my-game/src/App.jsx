import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

// =============================================================================
// CONFIGURATION & ASSETS
// =============================================================================

const CONFIG = {
  SPRITE_SHEET_SRC: '/icons/simple.png',
  SPRITE_SIZE: 32,      // Size of one individual frame
  SHEET_WIDTH: 1760,    // Total width of the sheet
  SHEET_HEIGHT: 32,     // Total height of the sheet
  TOTAL_ICONS: 55,
};

// =============================================================================
// COMPONENTS
// =============================================================================

const Sprite = ({ index, size = 32, className = "" }) => {
  if (index === null || index === undefined) return null;

  // Convert 1-based index (user preference) to 0-based for calculation
  const zeroBasedIndex = Math.max(0, index - 1);
  
  // Calculate position
  const bgX = -(zeroBasedIndex * CONFIG.SPRITE_SIZE);
  const bgY = 0;

  // Calculate scaling factor
  const scale = size / CONFIG.SPRITE_SIZE;

  return (
    <div
      className={`relative inline-block overflow-hidden flex-shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${CONFIG.SPRITE_SHEET_SRC})`,
          backgroundPosition: `${bgX * scale}px ${bgY * scale}px`,
          backgroundSize: `${CONFIG.SHEET_WIDTH * scale}px ${CONFIG.SHEET_HEIGHT * scale}px`,
          imageRendering: 'pixelated', 
        }}
      />
    </div>
  );
};

// =============================================================================
// MAIN APP
// =============================================================================

export default function App() {
  // Helper to generate random ID between 1 and 55
  const getRandomId = () => Math.floor(Math.random() * CONFIG.TOTAL_ICONS) + 1;

  // Initialize state
  const [grids, setGrids] = useState(() => ({
    left: Array(8).fill(null), // Starts empty
    midTop: Array.from({ length: 4 }, getRandomId),
    midBottom: Array.from({ length: 4 }, () => 27), // 4 Chests
    right: Array(4).fill(null), // Starts empty
  }));

  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(null); // Track selected item in MidTop
  
  // Random "Special" Square Index for Left Grid (0-7)
  const [specialIndex] = useState(() => Math.floor(Math.random() * 8));

  // --- HOLD TO FILL LOGIC ---
  const [holdingSide, setHoldingSide] = useState(null); // 'left' | 'right' | null
  const [fillLevels, setFillLevels] = useState({ left: 0, right: 0 }); // 0 to 100
  const [clearedSides, setClearedSides] = useState({ left: false, right: false }); // Track if symbols are gone
  
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const animate = () => {
      setFillLevels(prev => {
        let newLeft = prev.left;
        let newRight = prev.right;
        const fillSpeed = 2.0;  // How fast it fills up
        const drainSpeed = 5.0; // How fast it drains when released

        // Handle Left Side
        if (holdingSide === 'left') {
          newLeft = Math.min(100, newLeft + fillSpeed);
        } else {
          newLeft = Math.max(0, newLeft - drainSpeed);
        }

        // Handle Right Side
        if (holdingSide === 'right') {
          newRight = Math.min(100, newRight + fillSpeed);
        } else {
          newRight = Math.max(0, newRight - drainSpeed);
        }

        return { left: newLeft, right: newRight };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [holdingSide]);

  // Monitor fill levels to trigger "clear" state
  useEffect(() => {
    if (fillLevels.left >= 100 && !clearedSides.left) {
      setClearedSides(prev => ({ ...prev, left: true }));
    }
    if (fillLevels.right >= 100 && !clearedSides.right) {
      setClearedSides(prev => ({ ...prev, right: true }));
    }
  }, [fillLevels, clearedSides]);

  // Handlers for button interactions
  const startHold = (side) => setHoldingSide(side);
  const endHold = () => setHoldingSide(null);

  // Helper to determine if a specific square index should be "filled"
  const isFilled = (side, index, totalItems, cols) => {
    const level = fillLevels[side];
    const totalRows = Math.ceil(totalItems / cols);
    const currentRow = Math.floor(index / cols); // 0 at top
    
    // Invert row for calculation: Bottom row becomes 0, top becomes 3
    const invertedRow = (totalRows - 1) - currentRow;
    
    // Calculate threshold
    const threshold = (invertedRow / totalRows) * 100;
    
    return level > threshold;
  };

  // --- GAMEPLAY LOGIC (MOVE SYMBOLS) ---

  const handleMidTopClick = (index) => {
    // Only select if there is an item there
    if (grids.midTop[index] !== null) {
      // Toggle selection if clicking the same one, otherwise select new
      setSelectedSourceIndex(prev => prev === index ? null : index);
    }
  };

  const handleTargetClick = (side, targetIndex) => {
    // Only move if we have a source selected and the target is empty
    if (selectedSourceIndex !== null && grids[side][targetIndex] === null) {
      setGrids(prev => {
        const newGrids = { ...prev };
        // Clone arrays to ensure React detects change
        newGrids.midTop = [...prev.midTop];
        newGrids[side] = [...prev[side]];

        // Move item
        newGrids[side][targetIndex] = newGrids.midTop[selectedSourceIndex];
        newGrids.midTop[selectedSourceIndex] = null; // Clear source

        return newGrids;
      });
      setSelectedSourceIndex(null); // Reset selection
    }
  };

  // Helper to check if mid top is completely empty
  const isMidTopEmpty = !isOverlayVisible && grids.midTop.every(item => item === null);

  // Handle clicking a chest in the bottom row to refill top
  const handleMidBottomClick = (index) => {
    // Can only refill if top is empty and the clicked bottom slot has a chest
    if (isMidTopEmpty && grids.midBottom[index] !== null) {
      setGrids(prev => {
        const newGrids = { ...prev };
        
        // 1. Consume the chest from bottom
        const newMidBottom = [...prev.midBottom];
        newMidBottom[index] = null;
        newGrids.midBottom = newMidBottom;

        // 2. Generate new loot for top
        newGrids.midTop = Array.from({ length: 4 }, getRandomId);
        
        return newGrids;
      });

      // 3. Reset the overlay so player has to open it again
      setIsOverlayVisible(true);
      setSelectedSourceIndex(null);
    }
  };

  // Market Logic
  const canUseMarket = !isOverlayVisible && grids.midTop.every(item => item !== null);

  const handleMarketClick = () => {
    if (!canUseMarket) return;

    setGrids(prev => {
      const newGrids = { ...prev };
      // Create copies
      const currentMidTop = [...newGrids.midTop];
      const currentLeft = [...newGrids.left];

      // Find all empty indices in the left grid
      const emptyIndices = currentLeft
        .map((val, idx) => val === null ? idx : null)
        .filter(val => val !== null);

      // If we don't have enough space, do nothing
      if (emptyIndices.length < 4) return prev;

      // Shuffle empty indices to get random destinations
      for (let i = emptyIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [emptyIndices[i], emptyIndices[j]] = [emptyIndices[j], emptyIndices[i]];
      }

      // Move items
      for (let i = 0; i < 4; i++) {
        const targetIndex = emptyIndices[i];
        currentLeft[targetIndex] = currentMidTop[i]; // Move symbol
        currentMidTop[i] = null; // Clear source
      }

      newGrids.midTop = currentMidTop;
      newGrids.left = currentLeft;

      return newGrids;
    });
    
    setSelectedSourceIndex(null);
  };

  return (
    // OUTER CONTAINER
    <div className="fixed inset-0 w-full h-full bg-neutral-900 flex items-center justify-center overflow-hidden font-sans">
      
      {/* PHONE CONTAINER */}
      <div className="w-full h-[100dvh] sm:w-[420px] sm:h-[800px] sm:max-h-[95vh] bg-slate-50 text-slate-800 select-none flex flex-col relative sm:rounded-[2.5rem] sm:border-[8px] sm:border-gray-800 sm:shadow-2xl overflow-hidden ring-1 ring-white/10">
        
        {/* APP CONTENT */}
        <div className="flex-1 w-full relative flex flex-col bg-slate-100">
          
          {/* TOP BAR */}
          <div className="h-16 bg-white border-b border-slate-200 flex-shrink-0 shadow-sm z-10">
            {/* Empty */}
          </div>

          {/* MAIN GAME AREA */}
          <div className="flex-1 w-full p-2 flex items-center justify-center overflow-hidden relative">
            
            {/* Alignment Wrapper */}
            <div className="flex justify-evenly items-start w-full">

              {/* Left Grid: 2x4 + Yellow Button */}
              <div className="flex flex-col gap-1 items-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center mb-0.5">Left</div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {grids.left.map((id, i) => {
                    const filled = isFilled('left', i, 8, 2);
                    const isSpecial = i === specialIndex;

                    // 1. FILLED STATE (Overrides everything)
                    if (filled) {
                      return (
                        <div 
                          key={`left-${i}`} 
                          onClick={() => handleTargetClick('left', i)}
                          className="w-14 h-14 rounded-md border-2 border-yellow-500 bg-yellow-400 shadow-sm flex items-center justify-center cursor-pointer transition-colors duration-200"
                        >
                          {!clearedSides.left && id !== null && <Sprite index={id} size={40} />}
                        </div>
                      );
                    }

                    // 2. SPECIAL STATE (The Animated Premium Square)
                    if (isSpecial) {
                      return (
                        <div 
                          key={`left-${i}`} 
                          onClick={() => handleTargetClick('left', i)}
                          className="w-14 h-14 relative rounded-md shadow-sm overflow-hidden cursor-pointer group"
                        >
                          {/* ROTATING LIGHTING BORDER */}
                          <motion.div 
                            className="absolute inset-[-50%]"
                            style={{
                              backgroundImage: 'conic-gradient(from 0deg, transparent 0deg, transparent 20deg, #fbcfe8 120deg, #ffffff 160deg, #fbcfe8 200deg, transparent 300deg)'
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          />

                          {/* INNER CONTAINER (Masks the center) */}
                          <motion.div 
                            className="absolute inset-[2px] rounded-[5px] flex items-center justify-center z-10 overflow-hidden border border-white/20"
                            animate={{ 
                              backgroundColor: ["#ffffff", "#fce7f3", "#f1f5f9", "#ffffff"] 
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          >
                            {/* Shine Sweep */}
                            <motion.div
                              className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/90 to-transparent -skew-x-12"
                              initial={{ x: '-150%' }}
                              animate={{ x: '150%' }}
                              transition={{ 
                                duration: 1.5, 
                                repeat: Infinity, 
                                repeatDelay: 1, 
                                ease: "easeInOut" 
                              }}
                            />
                            
                            {/* Content */}
                            <div className="z-10 relative">
                               {!clearedSides.left && id !== null && <Sprite index={id} size={40} />}
                            </div>
                          </motion.div>
                        </div>
                      );
                    }

                    // 3. DEFAULT EMPTY/NORMAL STATE
                    return (
                      <div 
                        key={`left-${i}`} 
                        onClick={() => handleTargetClick('left', i)}
                        className="w-14 h-14 rounded-md border-2 border-slate-200 bg-white hover:bg-slate-50 shadow-sm flex items-center justify-center transition-colors duration-200 cursor-pointer"
                      >
                         {!clearedSides.left && id !== null && <Sprite index={id} size={40} />}
                      </div>
                    );
                  })}
                </div>
                {/* Yellow Button */}
                <button 
                  className="w-12 h-12 rounded-full bg-yellow-400 border-b-4 border-yellow-600 shadow-md active:border-b-0 active:translate-y-1 transition-all"
                  onMouseDown={() => startHold('left')}
                  onMouseUp={endHold}
                  onMouseLeave={endHold}
                  onTouchStart={(e) => { e.preventDefault(); startHold('left'); }}
                  onTouchEnd={endHold}
                />
              </div>

              {/* Center Column: Two Grids */}
              <div className="flex flex-col gap-4">
                
                {/* Top Center Grid (With Chest Overlay) */}
                <div className="flex flex-col gap-1">
                  
                  {/* Market Button */}
                  <button 
                    onClick={handleMarketClick}
                    disabled={!canUseMarket}
                    className={`w-full h-9 mb-1 border rounded shadow-sm flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wide transition-all
                      ${canUseMarket 
                        ? 'bg-white border-slate-300 hover:bg-slate-50 text-slate-600 cursor-pointer active:translate-y-0.5' 
                        : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-70'}
                    `}
                  >
                    <ArrowLeft size={14} />
                    Market
                  </button>

                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center mb-0.5">Mid Top</div>
                  <div className="relative w-[116px] h-[116px] flex items-center justify-center">
                    {isOverlayVisible ? (
                      <div 
                        className="cursor-pointer hover:scale-105 transition-transform active:scale-95 z-20"
                        onClick={() => setIsOverlayVisible(false)}
                      >
                        <Sprite index={27} size={120} className="drop-shadow-xl" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1 w-full h-full">
                        {grids.midTop.map((id, i) => {
                          const isSelected = selectedSourceIndex === i;
                          
                          // Base classes
                          let bgClasses = 'bg-white border-slate-200 hover:bg-slate-50';
                          if (isSelected) {
                            bgClasses = 'bg-blue-100 border-blue-500 ring-2 ring-blue-300 z-10 scale-105';
                          }

                          return (
                            <div 
                              key={`midtop-${i}`} 
                              onClick={() => handleMidTopClick(i)}
                              className={`w-14 h-14 rounded-md border-2 shadow-sm flex items-center justify-center cursor-pointer transition-transform ${bgClasses}`}
                            >
                              <Sprite index={id} size={40} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Center Grid (Refill Source) */}
                <div className="flex flex-col gap-1">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center mb-0.5">Mid Bot</div>
                  <div className="grid grid-cols-2 gap-1 w-[116px]">
                    {grids.midBottom.map((id, i) => {
                      // Visual feedback for interaction availability
                      const isClickable = isMidTopEmpty && id !== null;

                      return (
                        <div 
                          key={`midbot-${i}`} 
                          onClick={() => handleMidBottomClick(i)}
                          className={`w-14 h-14 rounded-md border-2 shadow-sm flex items-center justify-center transition-all
                            ${isClickable 
                               ? 'bg-emerald-50 border-emerald-300 cursor-pointer hover:scale-105 animate-pulse' 
                               : 'bg-white border-slate-200'}
                          `}
                        >
                          <Sprite index={id} size={40} className={id === null ? 'opacity-0' : ''} />
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Grid: 1x4 + Red Button */}
              <div className="flex flex-col gap-1 items-center">
                 <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center mb-0.5">Right</div>
                 <div className="grid grid-cols-1 gap-1 mb-2">
                  {grids.right.map((id, i) => {
                    const filled = isFilled('right', i, 4, 1);
                    return (
                      <div 
                        key={`right-${i}`} 
                        onClick={() => handleTargetClick('right', i)}
                        className={`w-14 h-14 rounded-md border-2 border-slate-200 shadow-sm flex items-center justify-center transition-colors duration-200 cursor-pointer
                          ${filled ? 'bg-red-500 border-red-600' : 'bg-white hover:bg-slate-50'}
                        `}
                      >
                        {/* Only show sprite if NOT cleared and ID exists */}
                        {!clearedSides.right && id !== null && <Sprite index={id} size={40} />}
                      </div>
                    );
                  })}
                </div>
                {/* Red Button */}
                <button 
                  className="w-12 h-12 rounded-full bg-red-500 border-b-4 border-red-700 shadow-md active:border-b-0 active:translate-y-1 transition-all"
                  onMouseDown={() => startHold('right')}
                  onMouseUp={endHold}
                  onMouseLeave={endHold}
                  onTouchStart={(e) => { e.preventDefault(); startHold('right'); }}
                  onTouchEnd={endHold}
                />
              </div>

            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="h-32 bg-slate-900 border-t border-slate-800 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
            {/* Empty */}
          </div>

        </div>

      </div>
    </div>
  );
}
