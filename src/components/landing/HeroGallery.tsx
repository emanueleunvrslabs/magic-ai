import { motion } from "framer-motion";
import { Image, Video, Sparkles, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import img1 from "@/assets/gallery/img1.jpg";
import img2 from "@/assets/gallery/img2.jpg";
import img5 from "@/assets/gallery/img5.jpg";
import vid1 from "@/assets/gallery/vid1.mp4";
import vid2 from "@/assets/gallery/vid2.mp4";
import vid3 from "@/assets/gallery/vid3.mp4";

const galleryItems = [
  { src: img1, label: "Nano Banana Pro", type: "image" as const },
  { src: img2, label: "Nano Banana Pro", type: "image" as const },
  { src: vid1, label: "Veo 3.1", type: "video" as const },
  { src: vid2, label: "Kling", type: "video" as const },
  { src: img5, label: "Nano Banana Pro", type: "image" as const },
  { src: vid3, label: "Veo 3.1", type: "video" as const },
];

/** Returns a base value between 5000-20000 based on time of day (simulated daily curve) */
function getDayBase() {
  const hour = new Date().getHours();
  // Curve: peak ~18k at 14-18h, low ~6k at 3-5h
  const curve: Record<number, number> = {
    0: 8500, 1: 7500, 2: 6500, 3: 5800, 4: 5500, 5: 5800,
    6: 6500, 7: 8000, 8: 10000, 9: 12000, 10: 14000, 11: 15500,
    12: 16500, 13: 17500, 14: 18500, 15: 19000, 16: 19500, 17: 19000,
    18: 18000, 19: 17000, 20: 15500, 21: 14000, 22: 12000, 23: 10000,
  };
  const now = curve[hour] ?? 12000;
  const next = curve[(hour + 1) % 24] ?? 12000;
  const min = new Date().getMinutes();
  // Interpolate between current and next hour
  return Math.round(now + (next - now) * (min / 60));
}

function useLiveCounter() {
  const [count, setCount] = useState(() => getDayBase());
  const countRef = useRef(count);

  useEffect(() => {
    const tick = () => {
      const target = getDayBase();
      // Drift toward the target + small random fluctuation
      const drift = Math.sign(target - countRef.current) * Math.ceil(Math.random() * 8);
      const jitter = Math.round((Math.random() - 0.5) * 10);
      countRef.current = Math.max(5000, Math.min(20000, countRef.current + drift + jitter));
      setCount(countRef.current);
    };
    const id = setInterval(tick, 1500 + Math.random() * 2500);
    return () => clearInterval(id);
  }, []);

  return count;
}

export const HeroGallery = () => {
  const liveUsers = useLiveCounter();

  return (
    <section className="relative pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">Powered by AI</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight">
            <span className="text-foreground">Create </span>
            <span className="gradient-text">stunning visuals</span>
            <br />
            <span className="text-foreground">with AI magic</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate breathtaking images and videos using the world's most advanced AI models.
            From concept to creation in seconds.
          </p>
        </motion.div>

        {/* Live users counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex items-center justify-center mb-6"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full liquid-glass">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {liveUsers.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              utenti stanno generando contenuti
            </span>
          </div>
        </motion.div>

        {/* Gallery Grid — uniform height */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 auto-rows-[200px] md:auto-rows-[240px]"
        >
          {galleryItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className="relative group rounded-2xl overflow-hidden cursor-pointer"
            >
              {item.type === "video" ? (
                <video
                  src={item.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <img
                  src={item.src}
                  alt={`AI generated ${item.type}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Badge */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium liquid-glass">
                  {item.type === "image" ? (
                    <Image className="w-3 h-3 text-primary" />
                  ) : (
                    <Video className="w-3 h-3 text-accent" />
                  )}
                  {item.label}
                </span>
              </div>
              {/* Video play icon */}
              {item.type === "video" && (
                <div className="absolute top-3 right-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 backdrop-blur-sm flex items-center justify-center border border-accent/30">
                    <Video className="w-4 h-4 text-accent" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Models bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-10"
        >
          {["Nano Banana Pro", "Veo 3.1", "Kling"].map((model) => (
            <span
              key={model}
              className="px-4 py-2 rounded-full text-sm font-medium liquid-glass text-foreground/80"
            >
              {model}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
