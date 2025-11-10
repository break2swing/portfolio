'use client';

import { useState } from 'react';
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
  LogIn,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { serviceLogger } from '@/lib/logger';

const logger = serviceLogger.child('mobile-sidebar');

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

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie', {
        description: 'Vous avez été déconnecté',
      });
      onOpenChange(false);
    } catch (error) {
      logger.error('Logout failed', error as Error);
      toast.error('Erreur', {
        description: 'Échec de la déconnexion',
      });
    }
  };

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className="w-64 p-0"
        aria-label="Menu de navigation mobile"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>

        <div className="flex h-[calc(100%-4rem)] flex-col">
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navigation principale">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  aria-current={isActive ? 'page' : undefined}
                  prefetch={true}
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                      'hover:bg-accent/50 active:bg-accent',
                      isActive && 'bg-foreground text-background font-medium',
                      !isActive && 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t px-3 py-3 space-y-1">
            {user && (
              <>
                <Link
                  href="/admin/photos"
                  onClick={handleNavClick}
                  aria-current={pathname === '/admin/photos' ? 'page' : undefined}
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                      'hover:bg-accent/50 active:bg-accent',
                      pathname === '/admin/photos' && 'bg-foreground text-background font-medium',
                      pathname !== '/admin/photos' && 'text-muted-foreground'
                    )}
                  >
                    <Image className="h-5 w-5 flex-shrink-0" />
                    <span>Admin Photo</span>
                  </div>
                </Link>
                <Link
                  href="/admin/music"
                  onClick={handleNavClick}
                  aria-current={pathname === '/admin/music' ? 'page' : undefined}
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                      'hover:bg-accent/50 active:bg-accent',
                      pathname === '/admin/music' && 'bg-foreground text-background font-medium',
                      pathname !== '/admin/music' && 'text-muted-foreground'
                    )}
                  >
                    <Music className="h-5 w-5 flex-shrink-0" />
                    <span>Admin Audio</span>
                  </div>
                </Link>
                <Link
                  href="/admin/videos"
                  onClick={handleNavClick}
                  aria-current={pathname === '/admin/videos' ? 'page' : undefined}
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                      'hover:bg-accent/50 active:bg-accent',
                      pathname === '/admin/videos' && 'bg-foreground text-background font-medium',
                      pathname !== '/admin/videos' && 'text-muted-foreground'
                    )}
                  >
                    <Video className="h-5 w-5 flex-shrink-0" />
                    <span>Admin Vidéo</span>
                  </div>
                </Link>
                <Link
                  href="/admin/texts"
                  onClick={handleNavClick}
                  aria-current={pathname === '/admin/texts' ? 'page' : undefined}
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                      'hover:bg-accent/50 active:bg-accent',
                      pathname === '/admin/texts' && 'bg-foreground text-background font-medium',
                      pathname !== '/admin/texts' && 'text-muted-foreground'
                    )}
                  >
                    <FileText className="h-5 w-5 flex-shrink-0" />
                    <span>Admin Texte</span>
                  </div>
                </Link>
              </>
            )}

            <Link
              href="/parametres"
              onClick={handleNavClick}
              aria-current={pathname === '/parametres' ? 'page' : undefined}
            >
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                  'hover:bg-accent/50 active:bg-accent',
                  pathname === '/parametres' && 'bg-foreground text-background font-medium',
                  pathname !== '/parametres' && 'text-muted-foreground'
                )}
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                <span>Paramètres</span>
              </div>
            </Link>

            {user ? (
              <button
                onClick={handleLogout}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                  'hover:bg-accent/50 active:bg-accent text-muted-foreground'
                )}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span>Déconnexion</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={handleNavClick}
                aria-current={pathname === '/login' ? 'page' : undefined}
              >
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                    'hover:bg-accent/50 active:bg-accent',
                    pathname === '/login' && 'bg-foreground text-background font-medium',
                    pathname !== '/login' && 'text-muted-foreground'
                  )}
                >
                  <LogIn className="h-5 w-5 flex-shrink-0" />
                  <span>Connexion</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
