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
      <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 border-l border-zinc-800/50">
          <UpdateBanner />
          <TopBar />
          <main className="flex-1 overflow-y-auto bg-zinc-950">{children}</main>
          <StatusBar />
        </div>
        <CommandPalette />
        <NotificationCenter />
      </div>
    </ErrorBoundary>
  );
}
