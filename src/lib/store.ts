/**
 * Global state store with API integration
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlanVariables, UserProfile } from "./constants";
import type { ChatHistoryMessage, LifespanPredictResponse } from "./api-types";
import * as api from "./api";
import { OPTIMAL_PLAN } from "./constants";

interface AppState {
  // User ID
  userId: string | null;
  setUserId: (id: string) => void;
  
  // Profile
  profile: Partial<UserProfile>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  
  // Plans
  currentPlan: Partial<PlanVariables>;
  targetPlan: Partial<PlanVariables>;
  optimalPlan: Partial<PlanVariables>;
  setPlans: (plans: {
    currentPlan: Partial<PlanVariables>;
    targetPlan: Partial<PlanVariables>;
    optimalPlan: Partial<PlanVariables>;
  }) => void;
  
  // Plan operations
  updateTargetPlan: (diff: Partial<PlanVariables>) => Promise<void>;
  resetTargetToOptimal: () => void;
  
  // Predictions
  lifespanProjection: Partial<LifespanPredictResponse> | null;
  setLifespanProjection: (projection: Partial<LifespanPredictResponse> | null) => void;
  
  // Chat
  chatHistory: ChatHistoryMessage[];
  setChatHistory: (history: ChatHistoryMessage[]) => void;
  addChatMessage: (role: "user" | "assistant", text: string) => void;
  
  // Latest chat response data (for applying to target plan)
  latestDiffDetected: Partial<PlanVariables> | null;
  latestSuggestedPlan: Partial<PlanVariables> | null;
  setLatestChatResponse: (diffDetected: Partial<PlanVariables> | null, suggestedPlan: Partial<PlanVariables> | null) => void;
  
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Error
  error: string | null;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: null,
      setUserId: (id) => {
        const currentUserId = get().userId;
        
        // If switching to a different user, clear chat history and profile
        if (currentUserId && currentUserId !== id) {
          set({ 
            chatHistory: [],
            profile: {},
            currentPlan: {},
            targetPlan: {},
            lifespanProjection: null,
          });
        }
        
        set({ userId: id });
        
        // Load plans when user ID is set
        if (id) {
          loadPlans(id);
          // TODO: Load chat history from backend when endpoint is available
          // For now, chat history starts empty for each user
        }
      },
      
      profile: {},
      updateProfile: (profile) => set((state) => ({ 
        profile: { ...state.profile, ...profile } 
      })),
      
      currentPlan: {},
      targetPlan: {},
      optimalPlan: OPTIMAL_PLAN,
      setPlans: (plans) => set(plans),
      
      updateTargetPlan: async (diff) => {
        const userId = get().userId;
        if (!userId) {
          console.error("[STORE] Cannot update plan: no user ID");
          return;
        }
        
        try {
          set({ isLoading: true, error: null });
          const response = await api.updatePlan({ user_id: userId, diff });
          set((state) => ({
            targetPlan: { ...state.targetPlan, ...response.new_target_plan },
            isLoading: false,
          }));
        } catch (error) {
          console.error("[STORE] Failed to update plan:", error);
          set({ 
            error: error instanceof Error ? error.message : "Failed to update plan",
            isLoading: false 
          });
        }
      },
      
      resetTargetToOptimal: () => {
        const optimal = get().optimalPlan;
        set({ targetPlan: { ...optimal } });
      },
      
      lifespanProjection: null,
      setLifespanProjection: (projection) => set({ lifespanProjection: projection }),
      
      chatHistory: [],
      setChatHistory: (history) => set({ chatHistory: history }),
      addChatMessage: (role, text) => {
        const userId = get().userId;
        if (!userId) return;
        
        const message: ChatHistoryMessage = {
          user_id: userId,
          role,
          text,
          timestamp: new Date().toISOString(),
        };
        
        set((state) => {
          // Filter chat history to only include messages for current user
          const userMessages = state.chatHistory.filter(m => m.user_id === userId);
          return {
            chatHistory: [...userMessages, message],
          };
        });
      },
      
      latestDiffDetected: null,
      latestSuggestedPlan: null,
      setLatestChatResponse: (diffDetected, suggestedPlan) => set({
        latestDiffDetected: diffDetected,
        latestSuggestedPlan: suggestedPlan,
      }),
      
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      
      error: null,
      setError: (error) => set({ error }),
    }),
    {
      name: "mety-chatbot-storage",
      partialize: (state) => ({
        userId: state.userId,
        profile: state.profile,
        targetPlan: state.targetPlan,
        // Only persist chat history for current user
        chatHistory: state.chatHistory.filter(m => m.user_id === state.userId),
      }),
    }
  )
);

// Helper function to load plans (called when userId is set)
export async function loadPlans(userId: string) {
  try {
    useStore.getState().setLoading(true);
    useStore.getState().setError(null);
    const response = await api.getPlan(userId);
    
    // Get profile to ensure age and gender are in plans
    const profile = useStore.getState().profile;
    
    // Ensure age and gender are always in current_plan and target_plan
    const currentPlan: any = { ...(response.current_plan || {}) };
    const targetPlan: any = { ...(response.target_plan || {}) };
    
    // Add age and gender from profile if they exist and aren't already in plans
    if (profile?.age !== undefined && currentPlan.age === undefined) {
      currentPlan.age = profile.age;
    }
    if (profile?.gender !== undefined && currentPlan.gender === undefined) {
      currentPlan.gender = profile.gender;
    }
    if (profile?.age !== undefined && targetPlan.age === undefined) {
      targetPlan.age = profile.age;
    }
    if (profile?.gender !== undefined && targetPlan.gender === undefined) {
      targetPlan.gender = profile.gender;
    }
    
    useStore.getState().setPlans({
      currentPlan,
      targetPlan,
      optimalPlan: response.optimal_plan || OPTIMAL_PLAN,
    });
    useStore.getState().setLoading(false);
  } catch (error) {
    console.error("[STORE] Failed to load plans:", error);
    useStore.getState().setError(
      error instanceof Error ? error.message : "Failed to load plans"
    );
    useStore.getState().setLoading(false);
  }
}

