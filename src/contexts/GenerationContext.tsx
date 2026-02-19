import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GenerationJob {
  id: string;
  type: "image" | "video";
  status: "pending" | "done" | "error";
  error?: string;
}

interface GenerationContextType {
  imageResults: Array<{ url: string }>;
  videoResults: Array<{ url: string }>;
  imageJobs: GenerationJob[];
  videoJobs: GenerationJob[];
  generateImages: (params: Record<string, unknown>) => void;
  generateVideo: (params: Record<string, unknown>) => void;
}

const GenerationContext = createContext<GenerationContextType>({
  imageResults: [],
  videoResults: [],
  imageJobs: [],
  videoJobs: [],
  generateImages: () => {},
  generateVideo: () => {},
});

export const useGeneration = () => useContext(GenerationContext);

let jobCounter = 0;

export const GenerationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [imageResults, setImageResults] = useState<Array<{ url: string }>>([]);
  const [videoResults, setVideoResults] = useState<Array<{ url: string }>>([]);
  const [imageJobs, setImageJobs] = useState<GenerationJob[]>([]);
  const [videoJobs, setVideoJobs] = useState<GenerationJob[]>([]);

  // Load saved media on login
  useEffect(() => {
    if (!user) {
      setImageResults([]);
      setVideoResults([]);
      return;
    }
    const load = async () => {
      const [imgRes, vidRes] = await Promise.all([
        supabase
          .from("generated_media")
          .select("url")
          .eq("user_id", user.id)
          .eq("media_type", "image")
          .order("created_at", { ascending: false }),
        supabase
          .from("generated_media")
          .select("url")
          .eq("user_id", user.id)
          .eq("media_type", "video")
          .order("created_at", { ascending: false }),
      ]);
      if (imgRes.data) setImageResults(imgRes.data.map((r) => ({ url: r.url })));
      if (vidRes.data) setVideoResults(vidRes.data.map((r) => ({ url: r.url })));
    };
    load();
  }, [user]);

  const saveMedia = useCallback(
    async (urls: string[], type: "image" | "video") => {
      if (!user) return;
      const rows = urls.map((url) => ({ user_id: user.id, media_type: type, url }));
      await supabase.from("generated_media").insert(rows);
    },
    [user]
  );

  const generateImages = useCallback(
    (params: Record<string, unknown>) => {
      const jobId = `img-${++jobCounter}`;
      const job: GenerationJob = { id: jobId, type: "image", status: "pending" };
      setImageJobs((prev) => [job, ...prev]);

      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke("fal-ai-generate", { body: params });
          if (error) throw new Error(error.message);
          if (data?.error) throw new Error(data.error);

          const newImages: Array<{ url: string }> = data?.images || [];
          setImageResults((prev) => [...newImages, ...prev]);
          await saveMedia(newImages.map((img) => img.url), "image");
          setImageJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "done" } : j)));
        } catch (err: any) {
          setImageJobs((prev) =>
            prev.map((j) => (j.id === jobId ? { ...j, status: "error", error: err.message } : j))
          );
        }
      })();
    },
    [saveMedia]
  );

  const generateVideo = useCallback(
    (params: Record<string, unknown>) => {
      const jobId = `vid-${++jobCounter}`;
      const job: GenerationJob = { id: jobId, type: "video", status: "pending" };
      setVideoJobs((prev) => [job, ...prev]);

      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke("fal-ai-video", { body: params });
          if (error) throw new Error(error.message);
          if (data?.error) throw new Error(data.error);

          if (data?.video?.url) {
            setVideoResults((prev) => [{ url: data.video.url }, ...prev]);
            await saveMedia([data.video.url], "video");
          }
          setVideoJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "done" } : j)));
        } catch (err: any) {
          setVideoJobs((prev) =>
            prev.map((j) => (j.id === jobId ? { ...j, status: "error", error: err.message } : j))
          );
        }
      })();
    },
    [saveMedia]
  );

  return (
    <GenerationContext.Provider
      value={{ imageResults, videoResults, imageJobs, videoJobs, generateImages, generateVideo }}
    >
      {children}
    </GenerationContext.Provider>
  );
};
