import React, { useState } from 'react';

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

  // Initialize state with random icons so they persist
  const [grids] = useState(() => ({
    left: Array.from({ length: 8 }, getRandomId),
    mid: Array.from({ length: 4 }, getRandomId),
    right: Array.from({ length: 4 }, getRandomId), // Reduced to 4
  }));

  const [isOverlayVisible, setIsOverlayVisible] = useState(true);

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
                  {grids.left.map((id, i) => (
                    <div 
                      key={`left-${i}`} 
                      className="w-14 h-14 bg-white rounded-md border-2 border-slate-200 shadow-sm flex items-center justify-center"
                    >
                      <Sprite index={id} size={40} />
                    </div>
                  ))}
                </div>
                {/* Yellow Button */}
                <button className="w-12 h-12 rounded-full bg-yellow-400 border-b-4 border-yellow-600 shadow-md active:border-b-0 active:translate-y-1 transition-all" />
              </div>

              {/* Center Grid: 2x2 with Overlay */}
              <div className="flex flex-col gap-1">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center mb-0.5">Mid</div>
                
                {/* Fixed size container to hold either the Chest or the Grid.
                    Width/Height Calc: (56px square * 2) + 4px gap = 116px
                */}
                <div className="relative w-[116px] h-[116px] flex items-center justify-center">
                  
                  {isOverlayVisible ? (
                    // THE CHEST (Icon 27)
                    <div 
                      className="cursor-pointer hover:scale-105 transition-transform active:scale-95 z-20"
                      onClick={() => setIsOverlayVisible(false)}
                    >
                      <Sprite index={27} size={120} className="drop-shadow-xl" />
                    </div>
                  ) : (
                    // THE HIDDEN GRID
                    <div className="grid grid-cols-2 gap-1 w-full h-full">
                      {grids.mid.map((id, i) => (
                        <div 
                          key={`mid-${i}`} 
                          className="w-14 h-14 bg-white rounded-md border-2 border-slate-200 shadow-sm flex items-center justify-center"
                        >
                          <Sprite index={id} size={40} />
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>

              {/* Right Grid: 1x4 + Red Button */}
              <div className="flex flex-col gap-1 items-center">
                 <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center mb-0.5">Right</div>
                 <div className="grid grid-cols-1 gap-1 mb-2">
                  {grids.right.map((id, i) => (
                    <div 
                      key={`right-${i}`} 
                      className="w-14 h-14 bg-white rounded-md border-2 border-slate-200 shadow-sm flex items-center justify-center"
                    >
                      <Sprite index={id} size={40} />
                    </div>
                  ))}
                </div>
                {/* Red Button */}
                <button className="w-12 h-12 rounded-full bg-red-500 border-b-4 border-red-700 shadow-md active:border-b-0 active:translate-y-1 transition-all" />
              </div>

            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="h-20 bg-slate-900 border-t border-slate-800 flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
            {/* Empty */}
          </div>

        </div>

      </div>
    </div>
  );
}
