import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Compass, User, Heart, Map, LogOut, BarChart3, Search, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setLocation("/");
    setMenuOpen(false);
  };

  const isHome = location === "/";
  const navBg = scrolled || !isHome ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-border/50" : "bg-transparent text-white";
  const textColor = scrolled || !isHome ? "text-foreground" : "text-white";

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-primary to-accent flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <span className={`text-2xl font-display font-bold tracking-tight ${textColor}`}>
              Wander<span className="text-primary">Sync</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/search" className={`font-medium hover:text-primary transition-colors flex items-center gap-1 ${textColor}`}>
              <Search className="w-4 h-4" /> Explore
            </Link>
            <Link href="/itinerary" className={`font-medium hover:text-primary transition-colors flex items-center gap-1 ${textColor}`}>
              <Sparkles className="w-4 h-4" /> Itinerary
            </Link>
            <Link href="/analytics" className={`font-medium hover:text-primary transition-colors flex items-center gap-1 ${textColor}`}>
              <BarChart3 className="w-4 h-4" /> Trends
            </Link>
            
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
                >
                  <User className="w-4 h-4" />
                  {user.name.split(' ')[0]}
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden py-2"
                    >
                      <Link href="/trips" className="flex items-center gap-3 px-4 py-3 hover:bg-secondary text-foreground transition-colors" onClick={() => setMenuOpen(false)}>
                        <Map className="w-4 h-4 text-primary" /> My Trips
                      </Link>
                      <Link href="/favorites" className="flex items-center gap-3 px-4 py-3 hover:bg-secondary text-foreground transition-colors" onClick={() => setMenuOpen(false)}>
                        <Heart className="w-4 h-4 text-accent" /> Favorites
                      </Link>
                      <div className="h-px bg-border my-1"></div>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 text-destructive transition-colors text-left">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
