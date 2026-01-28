/**
 * API Configuration
 * Base URLs for backend API and prediction API
 */

export const API_CONFIG = {
  // Backend API base URL (FastAPI)
  BACKEND_BASE_URL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8000",
  
  // Prediction API URL (direct connection from frontend)
  PREDICTION_API_URL: import.meta.env.VITE_PREDICTION_API_URL || "https://mlmodel.myyouthspan.com/prediction_model_test/",
} as const;

console.log("[API CONFIG] Backend URL:", API_CONFIG.BACKEND_BASE_URL);
console.log("[API CONFIG] Prediction API URL:", API_CONFIG.PREDICTION_API_URL);

