"use client";

import React from "react";
import { Plus, MessageSquare, History, User, Settings, LogOut, Map as MapIcon, MessageCircle } from "lucide-react";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  activeView: "chat" | "map";
  onViewChange: (view: "chat" | "map") => void;
  onNewTrip: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, onNewTrip }) => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <button className={styles.newChat} onClick={onNewTrip}>
          <Plus size={18} />
          <span>New Trip</span>
        </button>
      </div>

      <nav className={styles.history}>
        {/* History items will go here when implemented */}
      </nav>

      <div className={styles.footer}>
        <button className={styles.footerItem}>
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <button className={styles.userProfile}>
          <div className={styles.avatar}>P</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Prthmesh</span>
            <span className={styles.userEmail}>Pro Plan</span>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
