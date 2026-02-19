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
  deleteMedia: (url: string, type: "image" | "video") => Promise<void>;
  checkCanGenerate: () => Promise<boolean>;
}

const GenerationContext = createContext<GenerationContextType>({
  imageResults: [],
  videoResults: [],
  imageJobs: [],
  videoJobs: [],
  generateImages: () => {},
  generateVideo: () => {},
  deleteMedia: async () => {},
  checkCanGenerate: async () => false,
});

export const useGeneration = () => useContext(GenerationContext);

let jobCounter = 0;

/** Check if user has a valid fal API key (without fetching the key itself) */
async function userHasFalKey(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_api_keys")
    .select("is_valid")
    .eq("user_id", userId)
    .eq("provider", "fal")
    .eq("is_valid", true)
    .limit(1);
  return data != null && data.length > 0;
}

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
          // Tell edge function to use stored key server-side (key never sent to client)
          const hasOwnKey = user ? await userHasFalKey(user.id) : false;
          const body = hasOwnKey ? { ...params, useStoredKey: true } : params;

          const { data, error } = await supabase.functions.invoke("fal-ai-generate", { body });
          console.log("fal-ai-generate response:", JSON.stringify(data));
          if (error) throw new Error(error.message);
          if (data?.error) throw new Error(data.error);

          const rawImages = data?.images || data?.output?.images || data?.data?.images || [];
          const newImages: Array<{ url: string }> = Array.isArray(rawImages)
            ? rawImages.map((img: any) => ({ url: typeof img === "string" ? img : img.url }))
            : [];
          
          if (newImages.length > 0) {
            setImageResults((prev) => [...newImages, ...prev]);
            await saveMedia(newImages.map((img) => img.url), "image");
          }
          setImageJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "done" } : j)));
        } catch (err: any) {
          console.error("Image generation error:", err);
          setImageJobs((prev) =>
            prev.map((j) => (j.id === jobId ? { ...j, status: "error", error: err.message } : j))
          );
        }
      })();
    },
    [saveMedia, user]
  );

  const generateVideo = useCallback(
    (params: Record<string, unknown>) => {
      const jobId = `vid-${++jobCounter}`;
      const job: GenerationJob = { id: jobId, type: "video", status: "pending" };
      setVideoJobs((prev) => [job, ...prev]);

      (async () => {
        try {
          const hasOwnKey = user ? await userHasFalKey(user.id) : false;
          const body = hasOwnKey ? { ...params, useStoredKey: true } : params;

          const { data, error } = await supabase.functions.invoke("fal-ai-video", { body });
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
    [saveMedia, user]
  );

  const deleteMedia = useCallback(
    async (url: string, type: "image" | "video") => {
      if (type === "image") {
        setImageResults((prev) => prev.filter((item) => item.url !== url));
      } else {
        setVideoResults((prev) => prev.filter((item) => item.url !== url));
      }
      if (user) {
        await supabase
          .from("generated_media")
          .delete()
          .eq("user_id", user.id)
          .eq("url", url);
      }
    },
    [user]
  );

  const checkCanGenerate = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    const [creditsRes, keysRes] = await Promise.all([
      supabase.from("user_credits").select("balance").eq("user_id", user.id).single(),
      supabase.from("user_api_keys").select("provider, is_valid").eq("user_id", user.id).eq("provider", "fal").eq("is_valid", true),
    ]);
    const hasCredits = (creditsRes.data?.balance ?? 0) > 0;
    const hasOwnKey = (keysRes.data?.length ?? 0) > 0;
    return hasCredits || hasOwnKey;
  }, [user]);

  return (
    <GenerationContext.Provider
      value={{ imageResults, videoResults, imageJobs, videoJobs, generateImages, generateVideo, deleteMedia, checkCanGenerate }}
    >
      {children}
    </GenerationContext.Provider>
  );
};
