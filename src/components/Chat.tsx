"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Compass, MapPin, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Chat.module.css";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  onMapTrigger: (data: any) => void;
  onBackToHome?: () => void;
}

const SUGGESTION_CHIPS = [
  "🏛️ South Mumbai heritage walk",
  "🏖️ Best beaches in Mumbai",
  "🍔 Street food tour in Mumbai",
  "🌅 Weekend getaway from Mumbai",
  "🛕 Temple trail in Mumbai",
  "🎭 Nightlife & entertainment",
];

const Chat: React.FC<ChatProps> = ({ onMapTrigger, onBackToHome }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "assistant", content: "Hey there! 👋 I'm your **Mumbai & Maharashtra Travel Expert**. Tell me where you want to go, what you're in the mood for, or just pick a suggestion below!\n\nI'll create a detailed itinerary with routes, timings, costs, and show everything on the map." },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mapToast, setMapToast] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, lineIdx) => {
      // ### Headers
      if (line.startsWith("### ")) {
        return <h3 key={lineIdx} className={styles.msgHeader}>{renderInline(line.slice(4))}</h3>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={lineIdx} className={styles.msgHeader}>{renderInline(line.slice(3))}</h3>;
      }
      // Numbered lists
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={lineIdx} className={styles.numberedItem}>
            <span className={styles.itemNumber}>{numMatch[1]}</span>
            <span>{renderInline(numMatch[2])}</span>
          </div>
        );
      }
      // Bullet points
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return <li key={lineIdx} className={styles.listItem}>{renderInline(line.slice(2))}</li>;
      }
      // Empty lines
      if (line.trim() === "") {
        return <br key={lineIdx} />;
      }
      // Normal text
      return <p key={lineIdx} className={styles.paragraph}>{renderInline(line)}</p>;
    });
  };

  const renderInline = (text: string) => {
    // Handle **bold** text
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const extractMapData = (content: string) => {
    // Look for <map_data> anywhere, even if wrapped in ```json
    const regex = /<map_data>([\s\S]*?)<\/map_data>/;
    const match = content.match(regex);
    if (match && match[1]) {
      try {
        let cleaned = match[1].trim();
        // Sometimes AI puts ```json inside the tags
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "").trim();
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/```/g, "").trim();
        }
        return JSON.parse(cleaned);
      } catch (e) {
        console.error("Failed to parse map data:", e);
      }
    }
    return null;
  };

  const cleanContent = (content: string) => {
    // Remove the tags and anything enclosing them like ```xml or ```json
    let cleaned = content.replace(/```[a-z]*\s*<map_data>[\s\S]*?<\/map_data>\s*```/g, "");
    cleaned = cleaned.replace(/<map_data>[\s\S]*?<\/map_data>/g, "");
    return cleaned.trim();
  };

  const handleSubmit = async (e: React.FormEvent | null, overrideInput?: string) => {
    if (e) e.preventDefault();
    const msgText = overrideInput || input;
    if (!msgText.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now(), role: "user", content: msgText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      if (response.ok && data.content) {
        const mapData = extractMapData(data.content);
        const textContent = cleanContent(data.content);

        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: textContent,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (mapData) {
          onMapTrigger(mapData);
          setMapToast(true);
          setTimeout(() => setMapToast(false), 3000);
        }
      } else {
        const errorMsg = data.error || "Failed to get AI response";
        const isAuthError = errorMsg.includes("API Key");
        
        setMessages((prev) => [...prev, { 
          id: Date.now() + 1, 
          role: "assistant", 
          content: isAuthError 
            ? `**Configuration Required**: ${errorMsg}. Please set your \`GEMINI_API_KEY\` in \`.env.local\`.`
            : `**API Error**: ${errorMsg}. Let me try a local search for you!` 
        }]);
        
        if (!isAuthError) attemptFallbackGeocoding(msgText);
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, { 
        id: Date.now() + 1, 
        role: "assistant", 
        content: `**Connection Error**: ${error.message || "Failed to connect to API"}.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const attemptFallbackGeocoding = async (query: string) => {
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + " Mumbai Maharashtra")}`);
      const results = await resp.json();
      if (results && results[0]) {
        const { lat, lon, display_name } = results[0];
        onMapTrigger({
          center: [parseFloat(lat), parseFloat(lon)],
          zoom: 14,
          destination_name: display_name.split(",")[0],
          stops: []
        });
        setMapToast(true);
        setTimeout(() => setMapToast(false), 3000);
      }
    } catch (e) {
      console.error("Fallback geocoding failed:", e);
    }
  };

  const handleChipClick = (chip: string) => {
    // Remove emoji prefix
    const cleanChip = chip.replace(/^[^\s]+\s/, "");
    setInput(cleanChip);
    handleSubmit(null, cleanChip);
  };

  return (
    <div className={styles.chatContainer}>
      <header className={styles.header}>
        {onBackToHome && (
          <button className={styles.backButton} onClick={onBackToHome}>
            <ArrowLeft size={16} />
            <span>Home</span>
          </button>
        )}
        <div className={styles.modelInfo}>
          <span className={styles.modelName}>Travel Expert AI</span>
          <span className={styles.modelBadge}>Gemini 2.5</span>
        </div>
      </header>

      <div className={styles.messageList}>
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`${styles.messageWrapper} ${m.role === "user" ? styles.userRow : styles.botRow}`}
            >
              <div className={styles.messageContent}>
                <div className={styles.avatar}>
                  {m.role === "user" ? <User size={16} /> : <Compass size={16} />}
                </div>
                <div className={styles.bubble}>
                  {renderContent(m.content)}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.botRow}>
              <div className={styles.typingIndicator}>
                <span className={styles.typingDot}></span>
                <span className={styles.typingDot}></span>
                <span className={styles.typingDot}></span>
                <span className={styles.typingText}>Planning your perfect trip...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips - show only when few messages */}
      {messages.length <= 2 && !isLoading && (
        <div className={styles.chipsContainer}>
          {SUGGESTION_CHIPS.map((chip, i) => (
            <button key={i} className={styles.chip} onClick={() => handleChipClick(chip)}>
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Map toast */}
      <AnimatePresence>
        {mapToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={styles.mapToast}
          >
            <MapPin size={14} />
            <span>Map updated with your itinerary!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.inputArea}>
        <form onSubmit={handleSubmit} className={styles.inputWrapper}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me where you want to go..."
            className={styles.textarea}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            disabled={isLoading}
          />
          <button type="submit" className={styles.sendButton} disabled={!input.trim() || isLoading}>
            <Send size={18} />
          </button>
        </form>
        <p className={styles.disclaimer}>
          AI can suggest amazing places but always double-check bookings & timings.
        </p>
      </div>
    </div>
  );
};

export default Chat;
