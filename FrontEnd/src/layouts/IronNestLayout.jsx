import React, { useState } from 'react';
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
      <div className={`flex-1 flex flex-col ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} min-h-screen w-full transition-[margin] duration-300 ease-in-out`}>
        {/* Top Search & Utilities Bar */}
        <IronNestHeader
          onToggleSidebar={() => setIsSidebarOpen(true)}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
        />

        {/* Dynamic Page Content with Mobile-Safe Bottom Padding for Floating Capsule Nav */}
        <main className="flex-1 px-2.5 sm:px-6 lg:px-8 pb-28 lg:pb-12 pt-1 sm:pt-2 max-w-[1780px] 2xl:max-w-[1920px] w-full mx-auto">
          <Outlet context={{ searchTerm }} />
        </main>
      </div>

      {/* 3. Mobile Bottom Floating Capsule Navbar */}
      <DribbbleMobileNav />
    </div>
  );
}
