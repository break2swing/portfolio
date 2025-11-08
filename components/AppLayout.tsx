'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { SkipToContent } from '@/components/SkipToContent';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(256);

  useEffect(() => {
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
        <div
          className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
          style={{ marginLeft: `${sidebarWidth}px` }}
        >
          <Topbar />
          <main
            id="main-content"
            tabIndex={-1}
            role="main"
            aria-label="Contenu principal"
            className="flex-1 overflow-y-auto p-6 bg-background focus:outline-none"
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
