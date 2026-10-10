import React, { useState, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import IronNestSidebar from '../components/inventory/IronNestSidebar';
import IronNestHeader from '../components/inventory/IronNestHeader';
import DribbbleMobileNav from '../components/navigation/DribbbleMobileNav';

export default function IronNestLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('digitech_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Touch & Pointer swipe gesture support for WhatsApp-style tab navigation on mobile
  const swipeStartPos = useRef({ x: 0, y: 0, time: 0 });
  const isSwiping = useRef(false);

  const handleTouchStart = (e) => {
    if (window.innerWidth >= 1024) return;
    swipeStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
    isSwiping.current = true;
  };

  const handleTouchEnd = (e) => {
    if (window.innerWidth >= 1024 || !isSwiping.current) return;
    isSwiping.current = false;
    const deltaX = e.changedTouches[0].clientX - swipeStartPos.current.x;
    const deltaY = e.changedTouches[0].clientY - swipeStartPos.current.y;
    const duration = Date.now() - swipeStartPos.current.time;

    // Detect intentional horizontal swipe (distance > 45px, predominantly horizontal, quick flick)
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && duration < 600) {
      window.dispatchEvent(
        new CustomEvent('app:swipe-tab', {
          detail: { direction: deltaX < 0 ? 'next' : 'prev' }
        })
      );
    }
  };

  const handlePointerDown = (e) => {
    if (window.innerWidth >= 1024) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    swipeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
    isSwiping.current = true;
  };

  const handlePointerUp = (e) => {
    if (window.innerWidth >= 1024 || !isSwiping.current) return;
    isSwiping.current = false;
    const deltaX = e.clientX - swipeStartPos.current.x;
    const deltaY = e.clientY - swipeStartPos.current.y;
    const duration = Date.now() - swipeStartPos.current.time;

    if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && duration < 600) {
      window.dispatchEvent(
        new CustomEvent('app:swipe-tab', {
          detail: { direction: deltaX < 0 ? 'next' : 'prev' }
        })
      );
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('digitech_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 selection:bg-[var(--primary-color)] selection:text-white transition-colors duration-200">
      {/* 1. Left Sidebar Navigation matching Dribbble collapsible dock (Desktop) */}
      <IronNestSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* 2. Main Content Area with Smooth Margin Transition */}
      <div className={`flex-1 flex flex-col ${isCollapsed ? 'lg:ml-[92px]' : 'lg:ml-[272px]'} min-h-screen w-full transition-[margin] duration-300 ease-in-out`}>
        {/* Top Search & Utilities Bar */}
        <IronNestHeader
          onToggleSidebar={() => setIsSidebarOpen(true)}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
        />

        {/* Dynamic Page Content with Mobile-Safe Bottom Padding for Floating Capsule Nav */}
        <main
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="flex-1 px-2.5 sm:px-6 lg:px-8 pb-28 lg:pb-12 pt-1 sm:pt-2 max-w-[1780px] 2xl:max-w-[1920px] w-full mx-auto"
        >
          <Outlet context={{ searchTerm }} />
        </main>
      </div>

      {/* 3. Mobile Bottom Floating Capsule Navbar */}
      <DribbbleMobileNav />
    </div>
  );
}
