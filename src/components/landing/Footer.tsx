import { Instagram, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="relative py-8">
      <div className="container mx-auto px-4">
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()}{" "}
            Magic Ai by{" "}
            <a
              href="https://www.unvrslabs.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Unvrs Labs
            </a>
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/unvrslabs.dev?igsh=Z28wczloZnY2d3U5&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Seguici su Instagram"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://www.linkedin.com/company/107038862"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Seguici su LinkedIn"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
