import { motion, AnimatePresence } from "framer-motion";
import { loadingTips } from "@/lib/loading-messages";
import React, { useEffect, useState } from "react";

interface InitialLoadingScreenProps {
  stage: string;
  progress: number;
  message: string;
}

export function InitialLoadingScreen({ 
  stage, 
  progress, 
  message 
}: InitialLoadingScreenProps) {
  const [currentTip, setCurrentTip] = useState(loadingTips[0]);

  // Rotate tips every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(loadingTips[Math.floor(Math.random() * loadingTips.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[9999] overflow-hidden">
      {/* Background Gradient Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 animate-pulse" />
      
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center space-y-10">
        {/* Logo Animation */}
        <motion.div 
          className="relative w-24 h-24"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <motion.div 
            className="w-full h-full bg-gradient-to-tr from-primary to-secondary rounded-2xl shadow-2xl flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-4xl font-bold text-white">O</span>
          </motion.div>
        </motion.div>

        {/* Progress Section */}
        <div className="w-full space-y-4">
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <motion.span
              key={stage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-primary"
            >
              {message}
            </motion.span>
            <span>{Math.round(progress)}%</span>
          </div>
          
          <div className="h-2 bg-muted rounded-full overflow-hidden shadow-inner">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 15 }}
            />
          </div>
        </div>

        {/* Tips Section */}
        <div className="h-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentTip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-muted-foreground/70 italic"
            >
              {currentTip}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}