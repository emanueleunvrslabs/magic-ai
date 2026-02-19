import { Instagram, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="relative py-6 px-4">
      <div className="container mx-auto">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-muted-foreground flex-wrap justify-center">
            {/* Brand */}
            <span>
              <span className="text-primary font-semibold">Magic AI</span>
              {" "}—{" "}
              <span>un servizio by{" "}
                <a
                  href="https://www.unvrslabs.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  Unvrs Labs
                </a>
              </span>
            </span>

            <span className="hidden sm:block text-white/20">|</span>

            {/* Copyright */}
            <span>© {new Date().getFullYear()} Unvrs Labs</span>

            <span className="hidden sm:block text-white/20">|</span>

            {/* Socials */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/unvrslabs.dev?igsh=Z28wczloZnY2d3U5&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Seguici su Instagram"
                className="hover:text-primary transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/107038862"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Seguici su LinkedIn"
                className="hover:text-primary transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
