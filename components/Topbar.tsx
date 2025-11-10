'use client';

import { Search, Monitor, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

interface TopbarProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}

export function Topbar({ onMenuClick, onSearchClick }: TopbarProps) {
  return (
    <header role="banner" className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center gap-4">
        <button
          onClick={onSearchClick}
          className={cn(
            "flex-1 max-w-md hidden sm:flex items-center gap-2",
            "h-10 px-4 rounded-md border border-input bg-muted/50",
            "text-sm text-muted-foreground",
            "hover:bg-muted transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
          aria-label="Ouvrir la recherche globale"
        >
          <Search className="h-4 w-4" />
          <span>Rechercher...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSearchClick}
          className="sm:hidden"
          aria-label="Ouvrir la recherche"
        >
          <Search className="h-5 w-5" />
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Monitor className="h-5 w-5 text-muted-foreground hidden sm:block" aria-label="Indicateur de thème système" />
        </div>
      </div>
    </header>
  );
}
