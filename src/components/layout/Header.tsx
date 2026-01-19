import { Link } from 'react-router-dom';
import { Tv, Search } from 'lucide-react';

export const Header = () => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Tv className="w-4 h-4 text-primary" />
          </div>
          <span className="text-lg font-display font-bold text-foreground">
            Otaku<span className="text-primary">DB</span>
          </span>
        </Link>
        
        <Link 
          to="/search" 
          className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
};
