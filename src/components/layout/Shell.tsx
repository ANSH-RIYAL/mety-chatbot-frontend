import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Leaf, Activity, NotebookPen, ChevronDown, ChevronUp } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { LifespanCard } from "@/components/dashboard/LifespanCard";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ShellProps {
  children: React.ReactNode;
  showChat?: boolean;
}

export function Shell({ children, showChat = true }: ShellProps) {
  const [location] = useLocation();
  const { userId } = useStore();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  const navItems = [
    { href: "/plan", label: "My Plan", icon: Leaf },
    { href: "/log", label: "Log", icon: NotebookPen },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="border-b bg-white h-14 flex items-center px-6 justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity">
          <Activity className="h-6 w-6" />
          <span>Mety Chatbot</span>
        </Link>
        
        {userId && (
          <div className="text-sm text-muted-foreground">
            User ID: <span className="font-mono text-foreground">{userId}</span>
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden h-[calc(100vh-3.5rem)]">
        {/* Main Content */}
        <main className={`flex-1 flex flex-col overflow-hidden ${showChat && userId && !isChatCollapsed ? 'pr-[350px]' : ''}`}>
          {/* Navigation Tabs */}
          {userId && (
            <div className="border-b bg-muted/30 px-6 py-2 flex gap-1">
              {navItems.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Chat Panel (Fixed Position) */}
      {showChat && userId && (
        <>
          {isChatCollapsed ? (
            <div className="fixed right-0 bottom-0 w-[350px] border-l border-t bg-white z-20 shadow-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatCollapsed(false)}
                className="w-full rounded-none"
              >
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Chat
              </Button>
            </div>
          ) : (
            <div className="fixed right-0 top-14 bottom-0 w-[350px] border-l bg-white flex flex-col overflow-hidden z-20 shadow-lg">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Chat & Projections</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChatCollapsed(true)}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <LifespanCard />
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatPanel />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

