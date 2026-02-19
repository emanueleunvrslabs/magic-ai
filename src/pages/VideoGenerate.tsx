import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Video, Upload, X, Film, ImageIcon, Layers, Play, ArrowRight, Download, Share2, Expand, Trash2, Scissors } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useGeneration } from "@/contexts/GenerationContext";

const VIDEO_MODES_BY_MODEL: Record<string, Array<{ value: string; label: string; icon: JSX.Element }>> = {
  "veo-3.1-fast": [
    { value: "text-to-video", label: "Text to Video", icon: <Film className="w-4 h-4" /> },
    { value: "image-to-video", label: "Image to Video", icon: <ImageIcon className="w-4 h-4" /> },
    { value: "first-last-frame", label: "First/Last Frame", icon: <Layers className="w-4 h-4" /> },
    { value: "extend-video", label: "Extend Video", icon: <ArrowRight className="w-4 h-4" /> },
    { value: "reference-to-video", label: "Reference to Video", icon: <Play className="w-4 h-4" /> },
  ],
  "kling-2.5": [
    { value: "text-to-video", label: "Text to Video", icon: <Film className="w-4 h-4" /> },
    { value: "image-to-video", label: "Image to Video", icon: <ImageIcon className="w-4 h-4" /> },
    { value: "video-edit", label: "Video Edit", icon: <Scissors className="w-4 h-4" /> },
  ],
};

const VIDEO_MODELS = [
  { value: "veo-3.1-fast", label: "Veo 3.1 Fast" },
  { value: "kling-2.5", label: "Kling 2.5" },
];

interface ModeConfig {
  aspectRatios: string[];
  durations: string[];
  resolutions: string[];
  defaultAspect: string;
  defaultDuration: string;
  defaultResolution: string;
  showResolution?: boolean;
  showAudio?: boolean;
  showAutoFix?: boolean;
  showCfgScale?: boolean;
  showNegativePrompt?: boolean;
}

// Per-model, per-mode config
const MODE_CONFIG: Record<string, Record<string, ModeConfig>> = {
  "veo-3.1-fast": {
    "text-to-video": {
      aspectRatios: ["16:9", "9:16"],
      durations: ["4s", "6s", "8s"],
      resolutions: ["720p", "1080p", "4k"],
      defaultAspect: "16:9", defaultDuration: "8s", defaultResolution: "720p",
      showResolution: true, showAudio: true, showAutoFix: true,
    },
    "image-to-video": {
      aspectRatios: ["auto", "16:9", "9:16"],
      durations: ["4s", "6s", "8s"],
      resolutions: ["720p", "1080p", "4k"],
      defaultAspect: "auto", defaultDuration: "8s", defaultResolution: "720p",
      showResolution: true, showAudio: true, showAutoFix: true,
    },
    "first-last-frame": {
      aspectRatios: ["auto", "16:9", "9:16"],
      durations: ["4s", "6s", "8s"],
      resolutions: ["720p", "1080p", "4k"],
      defaultAspect: "auto", defaultDuration: "8s", defaultResolution: "720p",
      showResolution: true, showAudio: true, showAutoFix: true,
    },
    "extend-video": {
      aspectRatios: ["auto", "16:9", "9:16"],
      durations: ["7s"],
      resolutions: ["720p"],
      defaultAspect: "auto", defaultDuration: "7s", defaultResolution: "720p",
      showResolution: false, showAudio: true, showAutoFix: true,
    },
    "reference-to-video": {
      aspectRatios: ["16:9", "9:16"],
      durations: ["8s"],
      resolutions: ["720p", "1080p", "4k"],
      defaultAspect: "16:9", defaultDuration: "8s", defaultResolution: "720p",
      showResolution: true, showAudio: true, showAutoFix: true,
    },
  },
  "kling-2.5": {
    "text-to-video": {
      aspectRatios: ["16:9", "9:16", "1:1"],
      durations: ["5s", "10s"],
      resolutions: [],
      defaultAspect: "16:9", defaultDuration: "5s", defaultResolution: "",
      showCfgScale: true, showNegativePrompt: true,
    },
    "image-to-video": {
      aspectRatios: ["16:9", "9:16", "1:1"],
      durations: ["5s", "10s"],
      resolutions: [],
      defaultAspect: "16:9", defaultDuration: "5s", defaultResolution: "",
      showCfgScale: true, showNegativePrompt: true,
    },
    "video-edit": {
      aspectRatios: [],
      durations: [],
      resolutions: [],
      defaultAspect: "", defaultDuration: "", defaultResolution: "",
    },
  },
};

const VideoGenerate = () => {
  const location = useLocation();
  const { videoResults, videoJobs, generateVideo, deleteMedia } = useGeneration();
  const [activeMode, setActiveMode] = useState("text-to-video");
  const [model, setModel] = useState("veo-3.1-fast");
  const [prompt, setPrompt] = useState("");
  const [cfgScale, setCfgScale] = useState(0.5);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [keepAudio, setKeepAudio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("8s");
  const [resolution, setResolution] = useState("720p");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [autoFix, setAutoFix] = useState(true);

  // File upload states
  const [imageUrl, setImageUrl] = useState<{ url: string; preview: string } | null>(null);
  const [firstFrameUrl, setFirstFrameUrl] = useState<{ url: string; preview: string } | null>(null);
  const [lastFrameUrl, setLastFrameUrl] = useState<{ url: string; preview: string } | null>(null);
  const [videoUrl, setVideoUrl] = useState<{ url: string; preview: string } | null>(null);
  const [referenceImages, setReferenceImages] = useState<Array<{ url: string; preview: string }>>([]);

  const [error, setError] = useState("");
  const loading = videoJobs.some((j) => j.status === "pending");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInputTarget, setFileInputTarget] = useState<string>("");

  // Handle incoming image from ImageGenerate page
  useEffect(() => {
    const state = location.state as { imageUrl?: string } | null;
    if (state?.imageUrl) {
      const item = { url: state.imageUrl, preview: state.imageUrl };
      setActiveMode("image-to-video");
      setImageUrl(item);
      // Also pre-fill first frame and reference images
      setFirstFrameUrl(item);
      setReferenceImages([item]);
      const c = MODE_CONFIG[model]?.["image-to-video"];
      if (c) {
        setAspectRatio(c.defaultAspect);
        setDuration(c.defaultDuration);
        setResolution(c.defaultResolution);
      }
      // Clear state so it doesn't re-trigger on re-render
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const config = MODE_CONFIG[model]?.[activeMode];
  const availableModes = VIDEO_MODES_BY_MODEL[model] || [];

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    const modes = VIDEO_MODES_BY_MODEL[newModel] || [];
    const firstMode = modes[0]?.value || "text-to-video";
    setActiveMode(firstMode);
    const c = MODE_CONFIG[newModel]?.[firstMode];
    if (c) {
      setAspectRatio(c.defaultAspect);
      setDuration(c.defaultDuration);
      setResolution(c.defaultResolution);
    }
  };

  const handleModeChange = (mode: string) => {
    setActiveMode(mode);
    const c = MODE_CONFIG[model]?.[mode];
    if (c) {
      setAspectRatio(c.defaultAspect);
      setDuration(c.defaultDuration);
      setResolution(c.defaultResolution);
    }
  };

  const handleFileSelect = (target: string) => {
    setFileInputTarget(target);
    if (fileInputRef.current) {
      fileInputRef.current.accept = target === "extend-video" ? "video/*" : "image/*";
      fileInputRef.current.multiple = target === "reference-images";
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const item = { url: dataUrl, preview: dataUrl };

        switch (fileInputTarget) {
          case "image-to-video":
            setImageUrl(item);
            break;
          case "first-frame":
            setFirstFrameUrl(item);
            break;
          case "last-frame":
            setLastFrameUrl(item);
            break;
          case "extend-video":
            setVideoUrl(item);
            break;
          case "reference-images":
            setReferenceImages((prev) => [...prev, item]);
            break;
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const canGenerate = () => {
    if (!prompt.trim()) return false;
    switch (activeMode) {
      case "image-to-video":
        return !!imageUrl;
      case "first-last-frame":
        return !!firstFrameUrl && !!lastFrameUrl;
      case "extend-video":
        return !!videoUrl;
      case "reference-to-video":
        return referenceImages.length > 0;
      case "video-edit":
        return !!videoUrl;
      default:
        return true;
    }
  };

  const handleGenerate = () => {
    if (!canGenerate()) return;
    setError("");

    const body: Record<string, unknown> = {
      model,
      mode: activeMode,
      prompt,
    };

    // Add params based on what the config supports
    if (config?.aspectRatios?.length) body.aspect_ratio = aspectRatio;
    if (config?.durations?.length) body.duration = duration;
    if (config?.resolutions?.length && config.showResolution) body.resolution = resolution;
    if (config?.showAudio) body.generate_audio = generateAudio;
    if (config?.showAutoFix) body.auto_fix = autoFix;
    if (config?.showCfgScale) body.cfg_scale = cfgScale;
    if (config?.showNegativePrompt && negativePrompt.trim()) body.negative_prompt = negativePrompt;

    // Kling video-edit specific
    if (activeMode === "video-edit") {
      body.keep_audio = keepAudio;
    }

    switch (activeMode) {
      case "image-to-video":
        body.image_url = imageUrl!.url;
        break;
      case "first-last-frame":
        body.first_frame_url = firstFrameUrl!.url;
        body.last_frame_url = lastFrameUrl!.url;
        break;
      case "extend-video":
        body.video_url = videoUrl!.url;
        break;
      case "reference-to-video":
        body.image_urls = referenceImages.map((img) => img.url);
        break;
      case "video-edit":
        body.video_url = videoUrl!.url;
        break;
    }

    generateVideo(body);
  };

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      <div className="fixed inset-0 mesh-gradient" />
      <div className="fixed inset-0 aurora-bg pointer-events-none" />
      <div className="grain-overlay" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 pt-28 pb-16 px-4">
          <div className="max-w-5xl mx-auto">

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Mode Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex justify-center mb-8">
                <div
                  className="liquid-glass-nav rounded-full p-1.5 inline-flex items-center gap-1 justify-center"
                  style={{
                    boxShadow: '0 4px 24px hsl(0 0% 0% / 0.15), inset 0 1px 0 0 hsl(0 0% 100% / 0.08)',
                  }}
                >
                  <Select value={model} onValueChange={handleModelChange}>
                    <SelectTrigger className="px-4 py-2 text-sm font-medium rounded-full border-none w-auto bg-transparent text-foreground/70 hover:text-foreground transition-all duration-300 focus:ring-0 focus:ring-offset-0 data-[state=open]:text-primary [&>span]:text-inherit h-auto gap-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border z-50 rounded-xl">
                      {VIDEO_MODELS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="w-px h-6 bg-border/30" />
                  {availableModes.map((mode) => (
                    <motion.button
                      key={mode.value}
                      onClick={() => handleModeChange(mode.value)}
                      className={cn(
                        "relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full flex items-center gap-2",
                        activeMode === mode.value
                          ? "text-primary"
                          : "text-foreground/70 hover:text-foreground"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {activeMode === mode.value && (
                        <motion.div
                          layoutId="activeVideoTab"
                          className="absolute inset-0 rounded-full liquid-glass"
                          style={{
                            background: 'linear-gradient(135deg, hsl(270 80% 65% / 0.15) 0%, hsl(270 80% 65% / 0.05) 100%)',
                            border: '1px solid hsl(270 80% 65% / 0.25)',
                          }}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        {mode.icon}
                        {mode.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-6">
                <div className="liquid-glass-card-sm p-5">
                  <div className="flex flex-col gap-4">
                    {/* Mode-specific file uploads */}
                    <AnimatePresence mode="wait">
                      {activeMode === "image-to-video" && (
                        <motion.div key="i2v-upload" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <Label className="text-foreground/70 text-xs font-medium mb-2 block">Source Image</Label>
                          <div className="flex items-center gap-3">
                            {imageUrl ? (
                              <div className="relative group">
                                <img src={imageUrl.preview} alt="Source" className="h-20 w-20 rounded-xl object-cover" />
                                <button onClick={() => setImageUrl(null)} className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleFileSelect("image-to-video")}
                                className="h-20 w-20 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                              >
                                <Upload className="w-4 h-4" />
                                <span className="text-[10px]">Upload</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {activeMode === "first-last-frame" && (
                        <motion.div key="flf-upload" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <Label className="text-foreground/70 text-xs font-medium mb-2 block">First & Last Frame</Label>
                          <div className="flex items-center gap-3">
                            {firstFrameUrl ? (
                              <div className="relative group">
                                <img src={firstFrameUrl.preview} alt="First frame" className="h-20 w-20 rounded-xl object-cover" />
                                <button onClick={() => setFirstFrameUrl(null)} className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                                <span className="absolute bottom-1 left-1 text-[9px] bg-background/80 px-1 rounded">First</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleFileSelect("first-frame")}
                                className="h-20 w-20 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                              >
                                <Upload className="w-4 h-4" />
                                <span className="text-[10px]">First</span>
                              </button>
                            )}
                            {lastFrameUrl ? (
                              <div className="relative group">
                                <img src={lastFrameUrl.preview} alt="Last frame" className="h-20 w-20 rounded-xl object-cover" />
                                <button onClick={() => setLastFrameUrl(null)} className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                                <span className="absolute bottom-1 left-1 text-[9px] bg-background/80 px-1 rounded">Last</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleFileSelect("last-frame")}
                                className="h-20 w-20 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                              >
                                <Upload className="w-4 h-4" />
                                <span className="text-[10px]">Last</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {activeMode === "extend-video" && (
                        <motion.div key="ev-upload" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <Label className="text-foreground/70 text-xs font-medium mb-2 block">Source Video</Label>
                          <div className="flex items-center gap-3">
                            {videoUrl ? (
                              <div className="relative group">
                                <div className="h-20 w-32 rounded-xl bg-muted flex items-center justify-center">
                                  <Video className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <button onClick={() => setVideoUrl(null)} className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleFileSelect("extend-video")}
                                className="h-20 w-32 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                              >
                                <Upload className="w-4 h-4" />
                                <span className="text-[10px]">Upload video</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {activeMode === "reference-to-video" && (
                        <motion.div key="r2v-upload" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <Label className="text-foreground/70 text-xs font-medium mb-2 block">Reference Images</Label>
                          <div className="flex items-center gap-2 flex-wrap">
                            {referenceImages.map((img, i) => (
                              <div key={i} className="relative group">
                                <img src={img.preview} alt={`Ref ${i + 1}`} className="h-16 w-16 rounded-lg object-cover" />
                                <button onClick={() => removeReferenceImage(i)} className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => handleFileSelect("reference-images")}
                              className="h-16 w-16 rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span className="text-[9px]">Add</span>
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {activeMode === "video-edit" && (
                        <motion.div key="ve-upload" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                          <Label className="text-foreground/70 text-xs font-medium mb-2 block">Source Video</Label>
                          <div className="flex items-center gap-3">
                            {videoUrl ? (
                              <div className="relative group">
                                <div className="h-20 w-32 rounded-xl bg-muted flex items-center justify-center">
                                  <Video className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <button onClick={() => setVideoUrl(null)} className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleFileSelect("extend-video")}
                                className="h-20 w-32 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                              >
                                <Upload className="w-4 h-4" />
                                <span className="text-[10px]">Upload video</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Prompt */}
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the video you want to generate..."
                      className="min-h-[80px] bg-input/50 border-border/50 rounded-xl resize-none focus:border-primary"
                    />

                    {/* Controls row */}
                    <div className="flex flex-wrap items-end gap-4">
                      {config?.aspectRatios?.length > 0 && (
                        <div className="space-y-1.5 min-w-[120px]">
                          <Label className="text-foreground/70 text-xs font-medium">Aspect Ratio</Label>
                          <Select value={aspectRatio} onValueChange={setAspectRatio}>
                            <SelectTrigger className="bg-input/50 border-border/50 rounded-xl h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {config.aspectRatios.map((ar) => (
                                <SelectItem key={ar} value={ar}>{ar}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {config?.durations?.length > 0 && (
                        <div className="space-y-1.5 min-w-[100px]">
                          <Label className="text-foreground/70 text-xs font-medium">Duration</Label>
                          <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger className="bg-input/50 border-border/50 rounded-xl h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {config.durations.map((d) => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {config?.showResolution && config?.resolutions?.length > 0 && (
                        <div className="space-y-1.5 min-w-[100px]">
                          <Label className="text-foreground/70 text-xs font-medium">Resolution</Label>
                          <Select value={resolution} onValueChange={setResolution}>
                            <SelectTrigger className="bg-input/50 border-border/50 rounded-xl h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {config.resolutions.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {config?.showAudio && (
                        <div className="flex items-center gap-2">
                          <Switch checked={generateAudio} onCheckedChange={setGenerateAudio} id="audio" />
                          <Label htmlFor="audio" className="text-foreground/70 text-xs font-medium cursor-pointer">Audio</Label>
                        </div>
                      )}

                      {config?.showAutoFix && (
                        <div className="flex items-center gap-2">
                          <Switch checked={autoFix} onCheckedChange={setAutoFix} id="autofix" />
                          <Label htmlFor="autofix" className="text-foreground/70 text-xs font-medium cursor-pointer">Auto Fix</Label>
                        </div>
                      )}

                      {activeMode === "video-edit" && (
                        <div className="flex items-center gap-2">
                          <Switch checked={keepAudio} onCheckedChange={setKeepAudio} id="keepaudio" />
                          <Label htmlFor="keepaudio" className="text-foreground/70 text-xs font-medium cursor-pointer">Keep Audio</Label>
                        </div>
                      )}

                      <Button
                        onClick={handleGenerate}
                        disabled={loading || !canGenerate()}
                        className="btn-premium rounded-xl h-9 px-6 text-sm ml-auto"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 mr-2" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Results */}
                <VideoResultsArea results={videoResults} loading={loading} error={error} onDelete={(url) => deleteMedia(url, "video")} />
              </div>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

// Results area for videos
const VideoResultsArea = ({
  results,
  loading,
  error,
  onDelete,
}: {
  results: Array<{ url: string }>;
  loading: boolean;
  error: string;
  onDelete?: (url: string) => void;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSaveToGallery = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], `magic-ai-video-${Date.now()}-${index}.mp4`, { type: "video/mp4" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } catch { /* user cancelled or error */ }
  };

  const handleShare = async (url: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Generated Video", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch { /* user cancelled */ }
  };

  return (
    <>
      <div className="min-h-[200px]">
        {error && !results.length ? (
          <div className="text-center text-destructive py-16">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1 text-destructive/80">{error}</p>
          </div>
        ) : results.length > 0 || loading ? (
          <div className="liquid-glass-card-sm p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {loading && (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="aspect-video rounded-xl liquid-glass flex flex-col items-center justify-center gap-3"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Generating video...</p>
                </motion.div>
              )}
              {results.map((vid, i) => (
                <motion.div
                  key={vid.url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group aspect-video"
                >
                  <video
                    src={vid.url}
                    className="w-full h-full rounded-xl object-cover pointer-events-none"
                    muted
                    loop
                    playsInline
                  />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 rounded-xl bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewUrl(vid.url)}
                        className="p-2 rounded-full liquid-glass text-foreground hover:text-primary transition-colors"
                        title="Play"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSaveToGallery(vid.url, i)}
                        className="p-2 rounded-full liquid-glass text-foreground hover:text-primary transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShare(vid.url)}
                        className="p-2 rounded-full liquid-glass text-foreground hover:text-primary transition-colors"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPreviewUrl(vid.url)}
                        className="p-2 rounded-full liquid-glass text-foreground hover:text-primary transition-colors"
                        title="Fullscreen"
                      >
                        <Expand className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => onDelete?.(vid.url)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass text-xs font-medium text-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground py-16">
            <Video className="w-12 h-12 opacity-30" />
            <p className="text-sm">Your generated videos will appear here</p>
          </div>
        )}
      </div>

      {/* Lightbox preview */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl w-full p-0 pt-10 pb-2 px-2 bg-background/95 backdrop-blur-xl border-none shadow-none">
          {previewUrl && (
            <video
              src={previewUrl}
              controls
              autoPlay
              className="w-full h-auto max-h-[80vh] rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoGenerate;
