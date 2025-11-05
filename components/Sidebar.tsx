'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Music,
  Image,
  Video,
  FileText,
  AppWindow,
  Info,
  Mail,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const mainNavItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Accueil' },
  { href: '/musique', icon: Music, label: 'Musique' },
  { href: '/photos', icon: Image, label: 'Photos' },
  { href: '/videos', icon: Video, label: 'Vidéos' },
  { href: '/textes', icon: FileText, label: 'Textes' },
  { href: '/applications', icon: AppWindow, label: 'Applications' },
  { href: '/a-propos', icon: Info, label: 'À propos' },
  { href: '/contact', icon: Mail, label: 'Contact' },
];

interface SidebarProps {
  onToggle?: (expanded: boolean) => void;
}

export function Sidebar({ onToggle }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('sidebarExpanded');
    if (stored !== null) {
      setIsExpanded(stored === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('sidebarExpanded', String(newState));
    onToggle?.(newState);
    window.dispatchEvent(new Event('sidebar-toggle'));
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300',
        isExpanded ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(!isExpanded && 'mx-auto')}
          >
            {isExpanded ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    'hover:bg-accent/50',
                    isActive && 'bg-foreground text-background font-medium',
                    !isActive && 'text-muted-foreground',
                    !isExpanded && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isExpanded && <span>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t px-3 py-2">
          <Link href="/parametres">
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                'hover:bg-accent/50',
                pathname === '/parametres' && 'bg-foreground text-background font-medium',
                pathname !== '/parametres' && 'text-muted-foreground',
                !isExpanded && 'justify-center px-2'
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {isExpanded && <span>Paramètres</span>}
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
