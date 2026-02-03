import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, Tv } from 'lucide-react';
import { DiscordMobileMenu } from './DiscordMobileMenu';

export const DiscordHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/50 md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="w-10 h-10 rounded-xl bg-secondary/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 touch-target"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Tv className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-display font-bold">
              Otaku<span className="text-primary">DB</span>
            </span>
          </Link>

          {/* Search Button */}
          <Link 
            to="/search" 
            className="w-10 h-10 rounded-xl bg-secondary/70 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 touch-target"
            aria-label="Rechercher"
          >
            <Search className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <DiscordMobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};
