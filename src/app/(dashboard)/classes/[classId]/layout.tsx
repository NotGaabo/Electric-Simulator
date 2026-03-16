'use client'

import { useEffect, useState } from 'react'
import AppHeader from '@/components/base/header/appHeader'
import AppSidebar from '@/components/base/aside/Appsidebar'

export default function ClassLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ classId: string }> | { classId: string }
}) {
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 20% -20%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(6,182,212,0.05) 0%, transparent 60%)',
      }}
    >
      <AppHeader onMenuToggle={() => setShowSidebar((p) => !p)} />

      <div className="flex">
        {/* Mobile overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-16 left-0 z-[45] transition-transform duration-300
            lg:static lg:top-auto lg:translate-x-0
            ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <AppSidebar activeItem="tareas" />
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}