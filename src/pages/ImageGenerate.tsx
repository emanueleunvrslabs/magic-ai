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

const IMAGE_SIZES = [
  { label: "Square (1024×1024)", value: "square_hd" },
  { label: "Portrait (768×1024)", value: "portrait_4_3" },
  { label: "Landscape (1024×768)", value: "landscape_4_3" },
  { label: "Wide (1024×576)", value: "landscape_16_9" },
  { label: "Tall (576×1024)", value: "portrait_16_9" },
];

const ImageGenerate = () => {
  const [activeTab, setActiveTab] = useState("generate");
  
  // Text-to-image state
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [imageSize, setImageSize] = useState("landscape_4_3");
  const [numImages, setNumImages] = useState(1);
  const [guidanceScale, setGuidanceScale] = useState(5);
  const [numSteps, setNumSteps] = useState(30);
  
  // Edit state
  const [editPrompt, setEditPrompt] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editStrength, setEditStrength] = useState(0.85);
  const [editImageSize, setEditImageSize] = useState("landscape_4_3");
  const [editGuidanceScale, setEditGuidanceScale] = useState(5);
  const [editNumSteps, setEditNumSteps] = useState(30);
  
  // Common state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ url: string }>>([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setEditImageUrl(dataUrl);
      setEditImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
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
          negative_prompt: negativePrompt || undefined,
          image_size: imageSize,
          num_images: numImages,
          guidance_scale: guidanceScale,
          num_inference_steps: numSteps,
          output_format: "png",
          enable_safety_checker: false,
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
    if (!editPrompt.trim() || !editImageUrl) return;
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("fal-ai-generate", {
        body: {
          mode: "edit",
          prompt: editPrompt,
          image_url: editImageUrl,
          strength: editStrength,
          image_size: editImageSize,
          guidance_scale: editGuidanceScale,
          num_inference_steps: editNumSteps,
          output_format: "png",
          enable_safety_checker: false,
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
    a.download = `magic-ai-${Date.now()}-${index}.png`;
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
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                <span className="gradient-text">Image Generation</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Powered by Nano Banana Pro — fast, high-quality AI images
              </p>
            </motion.div>

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-8">
                  <TabsList className="liquid-glass-card-sm p-1.5 bg-transparent border border-border/50">
                    <TabsTrigger
                      value="generate"
                      className="px-6 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Text to Image
                    </TabsTrigger>
                    <TabsTrigger
                      value="edit"
                      className="px-6 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Image Edit
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Text to Image */}
                <TabsContent value="generate">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-5">
                      <div className="liquid-glass-card-sm p-6 space-y-5">
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">Prompt</Label>
                          <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the image you want to create..."
                            className="min-h-[120px] bg-input/50 border-border/50 rounded-xl resize-none focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">Negative Prompt</Label>
                          <Textarea
                            value={negativePrompt}
                            onChange={(e) => setNegativePrompt(e.target.value)}
                            placeholder="What to avoid..."
                            className="min-h-[60px] bg-input/50 border-border/50 rounded-xl resize-none focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">Image Size</Label>
                          <Select value={imageSize} onValueChange={setImageSize}>
                            <SelectTrigger className="bg-input/50 border-border/50 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {IMAGE_SIZES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">
                            Guidance Scale: {guidanceScale}
                          </Label>
                          <Slider
                            value={[guidanceScale]}
                            onValueChange={([v]) => setGuidanceScale(v)}
                            min={1}
                            max={20}
                            step={0.5}
                            className="py-2"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">
                            Steps: {numSteps}
                          </Label>
                          <Slider
                            value={[numSteps]}
                            onValueChange={([v]) => setNumSteps(v)}
                            min={10}
                            max={50}
                            step={1}
                            className="py-2"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">
                            Number of Images: {numImages}
                          </Label>
                          <Slider
                            value={[numImages]}
                            onValueChange={([v]) => setNumImages(v)}
                            min={1}
                            max={4}
                            step={1}
                            className="py-2"
                          />
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
                    <div className="lg:col-span-2">
                      <ResultsArea results={results} loading={loading} error={error} onDownload={downloadImage} />
                    </div>
                  </div>
                </TabsContent>

                {/* Image Edit */}
                <TabsContent value="edit">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-5">
                      <div className="liquid-glass-card-sm p-6 space-y-5">
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">Source Image</Label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          {editImagePreview ? (
                            <div className="relative group">
                              <img
                                src={editImagePreview}
                                alt="Source"
                                className="w-full rounded-xl border border-border/50 object-cover max-h-48"
                              />
                              <button
                                onClick={() => { setEditImageUrl(""); setEditImagePreview(""); }}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full h-32 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                            >
                              <Upload className="w-6 h-6" />
                              <span className="text-sm">Upload image</span>
                            </button>
                          )}
                          <div className="flex gap-2">
                            <Input
                              value={editImageUrl.startsWith("data:") ? "" : editImageUrl}
                              onChange={(e) => { setEditImageUrl(e.target.value); setEditImagePreview(e.target.value); }}
                              placeholder="Or paste image URL..."
                              className="bg-input/50 border-border/50 rounded-xl"
                            />
                          </div>
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
                          <Label className="text-foreground/90 font-medium">
                            Strength: {editStrength.toFixed(2)}
                          </Label>
                          <Slider
                            value={[editStrength]}
                            onValueChange={([v]) => setEditStrength(v)}
                            min={0.1}
                            max={1}
                            step={0.05}
                            className="py-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            Higher = more creative, lower = closer to original
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">Output Size</Label>
                          <Select value={editImageSize} onValueChange={setEditImageSize}>
                            <SelectTrigger className="bg-input/50 border-border/50 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {IMAGE_SIZES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">
                            Guidance Scale: {editGuidanceScale}
                          </Label>
                          <Slider
                            value={[editGuidanceScale]}
                            onValueChange={([v]) => setEditGuidanceScale(v)}
                            min={1}
                            max={20}
                            step={0.5}
                            className="py-2"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground/90 font-medium">
                            Steps: {editNumSteps}
                          </Label>
                          <Slider
                            value={[editNumSteps]}
                            onValueChange={([v]) => setEditNumSteps(v)}
                            min={10}
                            max={50}
                            step={1}
                            className="py-2"
                          />
                        </div>
                        <Button
                          onClick={handleEdit}
                          disabled={loading || !editPrompt.trim() || !editImageUrl}
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

                    {/* Results */}
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
  <div className="liquid-glass-card-sm p-6 min-h-[400px] flex items-center justify-center">
    {loading ? (
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm">Generating your image...</p>
      </div>
    ) : error ? (
      <div className="text-center text-destructive">
        <p className="font-medium">Error</p>
        <p className="text-sm mt-1 text-destructive/80">{error}</p>
      </div>
    ) : results.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <AnimatePresence>
          {results.map((img, i) => (
            <motion.div
              key={img.url}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              <img
                src={img.url}
                alt={`Generated ${i + 1}`}
                className="w-full rounded-xl border border-border/30 shadow-lg"
              />
              <button
                onClick={() => onDownload(img.url, i)}
                className="absolute bottom-3 right-3 p-2.5 rounded-full liquid-glass opacity-0 group-hover:opacity-100 transition-opacity text-foreground hover:text-primary"
              >
                <Download className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <ImageIcon className="w-12 h-12 opacity-30" />
        <p className="text-sm">Your generated images will appear here</p>
      </div>
    )}
  </div>
);

export default ImageGenerate;
