import { Compass, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-white py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            <span className="text-xl font-display font-bold">WanderSync</span>
          </div>
          <p className="text-white/60 flex items-center gap-2 text-sm">
            Crafted with <Heart className="w-4 h-4 text-accent" fill="currentColor" /> for beautiful journeys.
          </p>
          <div className="flex gap-6 text-sm text-white/60">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
