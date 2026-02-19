import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Download, ImageIcon, Wand2, Upload, X, Share2, Expand, Video, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useGeneration } from "@/contexts/GenerationContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { NoCreditsDialog } from "@/components/credits/NoCreditsDialog";

const ASPECT_RATIOS = [
  { label: "Auto", value: "auto" },
  { label: "1:1", value: "1:1" },
  { label: "21:9", value: "21:9" },
  { label: "16:9", value: "16:9" },
  { label: "3:2", value: "3:2" },
  { label: "4:3", value: "4:3" },
  { label: "5:4", value: "5:4" },
  { label: "4:5", value: "4:5" },
  { label: "3:4", value: "3:4" },
  { label: "2:3", value: "2:3" },
  { label: "9:16", value: "9:16" },
];

const RESOLUTIONS = [
  { label: "1K", value: "1K" },
  { label: "2K", value: "2K" },
  { label: "4K", value: "4K" },
];

const OUTPUT_FORMATS = [
  { label: "PNG", value: "png" },
  { label: "JPEG", value: "jpeg" },
  { label: "WebP", value: "webp" },
];

const ImageGenerate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { imageResults, imageJobs, generateImages, deleteMedia, checkCanGenerate } = useGeneration();
  const [activeTab, setActiveTab] = useState("generate");
  const [loginOpen, setLoginOpen] = useState(false);
  const [noCreditsOpen, setNoCreditsOpen] = useState(false);

  // Text-to-image state
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [numImages, setNumImages] = useState(1);

  // Edit state
  const [editPrompt, setEditPrompt] = useState("");
  const [editImages, setEditImages] = useState<Array<{ url: string; preview: string }>>([]);
  const [editAspectRatio, setEditAspectRatio] = useState("auto");
  const [editResolution, setEditResolution] = useState("1K");
  const [editOutputFormat, setEditOutputFormat] = useState("png");

  // Common state
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loading = imageJobs.some((j) => j.status === "pending");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setEditImages((prev) => [...prev, { url: dataUrl, preview: dataUrl }]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const removeEditImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!user) { setLoginOpen(true); return; }
    const ok = await checkCanGenerate();
    if (!ok) { setNoCreditsOpen(true); return; }
    setError("");
    generateImages({
      mode: "generate",
      prompt,
      num_images: numImages,
      aspect_ratio: aspectRatio,
      output_format: outputFormat,
      resolution,
      safety_tolerance: "6",
    });
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || editImages.length === 0) return;
    if (!user) { setLoginOpen(true); return; }
    const ok = await checkCanGenerate();
    if (!ok) { setNoCreditsOpen(true); return; }
    setError("");
    generateImages({
      mode: "edit",
      prompt: editPrompt,
      image_urls: editImages.map((img) => img.url),
      aspect_ratio: editAspectRatio,
      output_format: editOutputFormat,
      resolution: editResolution,
      safety_tolerance: "6",
    });
  };

  const downloadImage = (url: string, index: number) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `magic-ai-${Date.now()}-${index}.${outputFormat}`;
    a.target = "_blank";
    a.click();
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

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-8">
                  <div className="liquid-glass-nav rounded-full p-1.5 flex items-center gap-1"
                    style={{
                      boxShadow: '0 4px 24px hsl(0 0% 0% / 0.15), inset 0 1px 0 0 hsl(0 0% 100% / 0.08)'
                    }}
                  >
                    {[
                      { value: "generate", label: "Text to Image", icon: <ImageIcon className="w-4 h-4" /> },
                      { value: "edit", label: "Image Edit", icon: <Wand2 className="w-4 h-4" /> },
                    ].map((tab) => (
                      <motion.button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={cn(
                          "relative px-5 py-2 text-sm font-medium transition-all duration-300 rounded-full flex items-center gap-2",
                          activeTab === tab.value
                            ? "text-primary"
                            : "text-foreground/70 hover:text-foreground"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {activeTab === tab.value && (
                          <motion.div
                            layoutId="activeImageTab"
                            className="absolute inset-0 rounded-full liquid-glass"
                            style={{
                              background: 'linear-gradient(135deg, hsl(270 80% 65% / 0.15) 0%, hsl(270 80% 65% / 0.05) 100%)',
                              border: '1px solid hsl(270 80% 65% / 0.25)'
                            }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                          {tab.icon}
                          {tab.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Text to Image */}
                <TabsContent value="generate">
                  <div className="space-y-6">
                    {/* Controls bar */}
                    <div className="liquid-glass-card-sm p-5">
                      <div className="flex flex-col gap-4">
                        <Textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe the image you want to create..."
                          className="min-h-[80px] bg-input/50 border-border/50 rounded-xl resize-none focus:border-primary"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-foreground/70 text-xs font-medium">Aspect Ratio</Label>
                            <Select value={aspectRatio} onValueChange={setAspectRatio}>
                              <SelectTrigger className="bg-input/50 border-border/50 rounded-xl h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ASPECT_RATIOS.map((ar) => (
                                  <SelectItem key={ar.value} value={ar.value}>{ar.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-foreground/70 text-xs font-medium">Resolution</Label>
                            <Select value={resolution} onValueChange={setResolution}>
                              <SelectTrigger className="bg-input/50 border-border/50 rounded-xl h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RESOLUTIONS.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-foreground/70 text-xs font-medium">Format</Label>
                            <Select value={outputFormat} onValueChange={setOutputFormat}>
                              <SelectTrigger className="bg-input/50 border-border/50 rounded-xl h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {OUTPUT_FORMATS.map((f) => (
                                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-end justify-between gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-foreground/70 text-xs font-medium">Images</Label>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4].map((n) => (
                                <button
                                  key={n}
                                  onClick={() => setNumImages(n)}
                                  className={cn(
                                    "w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200",
                                    numImages === n
                                      ? "bg-primary text-primary-foreground shadow-md"
                                      : "bg-input/50 border border-border/50 text-foreground/70 hover:border-primary/50 hover:text-foreground"
                                  )}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={handleGenerate}
                          disabled={loading || !prompt.trim()}
                          className="w-full btn-premium rounded-xl h-12 text-base"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-5 h-5 mr-2" />
                              Generate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Results */}
                    <ResultsArea results={imageResults} loading={loading} error={error} onDownload={downloadImage} onGenerateVideo={(url) => navigate("/video", { state: { imageUrl: url } })} onDelete={(url) => deleteMedia(url, "image")} />
                  </div>
                </TabsContent>

                {/* Image Edit */}
                <TabsContent value="edit">
                  <div className="space-y-6">
                    {/* Controls bar — same horizontal layout as Text to Image */}
                    <div className="liquid-glass-card-sm p-5">
                      <div className="flex flex-col gap-4">
                        {/* Source images upload area */}
                        <div className="space-y-2">
                          <Label className="text-foreground/70 text-xs font-medium">Source Images</Label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <div className="flex items-center gap-3 flex-wrap">
                            {editImages.map((img, i) => (
                              <div key={i} className="relative group">
                                <img
                                  src={img.preview}
                                  alt={`Source ${i + 1}`}
                                  className="w-16 h-16 rounded-lg border border-border/50 object-cover"
                                />
                                <button
                                  onClick={() => removeEditImage(i)}
                                  className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-16 h-16 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              <span className="text-[10px]">Upload</span>
                            </button>
                          </div>
                        </div>
                        <Textarea
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          placeholder="Describe how to edit the image..."
                          className="min-h-[80px] bg-input/50 border-border/50 rounded-xl resize-none focus:border-primary"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-foreground/70 text-xs font-medium">Aspect Ratio</Label>
                            <Select value={editAspectRatio} onValueChange={setEditAspectRatio}>
                              <SelectTrigger className="bg-input/50 border-border/50 rounded-xl h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ASPECT_RATIOS.map((ar) => (
                                  <SelectItem key={ar.value} value={ar.value}>{ar.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-foreground/70 text-xs font-medium">Resolution</Label>
                            <Select value={editResolution} onValueChange={setEditResolution}>
                              <SelectTrigger className="bg-input/50 border-border/50 rounded-xl h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RESOLUTIONS.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-foreground/70 text-xs font-medium">Format</Label>
                            <Select value={editOutputFormat} onValueChange={setEditOutputFormat}>
                              <SelectTrigger className="bg-input/50 border-border/50 rounded-xl h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {OUTPUT_FORMATS.map((f) => (
                                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            onClick={handleEdit}
                            disabled={loading || !editPrompt.trim() || editImages.length === 0}
                            className="btn-premium rounded-xl h-9 px-6 text-sm"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Editing...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                Edit Image
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Results */}
                    <ResultsArea results={imageResults} loading={loading} error={error} onDownload={downloadImage} onGenerateVideo={(url) => navigate("/video", { state: { imageUrl: url } })} onDelete={(url) => deleteMedia(url, "image")} />
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      <NoCreditsDialog open={noCreditsOpen} onOpenChange={setNoCreditsOpen} />
    </div>
  );
};

const ResultsArea = ({
  results,
  loading,
  error,
  onDownload,
  onGenerateVideo,
  onDelete,
}: {
  results: Array<{ url: string }>;
  loading: boolean;
  error: string;
  onDownload: (url: string, i: number) => void;
  onGenerateVideo?: (url: string) => void;
  onDelete?: (url: string) => void;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSaveToGallery = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
      const file = new File([blob], `magic-ai-${Date.now()}-${index}.${ext}`, { type: blob.type });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        // Fallback: regular download
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } catch {
      // user cancelled or error
    }
  };

  const handleShare = async (url: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Generated Image", url });
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
          <div className="liquid-glass-card-sm p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence>
              {loading && (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="aspect-square rounded-xl liquid-glass flex flex-col items-center justify-center gap-3"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Generating...</p>
                </motion.div>
              )}
              {results.map((img, i) => (
                <motion.div
                  key={img.url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group aspect-square"
                >
                  <img
                    src={img.url}
                    alt={`Generated ${i + 1}`}
                    className="w-full h-full rounded-xl object-cover"
                  />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 rounded-xl bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveToGallery(img.url, i)}
                        className="p-2 rounded-full liquid-glass text-foreground hover:text-primary transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShare(img.url)}
                        className="p-2 rounded-full liquid-glass text-foreground hover:text-primary transition-colors"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPreviewUrl(img.url)}
                        className="p-2 rounded-full liquid-glass text-foreground hover:text-primary transition-colors"
                        title="Preview"
                      >
                        <Expand className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => onGenerateVideo?.(img.url)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass text-xs font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Generate Video
                    </button>
                    <button
                      onClick={() => onDelete?.(img.url)}
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
            <ImageIcon className="w-12 h-12 opacity-30" />
            <p className="text-sm">Your generated images will appear here</p>
          </div>
        )}
      </div>

      {/* Lightbox preview */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl w-full p-2 bg-background/95 backdrop-blur-xl border-none shadow-none">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGenerate;
