import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { BackgroundGlow } from '../common/BackgroundGlow';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { ToastProvider } from '../../context/ToastContext';
import { ToastContainer } from '../common/ToastContainer';
import { useAppStore } from '../../store/useAppStore';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dataError = useAppStore((state) => state.dataError);

  return (
    <div data-app-shell className="relative flex h-screen w-full bg-slate-50 dark:bg-slate-950 font-['Inter',sans-serif] text-slate-900 dark:text-slate-100 overflow-hidden transition-colors selection:bg-blue-500/20 selection:text-blue-600 dark:selection:text-blue-300">
      <BackgroundGlow />
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 z-10 relative">
        <Navbar />
        <main className="studentos-content flex-1 px-3.5 sm:px-5 lg:px-6 2xl:px-7 pb-20 md:pb-8 overflow-y-auto custom-scrollbar min-w-0">
          <div className="w-full min-w-0 space-y-6">
            {dataError && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">Data could not be loaded: {dataError}</div>}
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
      <GlobalSearchModal />
      <ToastContainer />
    </div>
  );
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <ToastProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </ToastProvider>
  );
};
