'use client';

import { Search, Monitor, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
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
        <form className="flex-1 max-w-md hidden sm:block" role="search" aria-label="Recherche globale">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-9 w-full bg-muted/50 border-0 focus-visible:ring-1"
              disabled
              aria-label="Rechercher dans le site"
            />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Monitor className="h-5 w-5 text-muted-foreground hidden sm:block" aria-label="Indicateur de thème système" />
        </div>
      </div>
    </header>
  );
}
