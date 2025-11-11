'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar } from '@/components/MobileSidebar';
import { Topbar } from '@/components/Topbar';
import { SkipToContent } from '@/components/SkipToContent';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

// Lazy load GlobalSearch (modal, chargé seulement quand nécessaire)
const GlobalSearch = dynamic(() => import('@/components/GlobalSearch').then(mod => ({ default: mod.GlobalSearch })), {
  loading: () => null, // Pas de loading state visible pour un modal
  ssr: false,
});

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { isOpen: searchOpen, openSearch, closeSearch } = useGlobalSearch();

  useEffect(() => {
    setIsClient(true);

    const stored = localStorage.getItem('sidebarExpanded');
    const isExpanded = stored === null || stored === 'true';
    setSidebarWidth(isExpanded ? 256 : 64);

    const handleStorage = () => {
      const stored = localStorage.getItem('sidebarExpanded');
      const isExpanded = stored === null || stored === 'true';
      setSidebarWidth(isExpanded ? 256 : 64);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('sidebar-toggle', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sidebar-toggle', handleStorage);
    };
  }, []);

  return (
    <>
      <SkipToContent />
      <div className="flex h-screen overflow-hidden">
        <Sidebar onToggle={(expanded) => setSidebarWidth(expanded ? 256 : 64)} />
        <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
        <GlobalSearch open={searchOpen} onOpenChange={closeSearch} />
        <div
          className="flex flex-1 flex-col overflow-hidden transition-all duration-300 lg:ml-0"
          style={{ marginLeft: isClient && window.innerWidth >= 1024 ? `${sidebarWidth}px` : '0' }}
        >
          <Topbar onMenuClick={() => setMobileMenuOpen(true)} onSearchClick={openSearch} />
          <main
            id="main-content"
            tabIndex={-1}
            role="main"
            aria-label="Contenu principal"
            className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background focus:outline-none"
          >
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
