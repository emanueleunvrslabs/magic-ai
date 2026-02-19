export const Footer = () => {
  return (
    <footer className="relative py-8">
      <div className="container mx-auto px-4">
        <div className="border-t border-white/10 pt-8 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()}{" "}
            <a
              href="https://www.unvrslabs.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              magic ai by unvrs labs
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
