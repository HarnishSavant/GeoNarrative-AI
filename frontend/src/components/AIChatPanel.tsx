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
  Terminal,
  Cpu,
  Clock,
  Database,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Building,
  Route,
  Layers,
  FileText
} from "lucide-react";
import { DashboardMode, UploadedFile } from "@/lib/types";
import { useAIChat } from "@/hooks/useAIChat";

function AgentTraceView({ trace }: { trace: any }) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!trace) return null;

  return (
    <div className="mt-2 border border-blue-100 rounded-lg overflow-hidden bg-blue-50/50 transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono text-blue-700 hover:text-blue-800 hover:bg-blue-100/50 transition-all duration-150"
      >
        <span className="flex items-center gap-1.5 font-semibold">
          <Terminal size={12} className="text-blue-600 animate-pulse" />
          AGENT EXECUTION TRACE
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">({trace.processing_time}s)</span>
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-2 border-t border-blue-100 font-mono text-[10px] space-y-2 text-gray-600">
          <div className="grid grid-cols-2 gap-2 border-b border-gray-200 pb-2">
            <div>
              <span className="text-gray-500 block text-[9px] uppercase font-semibold">Detected Intent</span>
              <span className="text-gray-800 font-medium break-all">{trace.detected_intent}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[9px] uppercase font-semibold">Processing Latency</span>
              <span className="text-gray-800 font-medium flex items-center gap-1">
                <Clock size={10} className="text-amber-500" />
                {trace.processing_time} seconds
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 block text-[9px] uppercase font-semibold">Selected Tool</span>
              <span className="text-gray-800 font-medium flex items-center gap-1">
                <Cpu size={10} className="text-purple-600" />
                {trace.selected_tool}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500 block text-[9px] uppercase font-semibold">Spatial SQL / Operation</span>
              <span className="text-gray-800 font-medium flex items-center gap-1">
                <Database size={10} className="text-blue-500" />
                <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-blue-700 text-[9px]">
                  {trace.spatial_operation}
                </code>
              </span>
            </div>
          </div>

          <div>
            <span className="text-gray-500 block text-[9px] uppercase font-semibold mb-1">Execution Parameters</span>
            <pre className="bg-white border border-gray-200 p-2 rounded text-[9px] text-gray-600 overflow-x-auto max-w-full font-mono">
              {JSON.stringify(trace.parameters, null, 2)}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-gray-200 pt-2">
            <div>
              <span className="text-gray-500 block text-[9px] uppercase font-semibold">Records Found</span>
              <span className="text-gray-800 font-semibold text-emerald-600">{trace.records_found}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[9px] uppercase font-semibold">Map Action</span>
              <span className="text-gray-800 font-medium">{trace.map_action}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AIChatPanelProps {
  currentLocation: string;
  dashboardMode?: DashboardMode;
  onMapAction?: (action: string) => void;
  uploadedFiles?: UploadedFile[];
  onFileUpload?: (file: UploadedFile) => void;
}

export default function AIChatPanel({
  currentLocation,
  dashboardMode = "hydrology",
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

  const [thinkingStep, setThinkingStep] = React.useState(0);
  const thinkingPhrases = [
    "Classifying query intent...",
    "Selecting response mode...",
    "Building conversation context...",
    "Generating intelligent response...",
    "Formatting output..."
  ];

  React.useEffect(() => {
    let interval: any;
    if (isTyping) {
      setThinkingStep(0);
      interval = setInterval(() => {
        setThinkingStep((prev) => (prev < thinkingPhrases.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isTyping]);

  const handleSend = () => {
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  React.useEffect(() => {
    const handleAISend = (e: any) => {
      if (e.detail) {
        sendMessage(e.detail);
      }
    };
    window.addEventListener('ai-chat-send', handleAISend);
    return () => window.removeEventListener('ai-chat-send', handleAISend);
  }, [sendMessage]);

  const quickPrompts = [
    { icon: <MapPin size={12} />, text: "Why is this area flood susceptible?" },
    { icon: <Layers size={12} />, text: "Compare Heavy and Extreme scenarios" },
    { icon: <Globe2 size={12} />, text: "Explain the current flood simulation" },
    { icon: <Route size={12} />, text: "How does terrain influence flooding?" },
    { icon: <Building size={12} />, text: "Which infrastructure is most exposed?" },
    { icon: <Lightbulb size={12} />, text: "What does the flood susceptibility map show?" },
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
            className={`grid gap-1 text-xs py-1 px-2 rounded border-b border-gray-100 ${
              isHeader
                ? "bg-gray-50 font-semibold text-gray-900 border-t"
                : "text-gray-700 hover:bg-gray-50"
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
          <p key={i} className="text-[13px] text-gray-700 ml-2 my-1 leading-relaxed">
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
            <p key={i} className="text-[13px] text-gray-700 ml-3 my-1 leading-relaxed">
              •{" "}
              {parts.map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j} className="text-gray-900 font-semibold">
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
          <p key={i} className="text-[13px] text-gray-700 ml-3 my-1 leading-relaxed">
            • {bulletContent}
          </p>
        );
      }
      if (line.startsWith("```")) return null;
      if (line.includes("**")) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-[13px] text-gray-700 my-1 leading-relaxed">
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="text-gray-900 font-semibold">
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
          <p key={i} className="text-[13px] text-gray-600 my-1 italic leading-relaxed">
            {parts.map((part, j) =>
              j % 2 === 1 ? <em key={j}>{part}</em> : part
            )}
          </p>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-1.5" />;
      return (
        <p key={i} className="text-[13px] text-gray-700 my-1 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 border-l border-gray-200 w-[400px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-3 bg-[#0f172a]">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-sm">
          <BrainCircuit size={16} className="text-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-wide">GeoNarrative AI</h3>
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-extrabold tracking-widest uppercase animate-pulse">
              LIVE TWIN
            </span>
          </div>
          <p className="text-[10px] text-emerald-400/90 font-medium mt-0.5 tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            Connected to Pune Digital Twin
          </p>
        </div>
        <button
          onClick={clearHistory}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
          title="Clear chat"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-white">
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
                <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center mr-2.5 mt-1 flex-shrink-0 shadow-sm border border-blue-200">
                  <Sparkles size={12} className="text-blue-600" />
                </div>
              )}
              <div className={msg.role === "user" ? "max-w-[85%]" : "max-w-[88%]"}>
                <div
                  className={`p-3.5 rounded-2xl shadow-sm border ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white border-blue-700 rounded-tr-sm"
                      : "bg-gray-50 border-gray-200 text-gray-800 rounded-tl-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-[13px] leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="text-[13px] leading-relaxed space-y-2">{renderContent(msg.content)}</div>
                  )}
                </div>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mt-1.5 ml-1">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded hover:bg-gray-100"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center ml-2.5 mt-1 flex-shrink-0 shadow-sm border border-gray-700">
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
            className="flex items-start gap-2.5"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 animate-pulse mt-0.5">
              <Sparkles size={11} className="text-blue-600" />
            </div>
            <div className="bg-white border border-blue-200 rounded-2xl rounded-tl-sm p-4 max-w-[85%] space-y-2 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="chat-typing-dots flex items-center gap-1 opacity-70">
                  <span className="bg-blue-600 w-1.5 h-1.5 rounded-full" />
                  <span className="bg-blue-600 w-1.5 h-1.5 rounded-full" />
                  <span className="bg-blue-600 w-1.5 h-1.5 rounded-full" />
                </div>
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest animate-pulse">Running Spatial Engine</span>
              </div>
              <div className="text-[11px] text-gray-600 font-medium font-mono flex items-center gap-2">
                <Loader2 size={11} className="animate-spin text-blue-500" />
                {thinkingPhrases[thinkingStep]}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="px-3 py-3 bg-[#1e293b]/50 border-t border-white/5 flex gap-1.5 flex-wrap overflow-y-auto max-h-[140px] custom-scrollbar">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => sendMessage(prompt.text)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0f172a] text-[10px] font-bold text-slate-300 border border-white/5 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all duration-200 tracking-wider uppercase text-left"
          >
            {prompt.icon}
            {prompt.text}
          </button>
        ))}
      </div>

      {/* Input with file upload */}
      <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
        <div className="relative flex items-end gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
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
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 text-gray-500 hover:text-blue-600 flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-sm"
            title="Upload GIS data (GeoJSON, CSV, Shapefile, KML)"
          >
            <Paperclip size={16} />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentLocation ? `Ask about ${currentLocation.split(",")[0]}...` : "Type a spatial query..."}
            className="flex-1 resize-none bg-transparent border-none px-3 py-2.5 text-[13px] text-gray-900 placeholder-gray-400 outline-none max-h-32"
            rows={1}
            id="ai-chat-input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white flex items-center justify-center transition-all duration-200 flex-shrink-0 shadow-sm disabled:shadow-none"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <Database size={10} className="text-emerald-500" />
          <p className="text-[10px] text-gray-400 font-medium tracking-wide">
            GeoNarrative AI • PostGIS Spatial Engine
          </p>
        </div>
      </div>
    </div>
  );
}
