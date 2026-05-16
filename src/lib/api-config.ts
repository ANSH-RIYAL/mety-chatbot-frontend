/**
 * API Configuration
 * Base URLs for backend API and prediction API
 */

export const API_CONFIG = {
  BACKEND_BASE_URL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8000",
  PREDICTION_API_URL: import.meta.env.VITE_PREDICTION_API_URL || "https://ml-prediction-api-mety-172415469528.us-central1.run.app/prediction_model_test/",
} as const;

console.log("[API CONFIG] Backend URL:", API_CONFIG.BACKEND_BASE_URL);
console.log("[API CONFIG] Prediction API URL:", API_CONFIG.PREDICTION_API_URL);