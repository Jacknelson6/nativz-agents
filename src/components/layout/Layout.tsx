import Sidebar from './Sidebar';
import TopBar from './TopBar';
import StatusBar from './StatusBar';
import CommandPalette from './CommandPalette';
import NotificationCenter from './NotificationCenter';
import UpdateBanner from './UpdateBanner';
import ErrorBoundary from '../chat/ErrorBoundary';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-black text-white overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <UpdateBanner />
          <TopBar />
          <main className="flex-1 overflow-y-auto">{children}</main>
          <StatusBar />
        </div>
        <CommandPalette />
        <NotificationCenter />
      </div>
    </ErrorBoundary>
  );
}
