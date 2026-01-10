import React, { useState, useEffect, useRef } from 'react';

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
  const [grids] = useState(() => ({
    left: Array.from({ length: 8 }, getRandomId),
    midTop: Array.from({ length: 4 }, getRandomId),
    midBottom: Array.from({ length: 4 }, () => 27), // New grid, all ID 27
    right: Array.from({ length: 4 }, getRandomId),
  }));

  const [isOverlayVisible, setIsOverlayVisible] = useState(true);

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

  return (
    // OUTER CONTAINER: Handles the dark background and centering on desktop
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
            
            {/* Alignment Wrapper: Centers the grid group vertically, aligns tops horizontally */}
            <div className="flex justify-evenly items-start w-full">

              {/* Left Grid: 2x4 + Yellow Button */}
              <div className="flex flex-col gap-1 items-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center mb-0.5">Left</div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  {grids.left.map((id, i) => {
                    const filled = isFilled('left', i, 8, 2);
                    return (
                      <div 
                        key={`left-${i}`} 
                        className={`w-14 h-14 rounded-md border-2 border-slate-200 shadow-sm flex items-center justify-center transition-colors duration-200 ${filled ? 'bg-yellow-200' : 'bg-white'}`}
                      >
                        {/* Only show sprite if NOT cleared */}
                        {!clearedSides.left && <Sprite index={id} size={40} />}
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
                        {grids.midTop.map((id, i) => (
                          <div 
                            key={`midtop-${i}`} 
                            className="w-14 h-14 bg-white rounded-md border-2 border-slate-200 shadow-sm flex items-center justify-center"
                          >
                            <Sprite index={id} size={40} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Center Grid (Static, All Chests) */}
                <div className="flex flex-col gap-1">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center mb-0.5">Mid Bot</div>
                  <div className="grid grid-cols-2 gap-1 w-[116px]">
                    {grids.midBottom.map((id, i) => (
                      <div 
                        key={`midbot-${i}`} 
                        className="w-14 h-14 bg-white rounded-md border-2 border-slate-200 shadow-sm flex items-center justify-center"
                      >
                        <Sprite index={id} size={40} />
                      </div>
                    ))}
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
                        className={`w-14 h-14 rounded-md border-2 border-slate-200 shadow-sm flex items-center justify-center transition-colors duration-200 ${filled ? 'bg-red-200' : 'bg-white'}`}
                      >
                        {/* Only show sprite if NOT cleared */}
                        {!clearedSides.right && <Sprite index={id} size={40} />}
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
