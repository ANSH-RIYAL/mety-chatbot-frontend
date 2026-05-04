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
  const {
    userId,
    chatAutoApplyExtractedVars,
    chatAutoApplyRecommendedPlan,
    setChatAutoApplyExtractedVars,
    setChatAutoApplyRecommendedPlan,
  } = useStore();
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  const [panelTab, setPanelTab] = useState<"chat" | "projections">("chat");
  const [projectionsRecalcNonce, setProjectionsRecalcNonce] = useState(0);
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
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 h-14 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="h-14 w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-85 transition-opacity">
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
            <div className="flex gap-2 border-b border-border/70 bg-muted/40 px-6 py-2">
              {navItems.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25" 
                        : "text-muted-foreground hover:bg-background hover:text-foreground"
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
                className="h-12 w-12 rounded-full shadow-lg shadow-primary/25 ring-2 ring-primary/15"
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
                "border border-border bg-card/95 shadow-lg shadow-black/[0.06] backdrop-blur-md",
                "bottom-4 right-4 h-[72vh] w-[calc(100vw-2rem)] max-w-[520px] rounded-2xl",
                "lg:h-[72vh] lg:w-[420px]",
              ].join(" ")}
            >
              <div className="border-b border-border/70 bg-muted/20 px-4 py-3">
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
                        className="h-9 w-9"
                        onClick={() => setIsChatSettingsOpen((v) => !v)}
                        aria-label="Chat settings"
                        title="Settings"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>

                      {isChatSettingsOpen && (
                        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-popover p-3 shadow-lg">
                          <div className="text-xs font-semibold text-muted-foreground">Chat</div>
                          <div className="mt-3 space-y-3">
                            <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-2.5">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="chat-auto-apply-vars"
                                  checked={chatAutoApplyExtractedVars}
                                  onCheckedChange={(checked) => setChatAutoApplyExtractedVars(!!checked)}
                                />
                                <Label
                                  htmlFor="chat-auto-apply-vars"
                                  className="text-xs cursor-pointer text-foreground/90 select-none"
                                >
                                  Auto-apply extracted variables
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="chat-auto-apply-recommended"
                                  checked={chatAutoApplyRecommendedPlan}
                                  onCheckedChange={(checked) => setChatAutoApplyRecommendedPlan(!!checked)}
                                />
                                <Label
                                  htmlFor="chat-auto-apply-recommended"
                                  className="text-xs cursor-pointer text-foreground/90 select-none"
                                >
                                  Auto-apply recommended plan
                                </Label>
                              </div>
                            </div>
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
                      size="icon"
                      onClick={() => setIsChatCollapsed(true)}
                      className="h-9 w-9"
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
                    autoApply={chatAutoApplyExtractedVars}
                    autoApplyRecommended={chatAutoApplyRecommendedPlan}
                    clearChatNonce={clearChatNonce}
                  />
                ) : (
                  <div className="h-full overflow-y-auto p-3">
                    <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-sm">
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
