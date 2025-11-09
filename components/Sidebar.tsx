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
  Shield,
  LogIn,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const mainNavItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Accueil' },
  { href: '/musique', icon: Music, label: 'Audio' },
  { href: '/photos', icon: Image, label: 'Photo' },
  { href: '/videos', icon: Video, label: 'Vidéo' },
  { href: '/textes', icon: FileText, label: 'Texte' },
  { href: '/applications', icon: AppWindow, label: 'Application' },
  { href: '/a-propos', icon: Info, label: 'À propos' },
  { href: '/contact', icon: Mail, label: 'Contact' },
];

interface SidebarProps {
  onToggle?: (expanded: boolean) => void;
}

export function Sidebar({ onToggle }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

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

  const handleLogout = async () => {
    await signOut();
    toast.success('Déconnexion réussie', {
      description: 'Vous avez été déconnecté',
    });
  };

  return (
    <aside
      role="navigation"
      aria-label="Menu principal"
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
            aria-label={isExpanded ? 'Réduire le menu' : 'Étendre le menu'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Navigation principale">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                aria-label={!isExpanded ? item.label : undefined}
              >
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

        <div className="mt-auto border-t px-3 py-2 space-y-1">
          {user && (
            <>
              <Link
                href="/admin/photos"
                aria-current={pathname === '/admin/photos' ? 'page' : undefined}
                aria-label={!isExpanded ? 'Admin Photo' : undefined}
              >
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    'hover:bg-accent/50',
                    pathname === '/admin/photos' && 'bg-foreground text-background font-medium',
                    pathname !== '/admin/photos' && 'text-muted-foreground',
                    !isExpanded && 'justify-center px-2'
                  )}
                >
                  <Image className="h-5 w-5 flex-shrink-0" />
                  {isExpanded && <span>Admin Photo</span>}
                </div>
              </Link>
              <Link
                href="/admin/music"
                aria-current={pathname === '/admin/music' ? 'page' : undefined}
                aria-label={!isExpanded ? 'Admin Audio' : undefined}
              >
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    'hover:bg-accent/50',
                    pathname === '/admin/music' && 'bg-foreground text-background font-medium',
                    pathname !== '/admin/music' && 'text-muted-foreground',
                    !isExpanded && 'justify-center px-2'
                  )}
                >
                  <Music className="h-5 w-5 flex-shrink-0" />
                  {isExpanded && <span>Admin Audio</span>}
                </div>
              </Link>
              <Link
                href="/admin/videos"
                aria-current={pathname === '/admin/videos' ? 'page' : undefined}
                aria-label={!isExpanded ? 'Admin Vidéo' : undefined}
              >
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    'hover:bg-accent/50',
                    pathname === '/admin/videos' && 'bg-foreground text-background font-medium',
                    pathname !== '/admin/videos' && 'text-muted-foreground',
                    !isExpanded && 'justify-center px-2'
                  )}
                >
                  <Video className="h-5 w-5 flex-shrink-0" />
                  {isExpanded && <span>Admin Vidéo</span>}
                </div>
              </Link>
              <Link
                href="/admin/texts"
                aria-current={pathname === '/admin/texts' ? 'page' : undefined}
                aria-label={!isExpanded ? 'Admin Texte' : undefined}
              >
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    'hover:bg-accent/50',
                    pathname === '/admin/texts' && 'bg-foreground text-background font-medium',
                    pathname !== '/admin/texts' && 'text-muted-foreground',
                    !isExpanded && 'justify-center px-2'
                  )}
                >
                  <FileText className="h-5 w-5 flex-shrink-0" />
                  {isExpanded && <span>Admin Texte</span>}
                </div>
              </Link>
            </>
          )}

          <Link
            href="/parametres"
            aria-current={pathname === '/parametres' ? 'page' : undefined}
            aria-label={!isExpanded ? 'Paramètres' : undefined}
          >
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

          {user ? (
            <button
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                'hover:bg-accent/50 text-muted-foreground',
                !isExpanded && 'justify-center px-2'
              )}
              aria-label={!isExpanded ? 'Déconnexion' : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {isExpanded && <span>Déconnexion</span>}
            </button>
          ) : (
            <Link
              href="/login"
              aria-current={pathname === '/login' ? 'page' : undefined}
              aria-label={!isExpanded ? 'Connexion' : undefined}
            >
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  'hover:bg-accent/50',
                  pathname === '/login' && 'bg-foreground text-background font-medium',
                  pathname !== '/login' && 'text-muted-foreground',
                  !isExpanded && 'justify-center px-2'
                )}
              >
                <LogIn className="h-5 w-5 flex-shrink-0" />
                {isExpanded && <span>Connexion</span>}
              </div>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
