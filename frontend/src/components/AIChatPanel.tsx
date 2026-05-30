"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  MapPin,
  BarChart3,
  Lightbulb,
  Zap,
  Paperclip,
  User,
  Globe2,
} from "lucide-react";
import { DashboardMode, UploadedFile } from "@/lib/types";
import { useAIChat } from "@/hooks/useAIChat";

interface AIChatPanelProps {
  currentLocation: string;
  dashboardMode?: DashboardMode;
  onMapAction?: (action: string) => void;
  uploadedFiles?: UploadedFile[];
  onFileUpload?: (file: UploadedFile) => void;
}

export default function AIChatPanel({
  currentLocation,
  dashboardMode = "flood",
  onMapAction,
  uploadedFiles = [],
  onFileUpload,
}: AIChatPanelProps) {
  const {
    messages,
    input,
    setInput,
    isTyping,
    sendMessage,
    handleCopy,
    copiedId,
    clearHistory,
    chatEndRef,
    inputRef,
    fileInputRef,
    handleFileUploadFromChat,
  } = useAIChat(currentLocation, dashboardMode, uploadedFiles, onMapAction, onFileUpload);

  const handleSend = () => {
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = currentLocation
    ? [
        { icon: <MapPin size={12} />, text: `Analyze flood risk for ${currentLocation.split(",")[0]}` },
        { icon: <BarChart3 size={12} />, text: "Show hospitals near flood zones" },
        { icon: <Lightbulb size={12} />, text: "Check infrastructure vulnerability" },
        { icon: <Zap size={12} />, text: "Audit utility grid coverage" },
      ]
    : [
        { icon: <Globe2 size={12} />, text: "What can you analyze?" },
        { icon: <MapPin size={12} />, text: "How do I get started?" },
        { icon: <Lightbulb size={12} />, text: "What data formats do you support?" },
      ];

  // Markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <h3 key={i} className="text-sm font-bold text-gray-100 mt-3 mb-1">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h4 key={i} className="text-xs font-semibold text-gray-200 mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      // Table detection
      if (line.startsWith("|")) {
        const cells = line
          .split("|")
          .filter((c) => c.trim())
          .map((c) => c.trim());
        if (cells.every((c) => c.match(/^[-:]+$/))) return null;
        const isHeader = i > 0 && lines[i + 1]?.includes("---");
        return (
          <div
            key={i}
            className={`grid gap-1 text-xs py-1 px-2 rounded ${
              isHeader
                ? "bg-primary-500/10 font-semibold text-gray-200"
                : "text-gray-400 hover:bg-white/5"
            }`}
            style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}
          >
            {cells.map((cell, j) => (
              <span key={j} className="truncate">
                {cell}
              </span>
            ))}
          </div>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <p key={i} className="text-xs text-gray-300 ml-2 my-0.5">
            {line}
          </p>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const bulletContent = line.replace(/^[-*]\s/, "");
        // Handle bold within bullet
        if (bulletContent.includes("**")) {
          const parts = bulletContent.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className="text-xs text-gray-300 ml-3 my-0.5">
              •{" "}
              {parts.map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j} className="text-gray-100 font-semibold">
                    {part}
                  </strong>
                ) : (
                  part
                )
              )}
            </p>
          );
        }
        return (
          <p key={i} className="text-xs text-gray-300 ml-3 my-0.5">
            • {bulletContent}
          </p>
        );
      }
      if (line.startsWith("```")) return null;
      if (line.includes("**")) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-xs text-gray-300 my-0.5">
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="text-gray-100 font-semibold">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      }
      if (line.includes("*") && !line.includes("**")) {
        const parts = line.split(/\*(.*?)\*/g);
        return (
          <p key={i} className="text-xs text-gray-400 my-0.5 italic">
            {parts.map((part, j) =>
              j % 2 === 1 ? <em key={j}>{part}</em> : part
            )}
          </p>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-1" />;
      return (
        <p key={i} className="text-xs text-gray-300 my-0.5">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-geo-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center pulse-dot">
          <Globe2 size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-200">GeoNarrative AI</h3>
          <p className="text-[10px] text-gray-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            {currentLocation ? `Analyzing ${currentLocation.split(",")[0]}` : "Ready — search a location to begin"}
          </p>
        </div>
        <button
          onClick={clearHistory}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
          title="Clear chat"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500/30 to-cyan-500/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Sparkles size={12} className="text-primary-400" />
                </div>
              )}
              <div className={msg.role === "user" ? "max-w-[80%]" : "max-w-[90%]"}>
                <div
                  className={
                    msg.role === "user"
                      ? "chat-bubble-user"
                      : "chat-bubble-ai"
                  }
                >
                  {msg.role === "user" ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <div>{renderContent(msg.content)}</div>
                  )}
                </div>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mt-1.5 ml-1">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                    {msg.metadata?.dataPoints != null && msg.metadata.dataPoints > 0 && (
                      <span className="text-[10px] text-gray-600">
                        {msg.metadata.dataPoints} data points analyzed
                      </span>
                    )}
                    {msg.metadata?.sources && msg.metadata.sources.length > 0 && (
                      <span className="text-[10px] text-gray-700">
                        via {msg.metadata.sources[0]}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-lg bg-primary-600 flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                  <User size={12} className="text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500/30 to-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <Sparkles size={12} className="text-primary-400" />
            </div>
            <div className="chat-bubble-ai flex items-center gap-2">
              <Loader2 size={14} className="text-primary-400 animate-spin" />
              <span className="text-xs text-gray-400">Processing geospatial analysis...</span>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 flex gap-2 flex-wrap">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => sendMessage(prompt.text)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-gray-400 border border-geo-border hover:border-primary-500/30 hover:text-primary-300 hover:bg-primary-500/5 transition-all duration-200"
          >
            {prompt.icon}
            {prompt.text}
          </button>
        ))}
      </div>

      {/* Input with file upload */}
      <div className="p-4 border-t border-geo-border">
        <div className="relative flex items-end gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".geojson,.json,.csv,.shp,.kml"
            onChange={(e) => handleFileUploadFromChat(e.target.files)}
            className="hidden"
            id="chat-file-upload"
          />
          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isTyping}
            className="w-10 h-10 rounded-xl bg-geo-card/60 border border-geo-border hover:border-primary-500/30 hover:bg-primary-500/5 disabled:opacity-50 text-gray-400 hover:text-primary-400 flex items-center justify-center transition-all duration-200 flex-shrink-0"
            title="Upload GIS data (GeoJSON, CSV, Shapefile, KML)"
          >
            <Paperclip size={16} />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentLocation ? `Ask about ${currentLocation.split(",")[0]}...` : "Search a location above to begin analysis..."}
            className="flex-1 resize-none bg-geo-card/60 border border-geo-border rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 max-h-28"
            rows={1}
            id="ai-chat-input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 disabled:text-gray-500 text-white flex items-center justify-center transition-all duration-200 flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-2 text-center">
          GeoNarrative AI • PostGIS Spatial Engine • Multi-Criteria Analysis
        </p>
      </div>
    </div>
  );
}
