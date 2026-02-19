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
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, ImageIcon, Wand2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState("generate");

  // Text-to-image state
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [outputFormat, setOutputFormat] = useState("png");
  const [numImages, setNumImages] = useState(1);

  // Edit state
  const [editPrompt, setEditPrompt] = useState("");
  const [editImages, setEditImages] = useState<Array<{ url: string; preview: string }>>([]);
  const [editAspectRatio, setEditAspectRatio] = useState("auto");
  const [editResolution, setEditResolution] = useState("1K");
  const [editOutputFormat, setEditOutputFormat] = useState("png");

  // Common state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ url: string }>>([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("fal-ai-generate", {
        body: {
          mode: "generate",
          prompt,
          num_images: numImages,
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          resolution,
          safety_tolerance: "6",
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setResults(data?.images || []);
    } catch (err: any) {
      setError(err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || editImages.length === 0) return;
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("fal-ai-generate", {
        body: {
          mode: "edit",
          prompt: editPrompt,
          image_urls: editImages.map((img) => img.url),
          aspect_ratio: editAspectRatio,
          output_format: editOutputFormat,
          resolution: editResolution,
          safety_tolerance: "6",
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setResults(data?.images || []);
    } catch (err: any) {
      setError(err.message || "Edit failed");
    } finally {
      setLoading(false);
    }
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
                    {/* Top row: Prompt + Preview */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                      {/* Prompt & Controls */}
                      <div className="lg:col-span-3 liquid-glass-card-sm p-5">
                        <div className="flex flex-col gap-4">
                          <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the image you want to create..."
                            className="min-h-[60px] bg-input/50 border-border/50 rounded-xl resize-none focus:border-primary text-sm"
                          />
                          <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-1 min-w-[110px]">
                              <Label className="text-foreground/70 text-xs font-medium">Aspect Ratio</Label>
                              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                <SelectTrigger className="bg-input/50 border-border/50 rounded-xl h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ASPECT_RATIOS.map((ar) => (
                                    <SelectItem key={ar.value} value={ar.value}>{ar.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1 min-w-[80px]">
                              <Label className="text-foreground/70 text-xs font-medium">Resolution</Label>
                              <Select value={resolution} onValueChange={setResolution}>
                                <SelectTrigger className="bg-input/50 border-border/50 rounded-xl h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {RESOLUTIONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1 min-w-[80px]">
                              <Label className="text-foreground/70 text-xs font-medium">Format</Label>
                              <Select value={outputFormat} onValueChange={setOutputFormat}>
                                <SelectTrigger className="bg-input/50 border-border/50 rounded-xl h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {OUTPUT_FORMATS.map((f) => (
                                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1 min-w-[100px]">
                              <Label className="text-foreground/70 text-xs font-medium">
                                Images: {numImages}
                              </Label>
                              <Slider
                                value={[numImages]}
                                onValueChange={([v]) => setNumImages(v)}
                                min={1}
                                max={4}
                                step={1}
                                className="py-1.5"
                              />
                            </div>
                            <Button
                              onClick={handleGenerate}
                              disabled={loading || !prompt.trim()}
                              className="btn-premium rounded-xl h-8 px-5 text-xs ml-auto"
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                                  Generate
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Preview card */}
                      <div className="lg:col-span-2 liquid-glass-card-sm p-4 flex items-center justify-center min-h-[160px]">
                        {loading ? (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-xs">Generating...</p>
                          </div>
                        ) : results.length > 0 ? (
                          <img
                            src={results[results.length - 1].url}
                            alt="Latest generation"
                            className="max-h-[200px] w-auto rounded-xl border border-border/30 shadow-md object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <ImageIcon className="w-8 h-8 opacity-30" />
                            <p className="text-xs">Preview</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Gallery */}
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-foreground/60 mb-3 tracking-wide uppercase">Gallery</h3>
                      <ResultsArea results={results} loading={false} error={error} onDownload={downloadImage} />
                    </div>
                  </div>
                </TabsContent>

                {/* Image Edit */}
                <TabsContent value="edit">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-5">
                      <div className="liquid-glass-card-sm p-6 space-y-5">
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">Source Images</Label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          {editImages.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {editImages.map((img, i) => (
                                <div key={i} className="relative group">
                                  <img
                                    src={img.preview}
                                    alt={`Source ${i + 1}`}
                                    className="w-full rounded-lg border border-border/50 object-cover h-24"
                                  />
                                  <button
                                    onClick={() => removeEditImage(i)}
                                    className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-24 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                          >
                            <Upload className="w-5 h-5" />
                            <span className="text-sm">
                              {editImages.length > 0 ? "Add more images" : "Upload images"}
                            </span>
                          </button>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">Edit Prompt</Label>
                          <Textarea
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="Describe how to edit the image..."
                            className="min-h-[100px] bg-input/50 border-border/50 rounded-xl resize-none focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">Aspect Ratio</Label>
                          <Select value={editAspectRatio} onValueChange={setEditAspectRatio}>
                            <SelectTrigger className="bg-input/50 border-border/50 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ASPECT_RATIOS.map((ar) => (
                                <SelectItem key={ar.value} value={ar.value}>{ar.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">Resolution</Label>
                          <Select value={editResolution} onValueChange={setEditResolution}>
                            <SelectTrigger className="bg-input/50 border-border/50 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RESOLUTIONS.map((r) => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">Output Format</Label>
                          <Select value={editOutputFormat} onValueChange={setEditOutputFormat}>
                            <SelectTrigger className="bg-input/50 border-border/50 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OUTPUT_FORMATS.map((f) => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={handleEdit}
                          disabled={loading || !editPrompt.trim() || editImages.length === 0}
                          className="w-full btn-premium rounded-xl h-12 text-base"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              Editing...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-5 h-5 mr-2" />
                              Edit Image
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <ResultsArea results={results} loading={loading} error={error} onDownload={downloadImage} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

const ResultsArea = ({
  results,
  loading,
  error,
  onDownload,
}: {
  results: Array<{ url: string }>;
  loading: boolean;
  error: string;
  onDownload: (url: string, i: number) => void;
}) => (
  <div className="min-h-[200px]">
    {loading ? (
      <div className="flex flex-col items-center gap-4 text-muted-foreground py-16">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm">Generating your image...</p>
      </div>
    ) : error ? (
      <div className="text-center text-destructive py-16">
        <p className="font-medium">Error</p>
        <p className="text-sm mt-1 text-destructive/80">{error}</p>
      </div>
    ) : results.length > 0 ? (
      <div className="liquid-glass-card-sm p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <AnimatePresence>
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
                className="w-full h-full rounded-xl border border-border/30 shadow-md object-cover"
              />
              <button
                onClick={() => onDownload(img.url, i)}
                className="absolute bottom-2 right-2 p-2 rounded-full liquid-glass opacity-0 group-hover:opacity-100 transition-opacity text-foreground hover:text-primary"
              >
                <Download className="w-4 h-4" />
              </button>
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
);

export default ImageGenerate;
