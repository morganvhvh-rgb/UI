#!/bin/bash

# 1. Create the project folder (if it doesn't exist, we'll make a subfolder 'my-game')
echo "🚀 Initializing Game Project..."
npm create vite@latest my-game -- --template react
cd my-game

# 2. Install Dependencies
echo "📦 Installing React, Framer Motion, and Lucide..."
npm install
npm install framer-motion lucide-react

# 3. Install and Init Tailwind CSS
echo "🎨 Installing Tailwind CSS..."
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Configure Tailwind (Overwrite tailwind.config.js)
echo "⚙️  Configuring Tailwind..."
cat > tailwind.config.js <<EOF
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# 5. Add Tailwind directives to CSS (Overwrite src/index.css)
echo "💅 Setting up CSS..."
cat > src/index.css <<EOF
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}
EOF

# 6. Inject the Game Code (Overwrite src/App.jsx)
echo "🎮 Writing Game Code..."
cat > src/App.jsx <<'EOF'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Battery, 
  Wifi, 
  Signal, 
  Lock, 
  RefreshCcw, 
  Menu, 
  Shield, 
  Sword, 
  Zap, 
  Backpack, 
  Pause,
  ChevronLeft,
  MoreVertical,
  Home,
  Layers,
  Smartphone
} from 'lucide-react';

// --- GAME LOGIC & UI COMPONENTS ---

const GameButton = ({ icon: Icon, label, color = "bg-blue-600", onClick }) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`${color} flex flex-col items-center justify-center p-3 rounded-xl shadow-lg border-b-4 border-black/20 active:border-b-0 active:translate-y-1 transition-all w-full aspect-square`}
  >
    <Icon className="w-6 h-6 text-white mb-1" />
    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{label}</span>
  </motion.button>
);

const GameStat = ({ label, value, color }) => (
  <div className="flex flex-col items-center">
    <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{label}</span>
    <motion.span 
      key={value}
      initial={{ scale: 1.2, color: '#fff' }}
      animate={{ scale: 1, color: color }}
      className={`text-xl font-black`}
    >
      {value}
    </motion.span>
  </div>
);

const GameInterface = ({ isSimulatorActive, toggleSimulator }) => {
  const [score, setScore] = useState(1250);
  const [energy, setEnergy] = useState(100);
  const [coins, setCoins] = useState(450);

  const handleAction = (type) => {
    if (type === 'attack') {
      setScore(s => s + 100);
      setEnergy(e => Math.max(0, e - 10));
    }
    if (type === 'defend') {
      setEnergy(e => Math.min(100, e + 5));
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-sans select-none">
      
      {/* TOP SECTION: HUD / Stats */}
      <header className="flex-none bg-slate-800/80 backdrop-blur-md border-b border-white/5 p-4 z-10">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center shadow-lg">
              <span className="font-bold text-sm">LVL</span>
            </div>
            <div>
              <div className="text-xs text-slate-400">Player 1</div>
              <div className="h-2 w-24 bg-slate-700 rounded-full mt-1 overflow-hidden">
                <motion.div 
                  className="h-full bg-green-400" 
                  initial={{ width: 0 }}
                  animate={{ width: `${energy}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* SIMULATOR TOGGLE BUTTON */}
          <button 
            onClick={toggleSimulator}
            className={`p-2 rounded-lg transition-colors ${isSimulatorActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
            title={isSimulatorActive ? "Turn off Simulator" : "Turn on Simulator"}
          >
            <Smartphone className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-between mt-4 px-2">
          <GameStat label="Score" value={score} color="#fbbf24" />
          <GameStat label="Energy" value={`${energy}%`} color="#4ade80" />
          <GameStat label="Gold" value={coins} color="#f472b6" />
        </div>
      </header>

      {/* MIDDLE SECTION: Main Viewport / Canvas */}
      <main className="flex-grow relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 1, -1, 0]
            }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="text-center opacity-50"
          >
            <div className="w-32 h-32 rounded-full border-4 border-dashed border-slate-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-slate-600 font-bold">GAME AREA</span>
            </div>
            <p className="text-sm text-slate-500 max-w-[200px]">
              This area stretches to fill available vertical space.
            </p>
          </motion.div>
        </div>
      </main>

      {/* BOTTOM SECTION: Controls */}
      <footer className="flex-none bg-slate-800/90 backdrop-blur-md border-t border-white/5 p-4 pb-6 z-10">
        <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
          <GameButton icon={Sword} label="Attack" color="bg-rose-600" onClick={() => handleAction('attack')} />
          <GameButton icon={Shield} label="Defend" color="bg-blue-600" onClick={() => handleAction('defend')} />
          <GameButton icon={Zap} label="Magic" color="bg-violet-600" onClick={() => setCoins(c => c - 10)} />
          <GameButton icon={Backpack} label="Items" color="bg-emerald-600" onClick={() => {}} />
        </div>
      </footer>

    </div>
  );
};

// --- SIMULATION WRAPPER ---
const BrowserSimulator = ({ children, isSimulatorActive }) => {
  if (!isSimulatorActive) {
    return <div className="h-screen w-full">{children}</div>;
  }

  return (
    <div className="min-h-screen w-full bg-stone-100 flex items-center justify-center p-4 lg:p-10 font-sans">
      
      {/* Phone Frame */}
      <div className="relative w-[375px] h-[812px] bg-black rounded-[3rem] shadow-2xl border-[8px] border-slate-900 overflow-hidden ring-4 ring-black/10 flex flex-col">
        
        {/* --- FAKE OS STATUS BAR (Top) --- */}
        <div className="h-[44px] bg-white flex justify-between items-center px-6 text-black z-50 select-none">
          <span className="text-xs font-semibold ml-2">9:41</span>
          <div className="flex items-center gap-1.5 mr-2">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* --- FAKE BROWSER URL BAR (Top - Chrome style) --- */}
        <div className="bg-white px-4 pb-2 pt-1 border-b border-slate-200 z-50 select-none">
          <div className="bg-slate-100 rounded-full h-10 flex items-center px-4 justify-between text-slate-500">
            <Lock className="w-3 h-3 text-slate-400" />
            <span className="text-sm truncate mx-2">game-preview.com</span>
            <RefreshCcw className="w-3 h-3 text-slate-700" />
          </div>
        </div>

        {/* --- VIEWPORT --- */}
        <div className="flex-grow relative w-full overflow-hidden bg-slate-900">
          {children}
        </div>

        {/* --- FAKE BROWSER TOOLBAR (Bottom - Safari/Chrome Hybrid) --- */}
        <div className="bg-white border-t border-slate-200 h-[50px] flex justify-around items-center px-4 z-50 text-slate-600 select-none">
          <ChevronLeft className="w-5 h-5 opacity-50" />
          <div className="w-5 h-5 opacity-50 rotate-180" ><ChevronLeft /></div>
          <Home className="w-5 h-5" />
          <Layers className="w-5 h-5" />
          <MoreVertical className="w-5 h-5" />
        </div>

        {/* --- FAKE HOME INDICATOR (OS Level) --- */}
        <div className="absolute bottom-1 left-0 right-0 h-[20px] z-50 flex justify-center items-end pb-2 pointer-events-none">
          <div className="w-32 h-1 bg-black/20 rounded-full backdrop-blur-sm"></div>
        </div>

      </div>

      {/* Controls Info (Only visible in simulator mode) */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2">
         <div className="bg-white p-4 rounded-lg shadow-xl text-slate-800 max-w-xs text-xs mb-2 hidden md:block">
            <p className="font-bold mb-1">Preview Mode</p>
            <p>Use the <Smartphone className="inline w-3 h-3"/> button in the top right of the game header to toggle this frame.</p>
         </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isSimulatorActive, setSimulatorActive] = useState(true);

  return (
    <BrowserSimulator isSimulatorActive={isSimulatorActive}>
      <GameInterface 
        isSimulatorActive={isSimulatorActive}
        toggleSimulator={() => setSimulatorActive(!isSimulatorActive)}
      />
    </BrowserSimulator>
  );
};

export default App;
EOF

# 7. Final Instructions
echo ""
echo "✅ Setup Complete!"
echo "👉 Type the following to start the game:"
echo "   cd my-game"
echo "   npm run dev"
echo ""