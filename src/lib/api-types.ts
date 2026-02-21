/**
 * API Types matching backend responses exactly
 * Based on backend_routes.md
 */

import { PlanVariables, UserProfile } from "./constants";

// POST /onboarding/submit
export interface OnboardingSubmitRequest {
  user_id: string;
  page: "About Me" | "My Supplements" | "My Diet" | "My Exercise";
  payload: Partial<UserProfile> | Partial<PlanVariables>;
  // timestamp is optional - backend generates it
}

export interface OnboardingSubmitResponse {
  ok: boolean;
  saved_doc: string;
}

// GET /plan/get?user_id=<id>
export interface GetPlanResponse {
  user_id: string;
  profile?: Partial<UserProfile>;
  current_plan: Partial<PlanVariables>;
  target_plan: Partial<PlanVariables>;
  optimal_plan: Partial<PlanVariables>;
  last_updated: string;
}

// POST /plan/update
export interface UpdatePlanRequest {
  user_id: string;
  diff: Partial<PlanVariables>;
  // timestamp is optional
}

export interface UpdatePlanResponse {
  ok: boolean;
  new_target_plan: Partial<PlanVariables>;
  applied_diff: Partial<PlanVariables>;
}

// POST /log/submit
export interface LogSubmitRequest {
  user_id: string;
  log: Partial<PlanVariables>;
  period_start: string; // YYYY-MM-DD
  period_end: string; // YYYY-MM-DD
}

export interface LogSubmitResponse {
  ok: boolean;
  log_id: string;
  adherence: {
    total: number;
    diet: number;
    supplement: number;
  };
}

// POST /lifespan/predict (backend endpoint)
export interface LifespanPredictRequest {
  user_id: string;
  input: Partial<PlanVariables> & {
    age: number;
    gender: number;
  };
}

export interface LifespanPredictResponse {
  all_cause_mortality_predicted_lifespan: number;
  cancer_predicted_rr: number;
  cardio_vascular_disease_predicted_rr: number;
  depression_predicted_rr: number;
  diabetes_predicted_rr: number;
  stroke_predicted_rr: number;
}

// Direct prediction API call (from frontend)
export interface DirectPredictionRequest {
  [key: string]: number; // Only variables with values, no defaults
}

// POST /chat
// Backend receives only latest message (string), not messages array
export interface ChatRequest {
  user_id: string;
  message: string; // Only the latest message
  options: {
    auto_apply_extracted_vars: boolean;
  };
  // timestamp is optional
}

export interface ChatAction {
  type: "ask_apply_change";
  payload: Partial<PlanVariables>;
}

export interface ChatResponse {
  assistant_message: string;
  suggested_plan?: Partial<PlanVariables>;
  diff_detected?: Partial<PlanVariables>;
  vars_extracted?: Partial<PlanVariables>;
  unknown_keys?: string[]; // Variables mentioned but not in canonical schema
  lifespan_projection?: Partial<LifespanPredictResponse>;
  actions?: ChatAction[];
}

// GET /user/vars?user_id=<id>
export interface GetUserVarsResponse {
  user_id: string;
  vars_extracted: Partial<PlanVariables>;
  target_plan: Partial<PlanVariables>;
}

// Chat history message (from Firestore/local copy)
export interface ChatHistoryMessage {
  user_id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

