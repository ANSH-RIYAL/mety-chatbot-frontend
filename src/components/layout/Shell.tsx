import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Leaf, Activity, NotebookPen, ChevronDown, MessageCircle, Settings, Trash2 } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { LifespanCard } from "@/components/dashboard/LifespanCard";
import { useStore } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ShellProps {
  children: React.ReactNode;
  showChat?: boolean;
  showNav?: boolean;
}

export function Shell({ children, showChat = true, showNav = true }: ShellProps) {
  const [location, setLocation] = useLocation();
  const { userId } = useStore();
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  const [panelTab, setPanelTab] = useState<"chat" | "projections">("chat");
  const [projectionsRecalcNonce, setProjectionsRecalcNonce] = useState(0);
  const [autoApply, setAutoApply] = useState(false);
  const [autoApplyRecommended, setAutoApplyRecommended] = useState(false);
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
  const [clearChatNonce, setClearChatNonce] = useState(0);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close chat settings on outside click / Escape
  useEffect(() => {
    if (!isChatSettingsOpen) return;

    const onMouseDown = (e: MouseEvent) => {
      const el = settingsRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setIsChatSettingsOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsChatSettingsOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isChatSettingsOpen]);

  const navItems = [
    { href: "/plan", label: "My Plan", icon: Leaf },
    { href: "/log", label: "Log", icon: NotebookPen },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="border-b bg-white h-14 sticky top-0 z-10">
        <div className="h-14 w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity">
            <Activity className="h-6 w-6" />
            <span>Mety Chatbot</span>
          </Link>
          
          {userId && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground max-w-[260px] truncate">
                User ID: <span className="font-mono text-foreground">{userId}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const ok = confirm("Switch user? This will clear your saved session on this browser.");
                  if (!ok) return;
                  try {
                    localStorage.removeItem("mety-chatbot-storage");
                  } catch (e) {
                    // ignore
                  }
                  setLocation("/");
                  window.location.reload();
                }}
              >
                Switch user
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden h-[calc(100vh-3.5rem)]">
        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Navigation Tabs */}
          {showNav && userId && (
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
            <div className="fixed z-20 bottom-4 right-4">
              <Button
                size="icon"
                onClick={() => setIsChatCollapsed(false)}
                variant="default"
                className="h-12 w-12 rounded-full shadow-lg"
                title="Open Chat"
                aria-label="Open Chat"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div
              className={[
                "fixed z-20 flex flex-col overflow-hidden",
                "bg-white",
                "shadow-xl ring-1 ring-black/10 border border-black/5",
                "bottom-4 right-4 w-[calc(100vw-2rem)] max-w-[520px] h-[72vh] rounded-2xl",
                "lg:w-[420px] lg:h-[72vh]",
              ].join(" ")}
            >
              <div className="px-4 py-3 border-b border-black/5 bg-white">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-wrap">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate leading-tight">Mety Assistant</div>
                      <div className="text-[11px] text-muted-foreground leading-tight">Chat & projections</div>
                    </div>

                    {/* Underline tabs */}
                    <div className="ml-2 flex items-end gap-4">
                      <button
                        type="button"
                        onClick={() => setPanelTab("chat")}
                        className={[
                          "text-sm font-medium pb-2 border-b-2 transition-colors",
                          panelTab === "chat"
                            ? "text-foreground border-primary"
                            : "text-muted-foreground border-transparent hover:text-foreground",
                        ].join(" ")}
                      >
                        Chat
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPanelTab("projections");
                          setProjectionsRecalcNonce((n) => n + 1);
                        }}
                        className={[
                          "text-sm font-medium pb-2 border-b-2 transition-colors",
                          panelTab === "projections"
                            ? "text-foreground border-primary"
                            : "text-muted-foreground border-transparent hover:text-foreground",
                        ].join(" ")}
                      >
                        Projections
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Settings */}
                    <div className="relative" ref={settingsRef}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsChatSettingsOpen((v) => !v)}
                        aria-label="Chat settings"
                        title="Settings"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>

                      {isChatSettingsOpen && (
                        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-black/5 bg-white shadow-xl ring-1 ring-black/5 p-3 space-y-3 z-50">
                          <div className="text-xs font-semibold text-muted-foreground">Settings</div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="auto-apply"
                                checked={autoApply}
                                onCheckedChange={(c) => setAutoApply(!!c)}
                              />
                              <Label htmlFor="auto-apply" className="text-xs cursor-pointer select-none">
                                Auto-apply extracted variables
                              </Label>
                            </div>

                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="auto-apply-recommended"
                                checked={autoApplyRecommended}
                                onCheckedChange={(c) => setAutoApplyRecommended(!!c)}
                              />
                              <Label htmlFor="auto-apply-recommended" className="text-xs cursor-pointer select-none">
                                Auto-apply recommended plan
                              </Label>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-black/5">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                const ok = confirm("Clear all chat history? This cannot be undone.");
                                if (!ok) return;
                                setIsChatSettingsOpen(false);
                                setClearChatNonce((n) => n + 1);
                              }}
                              disabled={!userId}
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Clear history
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsChatCollapsed(true)}
                      className="h-6 w-6 p-0"
                      aria-label="Collapse panel"
                      title="Collapse"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-hidden">
                {panelTab === "chat" ? (
                  <ChatPanel
                    autoApply={autoApply}
                    autoApplyRecommended={autoApplyRecommended}
                    clearChatNonce={clearChatNonce}
                  />
                ) : (
                  <div className="h-full overflow-y-auto p-3">
                    <div className="rounded-2xl bg-white border border-black/5 shadow-sm p-3">
                      <LifespanCard embedded recalculateNonce={projectionsRecalcNonce} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
