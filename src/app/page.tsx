"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Chat from "@/components/Chat";
import MapContainer from "@/components/MapContainer";
import LandingPage from "@/components/LandingPage";
import styles from "./page.module.css";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [showPlanner, setShowPlanner] = useState(false);
  const [mapData, setMapData] = useState<any>(null);
  const [tripKey, setTripKey] = useState(0);
  
  // Resizable panels state
  const [chatWidth, setChatWidth] = useState(40); // Initial 40% width for chat
  const [isResizing, setIsResizing] = useState(false);

  const handleMapUpdate = (data: any) => {
    setMapData(data);
  };

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = (e.clientX / window.innerWidth) * 100;
        // Constrain width between 25% and 75%
        if (newWidth > 25 && newWidth < 75) {
          setChatWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  if (!showPlanner) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
          transition={{ duration: 0.8 }}
          style={{ width: "100%", height: "100%" }}
        >
          <LandingPage onStartTrip={() => setShowPlanner(true)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <main className={styles.main}>
      <AnimatePresence mode="wait">
        <motion.div 
          key="planner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className={styles.plannerWrapper}
        >
          <div className={styles.contentWrapper}>
            {/* Chat Panel */}
            <div className={styles.chatContainer} style={{ width: `${chatWidth}%` }}>
              <Chat key={tripKey} onMapTrigger={handleMapUpdate} onBackToHome={() => setShowPlanner(false)} />
            </div>
            
            {/* Draggable Resizer */}
            <div 
              className={`${styles.resizer} ${isResizing ? styles.resizerActive : ""}`} 
              onMouseDown={startResizing}
            >
              <div className={styles.resizerHandle}></div>
            </div>
            
            {/* Map Panel (Always visible) */}
            <div className={styles.mapSidebar} style={{ width: `calc(${100 - chatWidth}% - 8px)` }}>
              <MapContainer initialData={mapData} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
