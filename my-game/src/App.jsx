import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookPage, setBookPage] = useState(0);
  
  // New State for Capture Screen
  const [isCaptureScreenOpen, setIsCaptureScreenOpen] = useState(false);
  // Animation states for capture reveal
  const [capturedBirdDisplay, setCapturedBirdDisplay] = useState('❓');
  const [isRevealed, setIsRevealed] = useState(false);

  // Luck & Chance States
  const [buttonMode, setButtonMode] = useState('dice'); // 'dice' or 'feather'
  const [luckValue, setLuckValue] = useState(null);
  // Changed: replaced featherCount with chanceLevel for persistent stat tracking
  const [chanceLevel, setChanceLevel] = useState(0);
  const [featherCount, setFeatherCount] = useState(null); // Keeping for internal slot logic if needed later
  // New state for multiplier display
  const [multiplierDisplay, setMultiplierDisplay] = useState(null);
  
  const [isRollingLuck, setIsRollingLuck] = useState(false);
  const [isRollingChance, setIsRollingChance] = useState(false);
  const [rollingDisplayValue, setRollingDisplayValue] = useState(1);
  const [chanceSlots, setChanceSlots] = useState(['❓', '❓', '❓']);
  const [isFinalResult, setIsFinalResult] = useState(false);
  
  // Mystery Bird State
  const [mysteryBird, setMysteryBird] = useState(null); // { x, y }
  
  const [showFlash, setShowFlash] = useState(false);
  // Camera Cooldown State
  const [isCameraCoolingDown, setIsCameraCoolingDown] = useState(false);

  const [currentShopPage, setCurrentShopPage] = useState(0);
  
  // Text Box State
  const [textIndex, setTextIndex] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(true);

  // Economy & Inventory
  const [money, setMoney] = useState(999);
  const [trees, setTrees] = useState([]); 
  const [flowers, setFlowers] = useState([]); 
  const [varietyItems, setVarietyItems] = useState([]); // Stores up to 2 purchased variety items
  
  const [activeItems, setActiveItems] = useState({
      house: null, 
      bath: null,  
      feeder: null 
  });

  const [pendingItem, setPendingItem] = useState(null); 
  const [selectedShopItem, setSelectedShopItem] = useState(null); 

  const luckTimeoutRef = useRef(null);
  const luckCycleRef = useRef(null);
  const slotIntervalRef = useRef(null);
  const mysteryBirdTimeoutRef = useRef(null);
  const cameraCooldownRef = useRef(null);

  const tutorialMessages = useMemo(() => [
      "This is your backyard. There's a few things you need to know. ➡",
      "If you plant a tree, you'll see the benefits right away. ➡",
      "But don't spend too much too early."
  ], []);

  // Cleaning up timeouts on unmount
  useEffect(() => {
    return () => {
      if (luckTimeoutRef.current) clearTimeout(luckTimeoutRef.current);
      if (luckCycleRef.current) clearTimeout(luckCycleRef.current);
      if (slotIntervalRef.current) clearInterval(slotIntervalRef.current);
      if (mysteryBirdTimeoutRef.current) clearTimeout(mysteryBirdTimeoutRef.current);
      if (cameraCooldownRef.current) clearTimeout(cameraCooldownRef.current);
    };
  }, []);

  const menuItems = useMemo(() => [
    { id: 'collection', icon: '📚', subItems: ['🌱', '🌼', '🌷', '🪻'], type: 'modal' }, 
    { id: 'flowers', icon: '🌼', subItems: ['🌱', '🌼', '🌷', '🪻'], type: 'slider' }, 
    { id: 'trees', icon: '🌳', subItems: ['🌵', '🌳', '🌲', '🌴'], type: 'slider' }, 
  ], []);

  const shopItems = useMemo(() => [
    {
      title: 'BIRDING SUPPLIES',
      bgColor: 'bg-[#a18068]', 
      toggleTheme: 'bg-amber-900', 
      sections: [
        {
          title: 'BIRD HOUSES',
          items: [
            { icon: '🏚', price: 1, stat: 5, type: 'house', label: 'Classic', bgColor: 'bg-red-100' },
            { icon: '🏠', price: 1, stat: 5, type: 'house', label: 'Manor', bgColor: 'bg-red-100' },
            { icon: '🏘', price: 1, stat: 5, type: 'house', label: 'Cottage', bgColor: 'bg-red-100' },
          ]
        },
        {
          title: 'BIRD BATHS',
          items: [
            // Changed icon from 🏺 to ⚱
            { icon: '⚱', price: 1, stat: 5, type: 'bath', label: 'Fountain', bgColor: 'bg-teal-100' },
            { icon: '🛁', price: 1, stat: 5, type: 'bath', label: 'Tub', bgColor: 'bg-teal-100' },
            { icon: '⛲', price: 1, stat: 5, type: 'bath', label: 'Bowl', bgColor: 'bg-teal-100' },
          ]
        },
        {
          title: 'BIRD FEEDERS',
          items: [
            { icon: '🪵', price: 1, stat: 5, type: 'feeder', label: 'Bagel', bgColor: 'bg-yellow-100' },
            { icon: '🫙', price: 1, stat: 5, type: 'feeder', label: 'Seed', bgColor: 'bg-yellow-100' },
            { icon: '⚖', price: 1, stat: 5, type: 'feeder', label: 'Cob', bgColor: 'bg-yellow-100' },
          ]
        }
      ]
    },
    {
      title: 'VARIETY STORE',
      bgColor: 'bg-[#ccff00]', 
      toggleTheme: 'bg-lime-600', 
      sections: [
        {
          title: '', 
          items: [
             { icon: '🎁', price: 1, stat: 5, type: 'misc' }, 
             { icon: '🔭', price: 1, stat: 5, type: 'misc' }, 
             { icon: '🪈', price: 1, stat: 5, type: 'misc' },
          ]
        },
        {
          title: '',
          items: [
            { icon: '📸', price: 1, stat: 5, type: 'misc' }, 
            { icon: '🍣', price: 1, stat: 5, type: 'misc' }, 
            { icon: '🐈', price: 1, stat: 5, type: 'misc' },
          ]
        },
        {
          title: '',
          items: [
            { icon: '👟', price: 1, stat: 5, type: 'misc' }, 
            { icon: '🕯️', price: 1, stat: 5, type: 'misc' }, 
            { icon: '🎃', price: 1, stat: 5, type: 'misc' },
          ]
        }
      ]
    }
  ], []);

  const birdCollection = useMemo(() => [
    '🐓','🦃','🦆','🦅','🕊️','🦢','🦜','🐦‍⬛',
    '🪿','🐦‍🔥','🦩','🦚','🦉','🦤','🐦','🐧','🐥'
  ], []);

  // Animation effect for Captured Screen
  useEffect(() => {
    if (isCaptureScreenOpen) {
      setIsRevealed(false);
      
      let timeoutId;
      let speed = 50; // Start fast
      let counter = 0;
      const totalSteps = 20; // Number of cycles before reveal

      const cycle = () => {
          // Pick a random silhouette from collection
          const randomBird = birdCollection[Math.floor(Math.random() * birdCollection.length)];
          setCapturedBirdDisplay(randomBird);
          counter++;

          if (counter < totalSteps) {
              // Slow down the animation as it progresses (Gacha feel)
              speed += (counter * 2.5); 
              timeoutId = setTimeout(cycle, speed);
          } else {
              // Final reveal after the last delay
              setCapturedBirdDisplay('🐦'); // Hardcoded target for now
              setIsRevealed(true);
          }
      };

      cycle();

      return () => clearTimeout(timeoutId);
    }
  }, [isCaptureScreenOpen, birdCollection]);

  const topBarData = useMemo(() => [
    { type: 'profile', icon: '👤' },
    { type: 'stat', label: 'MONEY', value: `$${money}`, color: 'text-green-600' },
    // Custom Luck Display - updated subValue to use chanceLevel
    { type: 'custom-luck', value: luckValue, subValue: chanceLevel },
    { type: 'stat', label: 'DAY', value: '1', color: 'text-blue-600' },
  ], [luckValue, chanceLevel, money]);

  const handleMenuClick = useCallback((item) => {
    if (item.type === 'modal') {
      setActiveMenu(null);
      setIsBookModalOpen(true);
      setBookPage(0);
      setPendingItem(null); 
    } else {
      setActiveMenu(prev => prev === item.id ? null : item.id);
      if (activeMenu !== item.id) setPendingItem(null); 
    }
  }, [activeMenu]);

  const handleSubItemClick = useCallback((subItem, parentId) => {
    if (parentId === 'trees') {
        if (subItem === '🌵') {
            setPendingItem({ icon: subItem, type: 'locked' });
        } else if (trees.length < 4) {
            setPendingItem({ icon: subItem, type: 'tree' });
        }
    } else if (parentId === 'flowers') {
        if (subItem === '🌱') {
            setPendingItem({ icon: subItem, type: 'locked' });
        } else if (flowers.length < 4) {
            setPendingItem({ icon: subItem, type: 'flower' });
        }
    }
  }, [trees, flowers]);

  const handleShopItemClick = useCallback((item) => {
      if (selectedShopItem === item) {
          if (money >= item.price) {
              setMoney(prev => prev - item.price);
              
              if (['house', 'bath', 'feeder'].includes(item.type)) {
                  setActiveItems(prev => ({
                      ...prev,
                      [item.type]: item 
                  }));
              } else if (item.type === 'misc') {
                  // Variety Store Item Logic
                  setVarietyItems(prev => {
                      const newItems = [...prev, item.icon];
                      // If we have more than 2, remove the oldest (FIFO)
                      if (newItems.length > 2) {
                          return newItems.slice(newItems.length - 2);
                      }
                      return newItems;
                  });
              }
              
              setSelectedShopItem(null);
          }
      } else {
          setSelectedShopItem(item);
      }
  }, [money, selectedShopItem]);

  const confirmPendingPurchase = useCallback(() => {
      if (pendingItem?.type === 'locked') {
          setPendingItem(null);
          return;
      }
      if (pendingItem && money >= 1) {
          if (pendingItem.type === 'tree' && trees.length < 4) {
              setMoney(prev => prev - 1);
              setTrees(prev => [...prev, pendingItem.icon]);
              setPendingItem(null);
              setActiveMenu(null); 
          } else if (pendingItem.type === 'flower' && flowers.length < 4) {
              setMoney(prev => prev - 1);
              setFlowers(prev => [...prev, pendingItem.icon]);
              // Permanently add +2 to chance counter
              setChanceLevel(prev => prev + 2);
              setPendingItem(null);
              setActiveMenu(null); 
          }
      }
  }, [pendingItem, money, trees, flowers]);

  const closeAllMenus = useCallback(() => {
    setActiveMenu(null);
    setPendingItem(null);
  }, []);

  const handleCameraClick = useCallback(() => {
    closeAllMenus();

    // Check Cooldown and Money
    if (isCameraCoolingDown) return;
    if (money < 1) return;

    // Deduct Cost
    setMoney(prev => prev - 1);
    
    // Start Cooldown
    setIsCameraCoolingDown(true);
    cameraCooldownRef.current = setTimeout(() => {
        setIsCameraCoolingDown(false);
    }, 3000); // 3 seconds

    // Trigger Flash
    setShowFlash(true);
    luckTimeoutRef.current = setTimeout(() => setShowFlash(false), 150);

    // Check Capture
    if (mysteryBird) {
        // Immediately remove the bird from the screen
        setMysteryBird(null);
        if (mysteryBirdTimeoutRef.current) clearTimeout(mysteryBirdTimeoutRef.current);
        
        setIsCaptureScreenOpen(true);
    }

  }, [closeAllMenus, isCameraCoolingDown, money, mysteryBird]);

  const handleLuckClick = useCallback(() => {
    closeAllMenus();
    if (isRollingLuck || isRollingChance) return;
    
    // Dice Mode: Roll Lucky Number
    if (buttonMode === 'dice') {
        // Reset previous values to start fresh for this "Turn"
        setLuckValue(null);
        setFeatherCount(null);
        setMultiplierDisplay(null);
        
        // Clear any pending mystery bird from previous turns
        if (mysteryBirdTimeoutRef.current) clearTimeout(mysteryBirdTimeoutRef.current);
        setMysteryBird(null);
        
        setIsRollingLuck(true);
        setIsFinalResult(false);
        
        let speed = 50;
        let counter = 0;
        const maxSteps = 12; 
        
        const cycle = () => {
          const nextNum = Math.floor(Math.random() * 99) + 1;
          setRollingDisplayValue(nextNum);
          counter++;

          if (counter < maxSteps) {
            speed += (counter * 8); 
            luckCycleRef.current = setTimeout(cycle, speed);
          } else {
            setLuckValue(nextNum); 
            setIsFinalResult(true); 
            setButtonMode('feather'); // Advance to next phase
            
            luckTimeoutRef.current = setTimeout(() => {
                setIsRollingLuck(false);
                setIsFinalResult(false);
            }, 1000);
          }
        };

        cycle();
    } 
    // Feather Mode: Roll Chance (Slots)
    else if (buttonMode === 'feather') {
        setIsRollingChance(true);
        setIsFinalResult(false);
        setMultiplierDisplay(null);

        // Define options
        const options = ['❌', '🪶'];
        
        // Initialize as blank (null) instead of '?' so they appear black
        setChanceSlots([null, null, null]);

        // Final Results
        const finalSlots = [
            options[Math.floor(Math.random() * options.length)],
            options[Math.floor(Math.random() * options.length)],
            options[Math.floor(Math.random() * options.length)]
        ];

        const startTime = Date.now();
        // Timing Configuration
        const spinDuration = 1000;
        const gapDuration = 200; // Small delay between reels
        
        // Clear interval if exists
        if (slotIntervalRef.current) clearInterval(slotIntervalRef.current);

        // Spin Loop
        slotIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            
            setChanceSlots(prev => {
                const newSlots = [...prev];
                
                // Reel 1 Logic: 0 -> 1000ms
                if (elapsed < spinDuration) {
                     newSlots[0] = options[Math.floor(Math.random() * options.length)];
                } else {
                     newSlots[0] = finalSlots[0];
                }

                // Reel 2 Logic: Starts after Reel 1 + gap
                const start2 = spinDuration + gapDuration;
                if (elapsed < start2) {
                    newSlots[1] = null; // Stays black during gap
                } else if (elapsed < start2 + spinDuration) {
                    newSlots[1] = options[Math.floor(Math.random() * options.length)];
                } else {
                    newSlots[1] = finalSlots[1];
                }

                // Reel 3 Logic: Starts after Reel 2 + gap
                const start3 = start2 + spinDuration + gapDuration;
                if (elapsed < start3) {
                    newSlots[2] = null; // Stays black during gap
                } else if (elapsed < start3 + spinDuration) {
                    newSlots[2] = options[Math.floor(Math.random() * options.length)];
                } else {
                    newSlots[2] = finalSlots[2];
                }
                
                return newSlots;
            });

            // Multiplier Display Logic (real-time updates)
            let currentM = 0;
            // Reel 1 Landed
            if (elapsed >= spinDuration && finalSlots[0] === '🪶') currentM++;
            
            // Reel 2 Landed
            const stop2 = spinDuration + gapDuration + spinDuration;
            if (elapsed >= stop2 && finalSlots[1] === '🪶') currentM++;

            // Reel 3 Landed
            const stop3 = stop2 + gapDuration + spinDuration;
            if (elapsed >= stop3 && finalSlots[2] === '🪶') currentM++;

            if (currentM > 0) {
                setMultiplierDisplay(`${currentM}x`);
            }

            // End Condition (Total time = Start3 + Spin + Buffer)
            const totalDuration = (spinDuration * 3) + (gapDuration * 2);
            
            if (elapsed > totalDuration + 100) {
                clearInterval(slotIntervalRef.current);
                setIsFinalResult(true);
                const count = finalSlots.filter(s => s === '🪶').length;
                setFeatherCount(count);
                
                // Apply Multiplier to Chance Level
                if (count > 0) {
                    setChanceLevel(prev => prev * count);
                }
                
                // --- MYSTERY BIRD EVENT TRIGGER ---
                const delay = Math.random() * 3000 + 2000; // 2-5 seconds random delay
                mysteryBirdTimeoutRef.current = setTimeout(() => {
                    // Random Position (avoiding edges slightly)
                    const x = Math.floor(Math.random() * 80) + 10; 
                    const y = Math.floor(Math.random() * 80) + 10;
                    setMysteryBird({ x, y });

                    // Disappear after 1 second
                    setTimeout(() => {
                        setMysteryBird(null);
                    }, 1000);
                }, delay);
                // ----------------------------------

                luckTimeoutRef.current = setTimeout(() => {
                    setIsRollingChance(false);
                    setIsFinalResult(false);
                    setButtonMode('dice'); // Revert to start
                    setMultiplierDisplay(null);
                }, 1500);
            }
            
        }, 80); // Fast cycle speed
    }

  }, [isRollingLuck, isRollingChance, buttonMode, closeAllMenus]);

  const toggleShopPage = useCallback(() => {
    setCurrentShopPage(prev => (prev + 1) % shopItems.length);
    setSelectedShopItem(null); 
  }, [shopItems.length]);

  const handleTextClick = useCallback((e) => {
    e.stopPropagation();
    if (textIndex < tutorialMessages.length - 1) {
        setTextIndex(prev => prev + 1);
    } else {
        // If it's the last message, close the box
        setIsTextVisible(false);
    }
  }, [textIndex, tutorialMessages.length]);

  const modalVariants = useMemo(() => ({
    backdrop: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
    profile: { initial: { y: '-100%' }, animate: { y: 0 }, exit: { y: '-100%' } },
    book: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
    shop: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
    capture: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } }
  }), []);

  const transitionSpring = useMemo(() => ({ type: 'spring', damping: 25, stiffness: 200 }), []);

  return (
    // Changed h-screen to h-[100dvh] for mobile browser support
    <div className="relative w-full h-[100dvh] bg-green-600 overflow-hidden select-none touch-none flex flex-col font-sans text-slate-900">
      
      {/* Capture Screen / Modal */}
      <AnimatePresence>
        {isCaptureScreenOpen && (
            <motion.div
                key="capture-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-6 backdrop-blur-sm"
            >
                {/* Wrapper for Card and Bubbles */}
                <div className="relative w-full max-w-sm flex flex-col items-center">
                    
                    {/* Left Bubble - Lucky Number */}
                    <motion.div 
                        initial={{ scale: 0, x: 50, rotate: 0 }} 
                        animate={{ scale: 1, x: 0, rotate: -12 }} 
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                        className="absolute top-12 -left-4 z-20 w-20 h-20 bg-pink-400 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center"
                    >
                        <span className="text-[8px] font-black text-white uppercase tracking-wider">LUCKY #</span>
                        <span className="text-3xl font-black text-white leading-none drop-shadow-md">{luckValue || 0}</span>
                    </motion.div>

                    {/* Right Bubble - Total Chance */}
                    <motion.div 
                        initial={{ scale: 0, x: -50, rotate: 0 }} 
                        animate={{ scale: 1, x: 0, rotate: 12 }} 
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
                        className="absolute bottom-24 -right-4 z-20 w-20 h-20 bg-orange-400 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center"
                    >
                        <span className="text-[8px] font-black text-black uppercase tracking-wider">CHANCE</span>
                        <span className="text-3xl font-black text-black leading-none">{chanceLevel}</span>
                    </motion.div>

                    {/* Main Card Container */}
                    <motion.div 
                        initial={{ scale: 0.8, rotate: -5 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-full bg-blue-400 border-4 border-black rounded-3xl p-6 flex flex-col items-center gap-4 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden"
                    >
                        {/* Background Pattern on Card */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_2px,transparent_2px)] [background-size:16px_16px] pointer-events-none" />

                        {/* Header Ribbon */}
                        <div className="bg-white border-2 border-black px-6 py-2 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 transform -rotate-1">
                            <h1 className="text-xl font-black text-black tracking-widest uppercase">
                                {isRevealed ? "NEW BIRD!" : "IDENTIFYING..."}
                            </h1>
                        </div>

                        {/* Photo Frame */}
                        <div className="w-64 h-64 bg-white p-4 pb-12 border-4 border-black shadow-lg rotate-1 flex flex-col items-center justify-center relative mt-4">
                            <div className="w-full h-full bg-slate-200 border-2 border-black/10 overflow-hidden relative flex items-center justify-center">
                                {/* Sunburst for reveal */}
                                {isRevealed && (
                                    <motion.div 
                                        initial={{ opacity: 0, rotate: 0 }}
                                        animate={{ opacity: 0.5, rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-[-50%] bg-[conic-gradient(from_90deg_at_50%_50%,#fcd34d_0deg,transparent_60deg,#fcd34d_120deg,transparent_180deg,#fcd34d_240deg,transparent_300deg,#fcd34d_360deg)]"
                                    />
                                )}
                                
                                <motion.span 
                                    key={capturedBirdDisplay}
                                    initial={isRevealed ? { scale: 0.5, opacity: 0 } : {}}
                                    animate={isRevealed ? { scale: 1.5, opacity: 1 } : { scale: 1 }}
                                    transition={isRevealed ? { type: "spring", stiffness: 300, damping: 15 } : {}}
                                    className={`text-8xl relative z-10 ${isRevealed ? '' : 'grayscale brightness-0 opacity-50'}`}
                                >
                                    {capturedBirdDisplay}
                                </motion.span>
                            </div>
                            {/* Decorative 'tape' */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-yellow-200/50 rotate-2 backdrop-blur-sm border border-white/40" />
                        </div>

                        {/* Info / Close Area */}
                        <div className="h-16 w-full flex items-center justify-center z-10 mt-2">
                            <AnimatePresence mode='wait'>
                                {isRevealed ? (
                                    <motion.button 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => setIsCaptureScreenOpen(false)}
                                        className="px-8 py-3 bg-green-500 rounded-xl font-black text-white text-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-transform hover:bg-green-400"
                                    >
                                        COLLECT
                                    </motion.button>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex gap-1"
                                    >
                                        {[0,1,2].map(i => (
                                            <motion.div 
                                                key={i}
                                                animate={{ scale: [1, 1.5, 1] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                                                className="w-3 h-3 bg-black rounded-full" 
                                            />
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Mystery Bird Overlay */}
      {mysteryBird && (
        <div 
            className="absolute z-[100] text-9xl pointer-events-none filter brightness-0 select-none drop-shadow-2xl"
            style={{ 
                top: `${mysteryBird.y}%`, 
                left: `${mysteryBird.x}%`, 
                transform: 'translate(-50%, -50%)' 
            }}
        >
            🐦
        </div>
      )}

      {/* Camera Flash */}
      <AnimatePresence>
        {showFlash && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="absolute inset-0 z-[70] bg-white pointer-events-none mix-blend-hard-light"
            />
        )}
      </AnimatePresence>

      {/* Main Screen Purchase/Lock Confirmation */}
      <AnimatePresence>
        {pendingItem && (
            <motion.div 
                initial={{ y: -100, x: "-50%", opacity: 0 }}
                animate={{ y: 0, x: "-50%", opacity: 1 }}
                exit={{ y: -100, x: "-50%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute top-24 left-1/2 z-[60]"
            >
                <button 
                    onClick={confirmPendingPurchase}
                    className="bg-white px-6 py-2 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 active:scale-95"
                >
                    <span className="text-2xl">{pendingItem.icon}</span>
                    <div className="flex flex-col items-start leading-none">
                        {pendingItem.type === 'locked' ? (
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                LOCKED
                            </span>
                        ) : (
                            <>
                                {/* Conditional Label for Flowers vs Trees/Items */}
                                <span className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${pendingItem.type === 'flower' ? 'text-orange-500' : 'text-pink-500'}`}>
                                    {pendingItem.type === 'flower' ? 'CHANCE +2' : 'LUCK +3'}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-green-600">${pendingItem.price || 1}</span>
                                </div>
                            </>
                        )}
                    </div>
                </button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Luck Rolling Animation - Lucky Number */}
      <AnimatePresence>
        {isRollingLuck && (
            // Added pb-40 to shift container content up
            <div className="absolute inset-0 z-[60] flex items-center justify-center pb-40 pointer-events-none">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="relative w-40 h-40 bg-pink-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-3xl flex flex-col items-center justify-center pointer-events-auto"
                >
                    <div className="absolute -top-5 bg-white px-3 py-1 border-2 border-black rounded-full font-black text-xs tracking-wider shadow-sm transform -rotate-3 text-black">
                        LUCKY NUMBER
                    </div>
                    <motion.div 
                        className="text-7xl font-black tabular-nums tracking-tighter text-white"
                        animate={isFinalResult ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3 }}
                    >
                        {rollingDisplayValue}
                    </motion.div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Luck Rolling Animation - Chance (Slots) */}
      <AnimatePresence>
        {isRollingChance && (
            // Added pb-40 to shift container content up
            <div className="absolute inset-0 z-[60] flex items-center justify-center pb-40 pointer-events-none">
                <motion.div
                    initial={{ scale: 0, rotate: 12 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="relative w-64 h-32 bg-orange-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-3xl flex flex-col items-center justify-center pointer-events-auto"
                >
                    {/* Header Label */}
                    <div className="absolute -top-5 bg-white px-3 py-1 border-2 border-black rounded-full font-black text-xs tracking-wider shadow-sm transform rotate-2 text-black">
                        CHANCE
                    </div>

                    {/* Multiplier Badge - Appears when feathers land */}
                    <AnimatePresence>
                        {multiplierDisplay && (
                            <motion.div
                                initial={{ scale: 0, rotate: -15, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                key={multiplierDisplay} // Re-animate on change (1x -> 2x)
                                className="absolute -top-6 -right-4 bg-white border-2 border-black rounded-full w-12 h-12 flex items-center justify-center z-20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <span className="text-xl font-black text-black">{multiplierDisplay}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex gap-2">
                         {chanceSlots.map((slot, i) => (
                             <motion.div
                                key={i}
                                // Changed background to slate-900 for "black" look when empty
                                className={`w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center text-4xl overflow-hidden shadow-inner`}
                                animate={isFinalResult ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ delay: i * 0.1, duration: 0.3 }}
                             >
                                 {/* Only render content if slot is not null */}
                                 {slot && (
                                     <motion.div
                                        key={slot + i} // Key change triggers animation
                                        initial={{ y: -20, opacity: 0.5, filter: "blur(2px)" }}
                                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                                        transition={{ duration: 0.08 }}
                                     >
                                        {slot}
                                     </motion.div>
                                 )}
                             </motion.div>
                         ))}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header className="w-full h-20 shrink-0 z-30 px-4 py-3 flex items-center gap-3 relative">
        <div className="absolute inset-0 bg-amber-400 border-b-4 border-black shadow-lg z-0">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]"></div>
        </div>
        
        {topBarData.map((item, i) => {
            if (item.type === 'custom-luck') {
                return (
                    <motion.div 
                        key={`custom-luck-${i}`}
                        onClick={() => {
                           // Potentially handle luck click here too
                        }}
                        className="relative h-full z-10 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-1 rounded-lg overflow-hidden group"
                        style={{
                            background: 'linear-gradient(135deg, #f472b6 50%, #fb923c 50%)' 
                        }}
                    >
                        {/* Removed the black diagonal slash line div */}
                        {/* The gradient background above provides the color separation */}

                        {/* Top Left - Pink - Lucky Number */}
                        <div className="absolute top-1 left-2">
                             <span className="text-xl font-black text-white drop-shadow-md">
                                 {item.value !== null ? item.value : ''}
                             </span>
                        </div>

                        {/* Bottom Right - Orange - Feather Count */}
                        <div className="absolute bottom-0 right-2">
                             <span className="text-xl font-black text-black">
                                 {item.subValue !== null ? item.subValue : ''}
                             </span>
                        </div>
                    </motion.div>
                );
            }

            return (
              <motion.div 
                key={`${item.type}-${i}`}
                onClick={() => {
                    if (item.type === 'profile') {
                        setIsProfileOpen(true);
                        closeAllMenus();
                    }
                }}
                whileTap={item.type === 'profile' ? { scale: 0.95 } : {}}
                className={`
                    relative h-full z-10 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    flex flex-col items-center justify-center text-center
                    ${item.type === 'profile' ? 'aspect-square rounded-full flex-none cursor-pointer' : 'flex-1 rounded-lg'}
                `}
              >
                 {item.type === 'profile' ? (
                    <span className="text-2xl filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">{item.icon}</span>
                 ) : (
                    <>
                        <span className="text-[10px] font-black opacity-60 leading-tight tracking-widest uppercase text-slate-500">{item.label}</span>
                        <span className={`text-base font-black leading-none ${item.color || 'text-slate-900'} min-h-[1em]`}>
                            <AnimatePresence mode='wait'>
                                <motion.span 
                                    key={item.value} 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {item.value}
                                </motion.span>
                            </AnimatePresence>
                        </span>
                    </>
                 )}
              </motion.div>
            );
        })}
      </header>

      {/* Main Game Viewport */}
      <div 
        className="flex-1 relative w-full flex overflow-hidden" 
        onClick={closeAllMenus}
      >
        
        {/* Background Pattern */}
        <div 
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
                backgroundColor: '#4ade80',
                backgroundImage: `
                    linear-gradient(45deg, #16a34a 25%, transparent 25%, transparent 75%, #16a34a 75%),
                    linear-gradient(45deg, #16a34a 25%, transparent 25%, transparent 75%, #16a34a 75%)
                `,
                backgroundPosition: '0 0, 30px 30px',
                backgroundSize: '60px 60px'
            }}
        />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] pointer-events-none"></div>

        {/* Text Window - Updated Styling & Fade Out */}
        <AnimatePresence>
            {isTextVisible && (
                <motion.div 
                    onClick={handleTextClick}
                    initial={{ opacity: 1, y: 0, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, x: "-50%" }}
                    exit={{ opacity: 0, y: -10, x: "-50%" }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-4 left-1/2 w-[85%] max-w-sm h-auto min-h-[4rem] py-3 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-center justify-center z-40 pointer-events-auto cursor-pointer active:scale-95"
                >
                    <AnimatePresence mode='wait'>
                        <motion.span 
                            key={textIndex}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-black text-sm font-black tracking-wide text-center px-4 leading-tight select-none flex items-center justify-center gap-2"
                        >
                            {tutorialMessages[textIndex]}
                            {textIndex === tutorialMessages.length - 1 && (
                                <span className="text-red-500 font-black text-lg animate-pulse">✖</span>
                            )}
                        </motion.span>
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Decorative Variety Items (Replaces Static Telescope/Gift) */}
        <div className="absolute bottom-2 left-2 z-8 pointer-events-none flex items-end gap-1">
            <AnimatePresence>
                {varietyItems.map((item, index) => (
                    <motion.div
                        key={`variety-${index}`}
                        initial={{ opacity: 0, scale: 0, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className={`text-5xl filter drop-shadow-lg opacity-90 ${index % 2 === 0 ? 'transform -rotate-12 pb-1' : 'transform rotate-6'}`}
                    >
                        {item}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {/* Trees Layer */}
        <div className="absolute inset-0 z-5 pointer-events-none">
            <AnimatePresence>
                {trees.map((tree, i) => (
                    <motion.div
                        key={`tree-${i}`}
                        initial={{ scale: 0, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="absolute text-9xl filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] origin-bottom"
                        style={{ 
                            bottom: `${15 + (i * 18)}%`,
                            right: '-1rem', // Shifted more to the right (offscreen slightly)
                            zIndex: 10 - i // Stacking order reversed: Bottom trees (i=0) are on top (zIndex=10)
                        }}
                    >
                        {tree}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {/* Flowers Layer */}
        <div className="absolute inset-0 z-6 pointer-events-none">
            <AnimatePresence>
                {flowers.map((flower, i) => (
                    <motion.div
                        key={`flower-${i}`}
                        initial={{ scale: 0, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="absolute text-5xl filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] origin-bottom"
                        style={{ bottom: '15%', right: `${6 + (i * 3)}rem` }} 
                    >
                        {flower}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {/* Left Side Meters */}
        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 bg-red-900 rounded-r-2xl pl-3 pr-2 py-4 flex flex-col gap-4 z-20 border-y-2 border-r-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {[
            { icon: '📈', color: 'bg-blue-500', value: 50 },
            { icon: '🚘', color: 'bg-slate-400', value: 50 } // Changed icon to 🚘
          ].map((meter, i) => (
            <div key={meter.icon} className="relative flex flex-col items-center gap-1">
              <span className="text-xl filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">{meter.icon}</span>
              <div className="w-6 h-24 bg-slate-800 border-2 border-black shadow-inner rounded-lg overflow-hidden flex flex-col-reverse">
                <motion.div 
                  className={`w-full ${meter.color}`}
                  initial={{ height: '0%' }}
                  animate={{ height: `${meter.value}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Center Stage - Active Item UI */}
        <div className="flex-1 relative z-10 flex items-center justify-center pointer-events-none">
            {/* Active Items Container */}
            <div className="flex items-center justify-center -space-x-5 pr-14 pointer-events-none">
                <AnimatePresence mode='popLayout'>
                    {/* Feeder (Left, Top z-index) */}
                    {activeItems.feeder && (
                        <ActiveItemCard 
                            key="feeder" 
                            item={activeItems.feeder} 
                            type="FEEDER" 
                            zIndex="z-30"
                            bgColor="bg-yellow-100"
                            labelColor="bg-yellow-500"
                        />
                    )}
                    {/* Bath (Center, Mid z-index) */}
                    {activeItems.bath && (
                        <ActiveItemCard 
                            key="bath" 
                            item={activeItems.bath} 
                            type="BATH" 
                            zIndex="z-20"
                            bgColor="bg-teal-100"
                            labelColor="bg-teal-500"
                        />
                    )}
                    {/* House (Right, Low z-index) */}
                    {activeItems.house && (
                        <ActiveItemCard 
                            key="house" 
                            item={activeItems.house} 
                            type="HOUSE" 
                            zIndex="z-10"
                            bgColor="bg-red-100"
                            labelColor="bg-red-500"
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Right Side Buttons */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-5 items-end z-50">
                {menuItems.map((item, index) => (
                    <MemoizedSideMenu 
                        key={item.id}
                        item={item}
                        delay={0.1 * (index + 1)}
                        isActive={activeMenu === item.id}
                        onToggle={() => handleMenuClick(item)}
                        onSubItemClick={handleSubItemClick}
                    />
                ))}
            </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="w-full h-auto min-h-[140px] z-30 relative shrink-0">
        <div className="absolute inset-0 bg-[#2c1810] border-t-4 border-black shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'linear-gradient(to bottom, #e2e8f0 2px, transparent 2px)', 
                     backgroundSize: '100% 8px' 
                 }} 
            />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        </div>
        
        <div className="relative z-10 w-full h-full p-6 flex items-end justify-center gap-4 pb-8">
             {/* Left Action - Shop */}
            <motion.button 
                onClick={() => {
                    setIsShopOpen(true);
                    closeAllMenus();
                }}
                whileTap={{ scale: 0.95, y: 4, boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)' }}
                className="h-16 w-16 rounded-2xl bg-amber-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group flex items-center justify-center"
            >
                 <span className="text-3xl filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)] relative z-10 group-active:scale-90 transition-transform">🛍️</span>
            </motion.button>

            {/* Center Main Action - Camera */}
            <motion.button 
                onClick={handleCameraClick}
                disabled={isCameraCoolingDown || money < 1}
                whileTap={(!isCameraCoolingDown && money >= 1) ? { scale: 0.98, y: 4, boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)' } : {}}
                className={`h-20 w-24 mb-1 rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group flex items-center justify-center transition-colors duration-200
                    ${isCameraCoolingDown ? 'bg-red-500 cursor-not-allowed' : (money < 1 ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600')}
                `}
            >
                 <span className="text-4xl filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] relative z-10 -mt-2 group-active:rotate-12 transition-transform duration-300">📷</span>
                 {/* Cooldown Overlay (optional visual cue, but the button is red now) */}
                 {isCameraCoolingDown && <div className="absolute inset-0 bg-black/10" />}
            </motion.button>

             {/* Right Action - Luck */}
             <motion.button 
                onClick={handleLuckClick}
                whileTap={{ scale: 0.95, y: 4, boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)' }}
                className={`h-16 w-16 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group flex items-center justify-center transition-colors duration-500
                    ${buttonMode === 'feather' ? 'bg-orange-400' : 'bg-pink-400'}
                `}
            >
                 <motion.span 
                    key={buttonMode}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)] relative z-10 group-active:scale-90"
                 >
                    {buttonMode === 'feather' ? '🪶' : '🎲'}
                 </motion.span>
            </motion.button>
        </div>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
            <>
                <motion.div
                    {...modalVariants.backdrop}
                    onClick={() => setIsProfileOpen(false)}
                    className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
                />
                <motion.div
                    {...modalVariants.profile}
                    transition={transitionSpring}
                    className="absolute top-0 left-0 right-0 h-2/3 z-50 bg-blue-200 border-b-4 border-black shadow-[0_10px_0px_0px_rgba(0,0,0,0.2)] rounded-b-3xl flex flex-col overflow-hidden"
                >
                    <CloseButton onClick={() => setIsProfileOpen(false)} />
                    
                    <div className="w-full flex-1 flex flex-col p-6 gap-4 mt-8">
                         <div className="text-2xl font-black text-blue-800 tracking-wider text-center mb-2">PROFILE</div>
                         
                         {/* Player Section */}
                         <div className="bg-white/50 rounded-xl p-4 border-2 border-blue-300/50 flex flex-col gap-2">
                             <div className="text-xs font-black text-blue-400 uppercase tracking-widest">PLAYER</div>
                             <div className="h-12 bg-blue-100 rounded-lg animate-pulse" />
                         </div>

                         {/* Other Section */}
                         <div className="bg-white/50 rounded-xl p-4 border-2 border-blue-300/50 flex flex-col gap-2">
                             <div className="text-xs font-black text-blue-400 uppercase tracking-widest">OTHER</div>
                             <div className="h-12 bg-blue-100 rounded-lg animate-pulse" />
                         </div>

                         {/* Stats Section */}
                         <div className="bg-white/50 rounded-xl p-4 border-2 border-blue-300/50 flex flex-col gap-2 flex-1">
                             <div className="text-xs font-black text-blue-400 uppercase tracking-widest">STATS</div>
                             <div className="flex-1 bg-blue-100 rounded-lg animate-pulse" />
                         </div>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* Book Modal */}
      <AnimatePresence>
        {isBookModalOpen && (
            <>
                <motion.div
                    {...modalVariants.backdrop}
                    onClick={() => setIsBookModalOpen(false)}
                    className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
                />
                <motion.div
                    {...modalVariants.book}
                    transition={transitionSpring}
                    className="absolute top-0 right-0 w-3/4 max-w-sm h-full z-50 bg-purple-200 border-l-4 border-black shadow-[-10px_0px_0px_0px_rgba(0,0,0,0.2)] flex flex-col"
                >
                     <div className="p-4 border-b-4 border-purple-300 bg-white flex items-center justify-between shrink-0">
                         <div>
                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {bookPage === 0 ? "Collection" : "Favorites"}
                             </div>
                             <div className="text-xl font-black text-slate-800">
                                {bookPage === 0 ? "BIRDS" : "PAGE 2"}
                             </div>
                         </div>
                         <CloseButton onClick={() => setIsBookModalOpen(false)} />
                     </div>

                     {bookPage === 0 ? (
                         <div className="flex-1 overflow-hidden p-4">
                            <div className="grid grid-cols-4 gap-2">
                                {birdCollection.map((bird, index) => (
                                    <motion.div
                                        key={bird}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="aspect-square flex items-center justify-center opacity-40 select-none bg-purple-100/50 rounded-lg overflow-hidden"
                                    >
                                        <span className="text-4xl filter grayscale brightness-0 drop-shadow-sm leading-none">
                                            {bird}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="mt-4 text-center text-[10px] text-purple-800 font-bold uppercase tracking-widest">
                                0/{birdCollection.length} Unlocked
                            </div>
                         </div>
                     ) : (
                         <div className="flex-1 flex flex-col items-center justify-center p-6 text-purple-300">
                            <span className="text-6xl mb-4 opacity-50">✨</span>
                            <span className="font-bold uppercase tracking-widest text-sm">(Blank Page)</span>
                         </div>
                     )}

                     <div className="absolute bottom-6 right-6 z-20">
                         <motion.button
                            onClick={() => setBookPage(page => page === 0 ? 1 : 0)}
                            whileTap={{ scale: 0.9, rotate: -10 }}
                            className="w-14 h-14 bg-yellow-400 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-2xl"
                         >
                            ⭐
                         </motion.button>
                     </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* Shop Modal */}
      <AnimatePresence>
        {isShopOpen && (
            <>
                <motion.div
                    {...modalVariants.backdrop}
                    onClick={() => setIsShopOpen(false)}
                    className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
                />
                <motion.div
                    {...modalVariants.shop}
                    transition={transitionSpring}
                    className={`absolute bottom-0 left-0 right-0 h-2/3 z-50 border-t-4 border-black shadow-[0_-10px_0px_0px_rgba(0,0,0,0.2)] rounded-t-3xl flex flex-col overflow-hidden transition-colors duration-300 ${shopItems[currentShopPage].bgColor}`}
                >
                    <div className="z-50">
                        <CloseButton onClick={() => setIsShopOpen(false)} />
                    </div>
                    
                    {/* Header - Reduced padding and removed rotation */}
                    <div className="w-full p-4 flex items-center justify-center shrink-0 relative z-10">
                         <div className="relative">
                             <div className="absolute top-1 left-1 w-full h-full bg-black/20 rounded-xl" />
                             <div className="relative bg-white border-2 border-black px-6 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                 {/* Reduced text size and tracking */}
                                 <span className="text-lg font-black text-black tracking-wide">{shopItems[currentShopPage].title}</span>
                             </div>
                         </div>
                    </div>

                    {/* Shop Content - Reduced padding and gaps for mobile fit */}
                    <div className="flex-1 w-full overflow-hidden px-4 pb-0 flex flex-col justify-start">
                        <div className="h-full flex flex-col justify-start gap-2">
                            {shopItems[currentShopPage].sections.map((section, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    {/* Removed skew (italics styling) */}
                                    <div className="text-[9px] font-black text-black uppercase tracking-widest pl-1 h-[1.5em]">
                                        {section.title} &nbsp;
                                    </div>
                                    {/* Reduced gap to fit items */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {section.items.map((item, i) => (
                                            <ShopItem 
                                                key={`${item.icon}-${i}`} 
                                                item={item} 
                                                isSelected={selectedShopItem === item}
                                                onClick={handleShopItemClick}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer - Toggle Switch */}
                    <div className={`w-full p-2 flex justify-center shrink-0 pb-6 border-t-2 border-stone-300/30 transition-colors duration-300 ${shopItems[currentShopPage].bgColor}`}>
                        <div 
                            onClick={toggleShopPage}
                            className={`w-20 h-10 rounded-full relative cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border-2 border-black/20 transition-colors duration-300 ${shopItems[currentShopPage].toggleTheme}`}
                        >
                            <motion.div 
                                className="absolute top-1 bottom-1 w-8 bg-white rounded-full shadow-md border-2 border-black/10"
                                animate={{ left: currentShopPage === 0 ? '4px' : 'calc(100% - 36px)' }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </div>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

    </div>
  );
};

// Reusable Active Item Card Component
const ActiveItemCard = React.forwardRef(({ item, type, zIndex, bgColor, labelColor }, ref) => (
    <motion.div
        ref={ref}
        layout
        initial={{ scale: 0, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={`pointer-events-auto w-20 h-20 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center relative group ${bgColor} ${zIndex}`}
    >
        <div className={`absolute -top-3 ${labelColor} text-[8px] font-black px-1.5 py-0.5 border-2 border-black rounded-full text-white tracking-wider shadow-sm z-10`}>
            {type}
        </div>
        <div className="text-5xl filter drop-shadow-md leading-none">
            {item.icon}
        </div>
        <div className="absolute bottom-0 right-1 text-sm font-black text-black z-10">
            {item.stat}
        </div>
    </motion.div>
));

// Extracted Shop Item Component for consistency
const ShopItem = ({ item, onClick, isSelected }) => (
    <motion.div
        onClick={() => onClick(item)}
        whileTap={{ scale: 0.95 }}
        animate={isSelected ? { scale: 0.95, borderColor: '#16a34a' } : { scale: 1, borderColor: '#e7e5e4' }}
        // Reduced height from h-16 to h-14 to fit content better on mobile
        className={`relative rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] border-2 flex items-center justify-center overflow-hidden cursor-pointer h-14
        ${item.bgColor || 'bg-white'}
        ${isSelected ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
    >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="text-4xl filter drop-shadow-sm transform -translate-y-0.5">{item.icon}</span>
        </div>

        <AnimatePresence>
            {isSelected && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-green-500/80 z-20 flex items-center justify-center"
                >
                    <span className="text-white font-black text-sm uppercase tracking-wider drop-shadow-md">CONFIRM?</span>
                </motion.div>
            )}
        </AnimatePresence>

        {!isSelected && (
            <div className="absolute top-1 left-2 z-10">
                <span className="text-xl font-black text-black drop-shadow-sm">{item.stat}</span>
            </div>
        )}

        {!isSelected && (
            <div className="absolute bottom-1 right-1 bg-white/90 px-1.5 py-0.5 rounded-md border border-stone-200 shadow-sm z-10">
                <span className="text-[10px] font-black text-green-700">${item.price}</span>
            </div>
        )}
    </motion.div>
);

const SideMenu = ({ item, delay, isActive, onToggle, onSubItemClick }) => (
    <div className="relative flex items-center justify-end pointer-events-auto">
        <AnimatePresence>
            {isActive && item.subItems && (
                <motion.div
                    initial={{ opacity: 0, x: 20, scaleX: 0 }}
                    animate={{ opacity: 1, x: -12, scaleX: 1 }}
                    exit={{ opacity: 0, x: 20, scaleX: 0 }}
                    style={{ originX: 1 }}
                    className="absolute right-full h-14 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-center px-2 gap-1 z-0"
                >
                    {item.subItems.map((subItem) => (
                        <motion.button
                            key={subItem}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSubItemClick && onSubItemClick(subItem, item.id);
                            }}
                            whileTap={{ scale: 0.8 }}
                            className="w-10 h-10 rounded-lg border border-transparent flex items-center justify-center text-xl transition-colors relative"
                        >
                            <span className="filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">{subItem}</span>
                            {(subItem === '🌱' || subItem === '🌵') && (
                                <span className="absolute inset-0 flex items-center justify-center text-xl z-10">🔒</span>
                            )}
                        </motion.button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>

        <motion.button
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
            onClick={(e) => {
                e.stopPropagation();
                onToggle();
            }}
            whileTap={{ scale: 0.9, x: 2, y: 2, boxShadow: '0px 0px 0px 0px rgba(0,0,0,1)' }}
            className={`\n                w-14 h-14 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] \n                flex items-center justify-center relative overflow-hidden group z-10 transition-colors\n                ${isActive ? 'bg-yellow-300' : 'bg-purple-500'}\n            `}
        >
            <span className="text-2xl filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)] leading-none transition-transform opacity-100 text-white">
                {item.icon}
            </span>
        </motion.button>
    </div>
);

const CloseButton = ({ onClick }) => (
    <button 
        onClick={onClick}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/5 flex items-center justify-center font-bold text-slate-500 z-10 hover:bg-black/10 active:scale-95 transition-all"
    >
        ✕
    </button>
);

const MemoizedSideMenu = React.memo(SideMenu);
const MemoizedCloseButton = React.memo(CloseButton);

export default App;
