import { motion } from "framer-motion";
import { Image, Video, Sparkles } from "lucide-react";
import img1 from "@/assets/gallery/img1.jpg";
import img2 from "@/assets/gallery/img2.jpg";
import img5 from "@/assets/gallery/img5.jpg";
import vid1 from "@/assets/gallery/vid1.mp4";
import vid2 from "@/assets/gallery/vid2.mp4";
import vid3 from "@/assets/gallery/vid3.mp4";

const galleryItems = [
  { src: img1, label: "Nano Banana Pro", type: "image" as const, span: "row-span-1" },
  { src: img2, label: "Nano Banana Pro", type: "image" as const, span: "row-span-2" },
  { src: vid1, label: "Veo 3.1", type: "video" as const, span: "row-span-1" },
  { src: vid2, label: "Kling", type: "video" as const, span: "row-span-1" },
  { src: img5, label: "Nano Banana Pro", type: "image" as const, span: "row-span-2" },
  { src: vid3, label: "Veo 3.1", type: "video" as const, span: "row-span-1" },
];

export const HeroGallery = () => {
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

        {/* Gallery Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 auto-rows-[180px] md:auto-rows-[220px]"
        >
          {galleryItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className={`relative group rounded-2xl overflow-hidden cursor-pointer ${item.span}`}
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
