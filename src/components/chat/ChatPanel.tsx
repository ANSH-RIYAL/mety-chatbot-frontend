import { useState, useEffect, useRef } from "react";
import { useStore, loadPlans } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import * as api from "@/lib/api";
import type { ChatAction } from "@/lib/api-types";
import type { PlanVariables } from "@/lib/constants";
import { UNITS, isPredictionApiVariable } from "@/lib/constants";

export function ChatPanel({
  autoApply,
  autoApplyRecommended,
  clearChatNonce,
}: {
  autoApply: boolean;
  autoApplyRecommended: boolean;
  clearChatNonce: number;
}) {
  const { userId, chatHistory, addChatMessage, setLoading, setError, setChatHistory } = useStore();
  const [input, setInput] = useState("");
  const [pendingAction, setPendingAction] = useState<ChatAction | null>(null);
  const [suggestedPlans, setSuggestedPlans] = useState<Map<string, Partial<PlanVariables>>>(new Map());
  const [suggestedProjections, setSuggestedProjections] = useState<Map<string, any>>(new Map());
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter chat history to only show messages for current user
  const userChatHistory = chatHistory.filter(m => m.user_id === userId);

  // Clear chat when parent requests it
  useEffect(() => {
    if (!userId) return;
    if (clearChatNonce <= 0) return;

    const run = async () => {
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

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearChatNonce]);

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
        const newTargetPlan: Partial<PlanVariables> = { ...targetPlan, ...response.suggested_plan };
        
        // Update frontend state immediately (visible side)
        setPlans({
          currentPlan: useStore.getState().currentPlan,
          targetPlan: newTargetPlan,
          optimalPlan: useStore.getState().optimalPlan,
        });
        
        // Step 2: Then save to backend
        try {
          // Filter to only non-zero values for the diff
          const targetDiff: Partial<PlanVariables> = {};
          (Object.keys(newTargetPlan) as (keyof PlanVariables)[]).forEach((key) => {
            const val = newTargetPlan[key];
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

  return (
    <div className="flex flex-col h-full bg-muted/5">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-3">
        <div className="space-y-4">
          {/* Static first message */}
          {userChatHistory.length === 0 && (
            <div className="space-y-2">
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm bg-white border border-border text-foreground">
                  <div className="flex items-center gap-1 mb-1 text-xs font-bold text-primary opacity-70">
                    <Sparkles className="h-3 w-3" />
                    mety-bot
                  </div>
                  Hi — how can I help you today?
                </div>
              </div>
            </div>
          )}
          {userChatHistory.map((msg, i
