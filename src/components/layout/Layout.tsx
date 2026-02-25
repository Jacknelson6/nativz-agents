import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "./Sidebar";
import TopBar from "./TopBar";
import StatusBar from "./StatusBar";
import CommandPalette from "./CommandPalette";
import NotificationCenter from "./NotificationCenter";
import UpdateBanner from "./UpdateBanner";
import ErrorBoundary from "../chat/ErrorBoundary";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <SidebarProvider defaultOpen={typeof window !== "undefined" && window.innerWidth >= 768}>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex flex-col min-w-0">
            <UpdateBanner />
            <TopBar />
            <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
            <StatusBar />
          </SidebarInset>
        </div>
        <CommandPalette />
        <NotificationCenter />
      </SidebarProvider>
    </ErrorBoundary>
  );
}
