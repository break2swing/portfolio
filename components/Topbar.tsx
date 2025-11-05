'use client';

import { Search, Monitor } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      <div className="flex flex-1 items-center gap-4">
        <form className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-9 w-full bg-muted/50 border-0 focus-visible:ring-1"
              disabled
            />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Monitor className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
