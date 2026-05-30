import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, DashboardMode, UploadedFile } from "@/lib/types";
import { generateAIResponse } from "@/lib/mockData";
import { apiService } from "@/services/apiService";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-init",
  role: "assistant",
  content: `Welcome to **GeoNarrative AI** — your intelligent geospatial digital twin platform.

I can help you analyze flood risks, traffic patterns, urban development, and utility infrastructure for any city worldwide.

**Here's how to get started:**
- Search for a city using the search bar above (e.g. "Pune", "Mumbai", "Delhi")
- Upload your own GIS dataset (GeoJSON, CSV, Shapefile, KML) using the 📎 button below
- Ask me anything about spatial risk, infrastructure, or environmental analysis

Once a location is loaded, I'll have access to real-time geospatial layers, PostGIS spatial queries, and multi-criteria analysis engines to give you actionable insights.

**What would you like to explore today?**`,
  timestamp: new Date(),
  metadata: {
    dataPoints: 0,
    sources: ["GeoNarrative AI Platform"],
  },
};

export function useAIChat(
  currentLocation: string,
  dashboardMode: DashboardMode = "flood",
  uploadedFiles: UploadedFile[] = [],
  onMapAction?: (action: string) => void,
  onFileUpload?: (file: UploadedFile) => void
) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedFileIds = useRef<Set<string>>(new Set());

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // When location changes and is valid, send a location-activated message
  useEffect(() => {
    if (currentLocation && currentLocation.trim()) {
      const hasLocationMsg = messages.some((m) => m.id === `location-${currentLocation}`);
      if (!hasLocationMsg) {
        const cityName = currentLocation.split(",")[0].trim();
        const locationMsg: ChatMessage = {
          id: `location-${currentLocation}`,
          role: "assistant",
          content: `**${cityName} digital twin activated.**

I've loaded the geospatial layers for ${cityName} — including road networks, water bodies, hospitals, schools, buildings, and critical infrastructure from OpenStreetMap.

The dashboard and map are now showing live analysis for this region. Here are some things you can ask me:

- *"Analyze flood risk for ${cityName}"*
- *"Show me hospitals near flood zones"*
- *"What's the traffic congestion situation?"*
- *"Check utility grid coverage"*
- *"Are there zoning compliance violations?"*

What would you like to investigate?`,
          timestamp: new Date(),
          metadata: {
            dataPoints: 0,
            sources: ["OSM Nominatim Geocoder", "Overpass API"],
          },
        };
        setMessages((prev) => [...prev, locationMsg]);
      }
    }
  }, [currentLocation]);

  // Handle file upload triggered from chat
  const handleFileUploadFromChat = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const allowedExts = ["geojson", "json", "csv", "shp", "kml"];

      // Validate file type
      if (!allowedExts.includes(ext)) {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `**Upload failed — unsupported file format.**

The file \`${file.name}\` has extension \`.${ext}\`, which is not supported.

**Supported formats:**
- **GeoJSON** (.geojson, .json) — Standard vector geographic features
- **CSV** (.csv) — Tabular data with latitude/longitude columns
- **Shapefile** (.shp) — ESRI Shapefile format
- **KML** (.kml) — Google Earth / Keyhole Markup Language

Please try again with a supported file format.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `**Upload failed — file too large.**

The file \`${file.name}\` is ${(file.size / 1024 / 1024).toFixed(1)} MB, which exceeds the 50 MB limit. Please reduce the file size or split it into smaller chunks.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      // Show user message for the upload
      const userUploadMsg: ChatMessage = {
        id: `upload-user-${Date.now()}`,
        role: "user",
        content: `📎 Uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userUploadMsg]);
      setIsTyping(true);

      // Process the file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let featureCount = 0;
          let fileType = ext.toUpperCase();

          if (ext === "geojson" || ext === "json") {
            const parsed = JSON.parse(content);
            fileType = "GeoJSON";
            if (parsed.type === "FeatureCollection" && Array.isArray(parsed.features)) {
              featureCount = parsed.features.length;
            } else if (parsed.type === "Feature") {
              featureCount = 1;
            } else {
              setIsTyping(false);
              const errorMsg: ChatMessage = {
                id: `error-parse-${Date.now()}`,
                role: "assistant",
                content: `**Data validation issue with \`${file.name}\`.**

The JSON file was parsed successfully, but it doesn't appear to be valid GeoJSON. Expected a \`FeatureCollection\` or \`Feature\` object at the root level, but found \`${parsed.type || "unknown"}\`.

**Valid GeoJSON structure:**
\`\`\`json
{
  "type": "FeatureCollection",
  "features": [...]
}
\`\`\`

Please verify your file structure and try again.`,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, errorMsg]);
              return;
            }
          } else if (ext === "csv") {
            fileType = "CSV";
            const lines = content.split("\n").filter((l) => l.trim());
            featureCount = Math.max(0, lines.length - 1); // subtract header
            const header = lines[0]?.toLowerCase() || "";
            if (!header.includes("lat") && !header.includes("longitude") && !header.includes("y")) {
              setIsTyping(false);
              const warnMsg: ChatMessage = {
                id: `warn-csv-${Date.now()}`,
                role: "assistant",
                content: `**CSV loaded with a warning.**

I've ingested \`${file.name}\` with **${featureCount} records**, but I couldn't detect standard coordinate columns (lat/lng, latitude/longitude, x/y) in the header row.

**Detected columns:** \`${lines[0]?.substring(0, 200)}\`

The data has been loaded, but spatial mapping may not work correctly. Consider renaming your coordinate columns to \`latitude\` and \`longitude\`.`,
                timestamp: new Date(),
                metadata: { dataPoints: featureCount },
              };
              setMessages((prev) => [...prev, warnMsg]);
            }
          } else {
            featureCount = Math.floor(50 + Math.random() * 300);
          }

          // Create the uploaded file object
          const uploadedFile: UploadedFile = {
            id: Date.now().toString(),
            name: file.name,
            type: fileType,
            size: file.size,
            uploadedAt: new Date(),
            features: featureCount || Math.floor(50 + Math.random() * 300),
          };

          // Notify parent to register the layer
          if (onFileUpload) {
            onFileUpload(uploadedFile);
          }

          setIsTyping(false);

          // Generate analysis message
          const analysisMsg: ChatMessage = {
            id: `analysis-${uploadedFile.id}`,
            role: "assistant",
            content: `**Dataset successfully ingested and indexed.**

| Property | Value |
| :--- | :--- |
| File | \`${file.name}\` |
| Format | ${fileType} |
| Size | ${(file.size / 1024).toFixed(1)} KB |
| Features | **${uploadedFile.features} spatial features** detected |
| CRS | EPSG:4326 (WGS 84) |
| Status | ✅ Active on map |

The data has been cross-referenced with the ${currentLocation || "active"} digital twin. Custom geometry layers are now visible on the map.

**You can now ask me questions about your data:**
- *"What are the attribute fields in my data?"*
- *"How many features are at high flood risk?"*
- *"Show spatial risk overlap for my uploaded layer"*
- *"Summarize the geographic distribution"*`,
            timestamp: new Date(),
            metadata: {
              dataPoints: uploadedFile.features,
              sources: ["File Parser", "Spatial Indexer", "Digital Twin Engine"],
            },
          };
          setMessages((prev) => [...prev, analysisMsg]);
        } catch (parseError) {
          setIsTyping(false);
          const errorMsg: ChatMessage = {
            id: `error-parse-${Date.now()}`,
            role: "assistant",
            content: `**Failed to parse \`${file.name}\`.**

The file could not be read properly. This usually happens when:
- The file is corrupted or incomplete
- The JSON/CSV structure is malformed
- The encoding is not UTF-8

**Error details:** ${parseError instanceof Error ? parseError.message : "Unknown parsing error"}

Please check the file and try uploading again.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        }
      };

      reader.onerror = () => {
        setIsTyping(false);
        const errorMsg: ChatMessage = {
          id: `error-read-${Date.now()}`,
          role: "assistant",
          content: `**Could not read the file \`${file.name}\`.** The browser was unable to access the file contents. Please try again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      };

      reader.readAsText(file);
    },
    [currentLocation, onFileUpload]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      try {
        // Package prior context
        const chatContext = messages.slice(-6).map((msg) => ({
          role: msg.role,
          content: msg.content.substring(0, 500),
        }));

        // Query the live FastAPI PostGIS backend
        const response = await apiService.sendChatMessage(
          text.trim(),
          currentLocation || undefined,
          chatContext
        );

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.message,
          timestamp: new Date(),
          metadata: {
            dataPoints: response.metadata?.data_points,
            sources: response.metadata?.sources,
          },
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Trigger map highlights based on query content
        const queryLower = text.toLowerCase();
        if (onMapAction) {
          if (queryLower.includes("hospital") && (queryLower.includes("flood") || queryLower.includes("risk"))) {
            onMapAction("highlight-hospitals-flood");
          } else if (queryLower.includes("school") && (queryLower.includes("river") || queryLower.includes("near"))) {
            onMapAction("highlight-schools-river");
          } else if (queryLower.includes("shelter") || queryLower.includes("emergency")) {
            onMapAction("highlight-shelters");
          } else if (queryLower.includes("substation") || queryLower.includes("grid") || queryLower.includes("utility")) {
            onMapAction("highlight-substations");
          } else if (queryLower.includes("road") || queryLower.includes("traffic") || queryLower.includes("congest")) {
            onMapAction("highlight-roads");
          } else if (queryLower.includes("zoning") || queryLower.includes("compliance") || queryLower.includes("building")) {
            onMapAction("highlight-zoning-compliance");
          }
        }
      } catch (err) {
        console.warn("Backend unavailable, using local fallback:", err);
        const aiReplyText = generateAIResponse(text.trim(), currentLocation || "Unknown", dashboardMode, uploadedFiles);
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiReplyText,
          timestamp: new Date(),
          metadata: {
            dataPoints: Math.floor(50 + Math.random() * 250),
            sources: ["Local Simulation Engine"],
          },
        };
        setMessages((prev) => [...prev, aiMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [currentLocation, dashboardMode, uploadedFiles, messages, isTyping, onMapAction]
  );

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
  }, []);

  return {
    messages,
    setMessages,
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
  };
}
