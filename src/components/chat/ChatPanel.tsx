import { useState, useEffect, useRef } from "react";
import { useStore, loadPlans } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import * as api from "@/lib/api";
import type { ChatAction } from "@/lib/api-types";
import type { PlanVariables } from "@/lib/constants";
import { UNITS, isPredictionApiVariable } from "@/lib/constants";

export function ChatPanel() {
  const { userId, chatHistory, addChatMessage, setLoading, setError, setChatHistory } = useStore();
  const [input, setInput] = useState("");
  const [autoApply, setAutoApply] = useState(false);
  const [autoApplyRecommended, setAutoApplyRecommended] = useState(false);
  const [pendingAction, setPendingAction] = useState<ChatAction | null>(null);
  const [suggestedPlans, setSuggestedPlans] = useState<Map<string, Partial<PlanVariables>>>(new Map());
  const [suggestedProjections, setSuggestedProjections] = useState<Map<string, any>>(new Map());
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter chat history to only show messages for current user
  const userChatHistory = chatHistory.filter(m => m.user_id === userId);

  // Filter chat history when userId changes
  useEffect(() => {
    if (userId) {
      const filtered = chatHistory.filter(m => m.user_id === userId);
      if (filtered.length !== chatHistory.length) {
        setChatHistory(filtered);
      }
    } else {
      setChatHistory([]);
    }
  }, [userId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [userChatHistory]);

  const handleSend = async () => {
    if (!input.trim() || !userId) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to local history immediately
    addChatMessage("user", userMessage);

    try {
      setLoading(true);
      setError(null);

      // Send only the latest message to backend
      const response = await api.sendChatMessage({
        user_id: userId,
        message: userMessage,
        options: {
          auto_apply_extracted_vars: autoApply,
        },
      });

      // Add assistant message to history
      addChatMessage("assistant", response.assistant_message);

      // Store latest chat response data in store (for plan page buttons)
      const { setLatestChatResponse, targetPlan, currentPlan } = useStore.getState();
      setLatestChatResponse(
        response.diff_detected || null,
        response.suggested_plan || null
      );

      // Store suggested plan if available (for display after message)
      // suggested_plan is diffs, so combine with (target + current) to show full plan
      // Also store the projection if available
      if (response.suggested_plan && Object.keys(response.suggested_plan).length > 0) {
        // Combine target + current, then apply suggested diffs to get full suggested plan
        const combined = { ...currentPlan, ...targetPlan };
        const fullSuggestedPlan = { ...combined, ...response.suggested_plan };

        setSuggestedPlans((prev) => {
          const newMap = new Map(prev);
          newMap.set(response.assistant_message, fullSuggestedPlan);
          return newMap;
        });
      }

      // Store projection inline with suggested plan (don't update main projections tab)
      if (response.lifespan_projection && response.assistant_message) {
        setSuggestedProjections((prev) => {
          const newMap = new Map(prev);
          newMap.set(response.assistant_message, response.lifespan_projection);
          return newMap;
        });
      }

      // Don't update main projections tab from chatbot - projections shown inline with suggested plan
      // if (response.lifespan_projection) {
      //   setLifespanProjection(response.lifespan_projection);
      // }

      // Handle actions (ask_apply_change)
      if (response.actions && response.actions.length > 0 && !autoApply) {
        setPendingAction(response.actions[0]);
      } else {
        setPendingAction(null);
      }

      // If auto-apply was used, update both frontend state AND backend
      // This ensures backend has the latest target plan for next message
      if (autoApply && response.diff_detected && Object.keys(response.diff_detected).length > 0) {
        // Step 1: Update frontend state (visible UI) first
        const { targetPlan, setPlans } = useStore.getState();
        const newTargetPlan = { ...targetPlan, ...response.diff_detected };

        // Update frontend state immediately (visible side)
        setPlans({
          currentPlan: useStore.getState().currentPlan,
          targetPlan: newTargetPlan,
          optimalPlan: useStore.getState().optimalPlan,
        });

        // Step 2: Then save to backend
        try {
          await api.updatePlan({
            user_id: userId!,
            diff: response.diff_detected,
          });

          console.log("[CHAT] Auto-applied extracted variables to frontend and backend:", response.diff_detected);
        } catch (error) {
          console.error("[CHAT] Failed to update backend target plan:", error);
          // Continue anyway - frontend state is updated
        }
      }

      // Auto-apply suggested plan if enabled (separate from extracted variables)
      if (autoApplyRecommended && response.suggested_plan && Object.keys(response.suggested_plan).length > 0) {
        // Step 1: Update frontend state (visible UI) first
        // suggested_plan is already diffs, so just apply to target plan
        const { targetPlan, setPlans } = useStore.getState();
        const newTargetPlan = { ...targetPlan, ...response.suggested_plan };

        // Update frontend state immediately (visible side)
        setPlans({
          currentPlan: useStore.getState().currentPlan,
          targetPlan: newTargetPlan,
          optimalPlan: useStore.getState().optimalPlan,
        });

        // Step 2: Then save to backend
        try {
          // Filter to only non-zero values for the diff
          const targetDiff: Record<string, number> = {};
          Object.keys(newTargetPlan).forEach((key) => {
            const val = newTargetPlan[key as keyof typeof newTargetPlan];
            if (val !== undefined && val !== null && val !== 0) {
              targetDiff[key] = Number(val);
            }
          });

          await api.updatePlan({
            user_id: userId!,
            diff: targetDiff,
          });

          console.log("[CHAT] Auto-applied recommended plan to frontend and backend:", targetDiff);
        } catch (error) {
          console.error("[CHAT] Failed to update backend target plan:", error);
          // Continue anyway - frontend state is updated
        }
      }

      // Show extracted variables if any
      if (response.vars_extracted && Object.keys(response.vars_extracted).length > 0) {
        console.log("[CHAT] Extracted variables:", response.vars_extracted);
      }

      // Show unknown keys if any
      if (response.unknown_keys && response.unknown_keys.length > 0) {
        console.log("[CHAT] Unknown keys:", response.unknown_keys);
      }
    } catch (error) {
      console.error("[CHAT] Failed to send message:", error);
      setError(error instanceof Error ? error.message : "Failed to send message");
      addChatMessage("assistant", "Sorry, I encountered an error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChange = async () => {
    if (!pendingAction || !userId) return;

    try {
      setLoading(true);
      await api.updatePlan({
        user_id: userId,
        diff: pendingAction.payload,
      });
      await loadPlans(userId);
      setPendingAction(null);
    } catch (error) {
      console.error("[CHAT] Failed to apply change:", error);
      alert("Failed to apply change. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!userId) return;

    if (!confirm("Are you sure you want to clear all chat history? This cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      await api.clearChatHistory(userId);
      setChatHistory([]);
      setPendingAction(null);
      setSuggestedPlans(new Map());
      setSuggestedProjections(new Map());
      setExpandedPlans(new Set());
    } catch (error) {
      console.error("[CHAT] Failed to clear history:", error);
      alert("Failed to clear chat history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/5">
      <div className="p-3 border-b bg-white space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-apply"
              checked={autoApply}
              onCheckedChange={(c) => setAutoApply(!!c)}
            />
            <Label htmlFor="auto-apply" className="text-xs cursor-pointer select-none text-muted-foreground">
              Auto-apply extracted variables
            </Label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            disabled={!userId || userChatHistory.length === 0}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear History
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="auto-apply-recommended"
            checked={autoApplyRecommended}
            onCheckedChange={(c) => setAutoApplyRecommended(!!c)}
          />
          <Label htmlFor="auto-apply-recommended" className="text-xs cursor-pointer select-none text-muted-foreground">
            Auto-apply recommended plan
          </Label>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Static first message */}
          {userChatHistory.length === 0 && (
            <div className="space-y-2">
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-4 py-3 text-sm bg-white border shadow-sm text-foreground">
                  <div className="flex items-center gap-1 mb-1 text-xs font-bold text-primary opacity-70">
                    <Sparkles className="h-3 w-3" />
                    mety-bot
                  </div>
                  Hi how can I help you today?
                </div>
              </div>
            </div>
          )}
          {userChatHistory.map((msg, i) => {
            const isAssistant = msg.role === "assistant";
            // Use message text as key to find suggested plan
            const messageKey = isAssistant ? msg.text : undefined;
            const suggestedPlan = messageKey ? suggestedPlans.get(messageKey) : undefined;
            const isExpanded = messageKey ? expandedPlans.has(messageKey) : false;

            return (
              <div key={i} className="space-y-2">
                <div
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white border shadow-sm text-foreground"
                      }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1 mb-1 text-xs font-bold text-primary opacity-70">
                        <Sparkles className="h-3 w-3" />
                        mety-bot
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>

                {/* Suggested Plan Dropdown */}
                {isAssistant && suggestedPlan && Object.keys(suggestedPlan).length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-muted/30 border rounded-lg overflow-hidden">
                      <button
                        onClick={() => {
                          if (!messageKey) return;
                          setExpandedPlans((prev) => {
                            const newSet = new Set(prev);
                            if (isExpanded) {
                              newSet.delete(messageKey);
                            } else {
                              newSet.add(messageKey);
                            }
                            return newSet;
                          });
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/50 flex items-center justify-between"
                      >
                        <span>View Suggested Plan</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-4 py-3 border-t bg-white max-h-96 overflow-y-auto space-y-4">
                          {/* Projections inline */}
                          {suggestedProjections.has(messageKey!) && (() => {
                            const projection = suggestedProjections.get(messageKey!);
                            const lifespan = projection?.all_cause_mortality_predicted_lifespan;
                            const risks = projection ? [
                              { label: "Cancer", rr: projection.cancer_predicted_rr },
                              { label: "Cardiovascular", rr: projection.cardio_vascular_disease_predicted_rr },
                              { label: "Diabetes", rr: projection.diabetes_predicted_rr },
                              { label: "Stroke", rr: projection.stroke_predicted_rr },
                            ] : [];

                            return (
                              <div className="pb-3 border-b">
                                <div className="text-xs font-semibold text-muted-foreground mb-2">Projections</div>
                                {lifespan !== undefined && lifespan !== null ? (
                                  <>
                                    <div className="text-lg font-bold text-primary">
                                      {lifespan.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">years</span>
                                    </div>
                                    <div className="space-y-1 mt-2">
                                      {risks.map((risk) => {
                                        if (risk.rr === undefined) return null;
                                        const percent = ((risk.rr - 1) * 100).toFixed(0);
                                        return (
                                          <div key={risk.label} className="flex justify-between text-xs">
                                            <span>{risk.label} Risk</span>
                                            <span className={`font-medium ${Number(percent) < 0 ? "text-emerald-600" : "text-red-600"}`}>
                                              {percent}%
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs text-muted-foreground">Calculating...</div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Suggested Plan Values */}
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-2">Suggested Values</div>
                            <div className="space-y-1 text-xs">
                              {Object.entries(suggestedPlan)
                                .filter(([key, value]) => {
                                  // Only show non-zero values and prediction API variables
                                  return value !== null && value !== undefined && value !== 0 &&
                                    isPredictionApiVariable(key as any);
                                })
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([key, value]) => (
                                  <div key={key} className="flex justify-between items-center py-1">
                                    <span className="text-muted-foreground capitalize">
                                      {key.replace(/_/g, " ")}
                                    </span>
                                    <span className="font-mono font-medium ml-4">
                                      {typeof value === 'number'
                                        ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                        : String(value)} {UNITS[key as keyof typeof UNITS] || ''}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {pendingAction && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">
                Apply this change?
              </p>
              <div className="text-xs text-muted-foreground mb-3">
                {Object.entries(pendingAction.payload).map(([key, value]) => (
                  <div key={key}>
                    {key.replace(/_/g, " ")}: {value}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleApplyChange}>
                  Apply
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPendingAction(null)}>
                  Ignore
                </Button>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={!userId}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || !userId}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

