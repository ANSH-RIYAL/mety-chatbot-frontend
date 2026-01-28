/**
 * API service functions
 * All backend API calls
 */

import { API_CONFIG } from "./api-config";
import type {
  OnboardingSubmitRequest,
  OnboardingSubmitResponse,
  GetPlanResponse,
  UpdatePlanRequest,
  UpdatePlanResponse,
  LogSubmitRequest,
  LogSubmitResponse,
  LifespanPredictRequest,
  LifespanPredictResponse,
  ChatRequest,
  ChatResponse,
  GetUserVarsResponse,
  DirectPredictionRequest,
} from "./api-types";

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.BACKEND_BASE_URL}${endpoint}`;
  console.log(`[API] ${options.method || "GET"} ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API ERROR] ${response.status}: ${errorText}`);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[API SUCCESS] ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`[API EXCEPTION] ${endpoint}:`, error);
    throw error;
  }
}

// Health check
export async function healthCheck(): Promise<{ status: string; service: string }> {
  return apiCall("/health");
}

// Onboarding
export async function submitOnboarding(
  request: OnboardingSubmitRequest
): Promise<OnboardingSubmitResponse> {
  return apiCall("/onboarding/submit", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Plan operations
export async function getPlan(userId: string): Promise<GetPlanResponse> {
  return apiCall(`/plan/get?user_id=${encodeURIComponent(userId)}`);
}

export async function updatePlan(
  request: UpdatePlanRequest
): Promise<UpdatePlanResponse> {
  return apiCall("/plan/update", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Log operations
export async function submitLog(
  request: LogSubmitRequest
): Promise<LogSubmitResponse> {
  return apiCall("/log/submit", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Lifespan prediction (backend endpoint)
export async function predictLifespan(
  request: LifespanPredictRequest
): Promise<LifespanPredictResponse> {
  return apiCall("/lifespan/predict", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Direct prediction API call (from frontend)
export async function directPredictLifespan(
  input: DirectPredictionRequest
): Promise<LifespanPredictResponse> {
  const url = API_CONFIG.PREDICTION_API_URL;
  console.log(`[PREDICTION API] POST ${url}`, input);
  
  // Create AbortController for timeout (120 seconds - API can be slow)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PREDICTION API ERROR] ${response.status}: ${errorText}`);
      throw new Error(`Prediction API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[PREDICTION API SUCCESS]:`, data);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[PREDICTION API TIMEOUT] Request took longer than 120 seconds`);
      throw new Error("Prediction API request timed out. The API may be slow or unavailable. Please try again.");
    }
    console.error(`[PREDICTION API EXCEPTION]:`, error);
    throw error;
  }
}

// Chat
export async function sendChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  return apiCall("/chat", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// User vars
export async function getUserVars(userId: string): Promise<GetUserVarsResponse> {
  return apiCall(`/user/vars?user_id=${encodeURIComponent(userId)}`);
}

// Apply target plan to current plan
export async function applyTargetToCurrent(userId: string): Promise<{ ok: boolean }> {
  return apiCall(`/plan/apply-target-to-current?user_id=${encodeURIComponent(userId)}`, {
    method: "POST",
  });
}

// Clear chat history
export async function clearChatHistory(userId: string): Promise<{ ok: boolean }> {
  return apiCall(`/chat/clear?user_id=${encodeURIComponent(userId)}`, {
    method: "POST",
  });
}

