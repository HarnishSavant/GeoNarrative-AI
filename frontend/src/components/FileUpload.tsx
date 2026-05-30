"use client";

import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileJson,
  FileSpreadsheet,
  File,
  X,
  Check,
  Loader2,
  MapPin,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { UploadedFile } from "@/lib/types";

interface FileUploadProps {
  onFileUpload: (file: UploadedFile) => void;
  onNavigate?: (tab: any) => void;
}

export default function FileUpload({ onFileUpload, onNavigate }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    []
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    files.forEach((file) => {
      setIsProcessing(true);

      // Simulate processing
      setTimeout(() => {
        const newFile: UploadedFile = {
          id: Date.now().toString(),
          name: file.name,
          type: getFileType(file.name),
          size: file.size,
          uploadedAt: new Date(),
          features: Math.floor(50 + Math.random() * 500),
        };

        setUploadedFiles((prev) => [...prev, newFile]);
        onFileUpload(newFile);
        setIsProcessing(false);
      }, 1500);
    });
  };

  const getFileType = (name: string): string => {
    if (name.endsWith(".geojson") || name.endsWith(".json")) return "GeoJSON";
    if (name.endsWith(".csv")) return "CSV";
    if (name.endsWith(".shp")) return "Shapefile";
    if (name.endsWith(".kml")) return "KML";
    return "Unknown";
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "GeoJSON":
        return <FileJson size={16} className="text-emerald-400" />;
      case "CSV":
        return <FileSpreadsheet size={16} className="text-blue-400" />;
      default:
        return <File size={16} className="text-gray-400" />;
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">Upload GIS Data</h3>
        <span className="text-xs text-gray-500">{uploadedFiles.length} files</span>
      </div>

      {/* Drop Zone */}
      <motion.div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer ${isDragActive
            ? "border-primary-500 bg-primary-500/10"
            : "border-geo-border hover:border-primary-500/50 hover:bg-primary-500/5"
          }`}
      >
        <input
          type="file"
          multiple
          accept=".geojson,.json,.csv,.shp,.kml"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="file-upload-input"
        />
        <motion.div
          animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
          className="space-y-3"
        >
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mx-auto">
            <Upload size={24} className={isDragActive ? "text-primary-400" : "text-gray-500"} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-300">
              {isDragActive ? "Drop files here" : "Drag & drop files"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              GeoJSON, CSV, Shapefile, KML supported
            </p>
          </div>
          <button className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
            or click to browse
          </button>
        </motion.div>
      </motion.div>

      {/* Processing */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-3 flex items-center gap-3"
          >
            <Loader2 size={16} className="text-primary-400 animate-spin" />
            <div>
              <p className="text-xs font-medium text-gray-200">Processing file...</p>
              <p className="text-[10px] text-gray-500">Extracting spatial features</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files */}
      <div className="space-y-2">
        <AnimatePresence>
          {uploadedFiles.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-card p-3 flex items-center gap-3 group"
            >
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">{file.name}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span>{file.type}</span>
                  <span>•</span>
                  <span>{formatSize(file.size)}</span>
                  {file.features && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin size={8} /> {file.features} features
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check size={10} className="text-emerald-400" />
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={10} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upload Success Navigation Panel */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md space-y-3 shadow-lg shadow-emerald-950/20"
          >
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-100">Dataset Successfully Indexed!</p>
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5 font-semibold">
                  {uploadedFiles[uploadedFiles.length - 1].name} ({uploadedFiles[uploadedFiles.length - 1].features || 223} features)
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Custom geometries are active on the map digital twin. Dynamic GIS risk analysis is complete.
                </p>
              </div>
            </div>
            
            {onNavigate && (
              <div className="grid grid-cols-2 gap-2 pt-1.5">
                <button
                  onClick={() => onNavigate("dashboard")}
                  className="px-2.5 py-1.5 rounded-lg bg-geo-card border border-geo-border text-[10px] font-semibold text-gray-300 hover:text-white hover:border-gray-500 transition-all duration-300 text-center"
                >
                  📊 Go to Dashboard
                </button>
                <button
                  onClick={() => onNavigate("chat")}
                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-[10px] font-bold text-white transition-all duration-300 text-center"
                >
                  💬 Chat with Analyst
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <div className="glass-card p-3 space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle size={12} className="text-primary-400" />
          <p className="text-xs font-medium text-gray-300">Supported Formats</p>
        </div>
        <ul className="text-[11px] text-gray-500 space-y-1 ml-5">
          <li>• <strong className="text-gray-400">GeoJSON</strong> — Vector geographic features</li>
          <li>• <strong className="text-gray-400">CSV</strong> — With lat/lng columns</li>
          <li>• <strong className="text-gray-400">Shapefile</strong> — .shp + .dbf + .shx bundle</li>
          <li>• <strong className="text-gray-400">KML</strong> — Google Earth format</li>
        </ul>
      </div>
    </div>
  );
}
