/**
 * Constants and variable definitions
 * All 42 variables supported by backend (prediction API works on 28)
 */

export interface UserProfile {
  name: string;
  age: number;
  gender: number; // 0=male, 1=female
}

// All 42 variables supported by backend
export interface PlanVariables {
  // Supplements (18)
  multi_vitamins: number; // 0/1
  dietary_fiber: number; // g/day
  protein_supplements: number; // g/day
  magnesium: number; // mg/day
  vitamin_a: number; // mcg/day
  vitamin_k: number; // mcg/day
  vitamin_d: number; // IU/day
  folic_acid: number; // mcg/day
  vitamin_b6: number; // mg/day
  vitamin_b12: number; // mcg/day
  vitamin_e: number; // mg/day
  zinc: number; // mg/day
  calcium: number; // mg/day
  iron: number; // mg/day
  olive_oil: number; // g/day
  fish_oil_omega_3: number; // g/day
  green_tea: number; // ml/day
  vitamin_c: number; // mg/day
  
  // Diet (11)
  alcohol: number; // drinks/week
  dairy: number; // servings/day
  grain_refined: number; // servings/day
  grain_unrefined: number; // servings/day
  fruits_and_veggies: number; // servings/day
  legumes: number; // servings/day
  meat_processed: number; // servings/week
  meat_unprocessed: number; // servings/week
  meat_poultry: number; // servings/week
  refined_sugar: number; // g/day
  artificial_sweetener: number; // mg/day
  
  // Exercise & Lifestyle (10)
  cardio: number; // MET-Hr/week
  strength_training: number; // min/week
  sauna_duration: number; // mins/session
  sauna_frequency: number; // times/week
  water: number; // ml/day
  calorie_restriction: number; // 0/1
  fat_trans: number; // g/day
  sleep_duration: number; // hours/day
}

// Variables supported by prediction API (28 of 42)
// These are the ones that actually affect predictions
export const PREDICTION_API_VARIABLES = new Set([
  "alcohol", "calorie_restriction", "cardio", "dairy", "dietary_fiber",
  "fat_trans", "fish_oil_omega_3", "fruits_and_veggies", "gender",
  "grain_refined", "grain_unrefined", "green_tea", "legumes",
  "meat_poultry", "meat_processed", "meat_unprocessed", "multi_vitamins",
  "olive_oil", "refined_sugar", "artificial_sweetener", "sauna_duration",
  "sauna_frequency", "sleep_duration", "strength_training",
  "vitamin_e", "water", "age"
  // Note: smoking_status, smoking_frequency, sleep_quality, stress_quality removed
]);

export const OPTIMAL_PLAN: PlanVariables = {
  // Prediction API variables (30)
  alcohol: 0,
  artificial_sweetener: 0,
  calcium: 0,
  calorie_restriction: 1,
  cardio: 35.4955,
  dairy: 3.7126,
  dietary_fiber: 60,
  fat_trans: 0,
  fish_oil_omega_3: 1.8869,
  fruits_and_veggies: 8.4319,
  grain_refined: 0,
  grain_unrefined: 2.8861,
  green_tea: 1116.753,
  legumes: 6.0511,
  meat_poultry: 0,
  meat_processed: 0,
  meat_unprocessed: 0,
  multi_vitamins: 1,
  olive_oil: 50,
  refined_sugar: 0,
  sauna_duration: 38.2,
  sauna_frequency: 3.034,
  sleep_duration: 7,
  strength_training: 96.4597,
  vitamin_e: 1000,
  water: 1901.2292,
  // Additional variables for feature extraction (not in prediction API)
  protein_supplements: 0,
  magnesium: 0,
  vitamin_a: 0,
  vitamin_k: 0,
  vitamin_d: 0,
  folic_acid: 0,
  vitamin_b6: 0,
  vitamin_b12: 0,
  zinc: 0,
  iron: 0,
  vitamin_c: 0,
};

export const VARIABLE_GROUPS = {
  supplements: [
    'multi_vitamins', 'dietary_fiber', 'protein_supplements', 'magnesium', 
    'vitamin_a', 'vitamin_k', 'vitamin_d', 'folic_acid', 'vitamin_b6', 
    'vitamin_b12', 'vitamin_e', 'zinc', 'calcium', 'iron', 'olive_oil', 
    'fish_oil_omega_3', 'green_tea', 'vitamin_c'
  ] as const,
  diet: [
    'alcohol', 'dairy', 'grain_refined', 'grain_unrefined', 'fruits_and_veggies', 
    'legumes', 'meat_processed', 'meat_unprocessed', 'meat_poultry', 
    'refined_sugar', 'artificial_sweetener', 'calorie_restriction', 'fat_trans'
  ] as const,
  exercise: [
    'cardio', 'strength_training', 'sauna_duration', 'sauna_frequency', 'water',
    'sleep_duration'
  ] as const
};

export const UNITS: Record<keyof PlanVariables, string> = {
  alcohol: 'drinks/week',
  calorie_restriction: 'Yes/No',
  dairy: 'servings/day',
  fat_trans: 'g/day',
  grain_refined: 'servings/day',
  grain_unrefined: 'servings/day',
  legumes: 'servings/day',
  meat_processed: 'servings/week',
  meat_unprocessed: 'servings/week',
  meat_poultry: 'servings/week',
  fruits_and_veggies: 'servings/day',
  water: 'ml/day',
  refined_sugar: 'g/day',
  artificial_sweetener: 'mg/day',
  cardio: 'MET-Hr/week',
  strength_training: 'min/week',
  sleep_duration: 'hours/day',
  sauna_duration: 'mins/session',
  sauna_frequency: 'times/week',
  multi_vitamins: 'Yes/No',
  dietary_fiber: 'g/day',
  protein_supplements: 'g/day',
  magnesium: 'mg/day',
  vitamin_a: 'mcg/day',
  vitamin_k: 'mcg/day',
  vitamin_d: 'IU/day',
  folic_acid: 'mcg/day',
  vitamin_b6: 'mg/day',
  vitamin_b12: 'mcg/day',
  vitamin_e: 'mg/day',
  zinc: 'mg/day',
  calcium: 'mg/day',
  iron: 'mg/day',
  olive_oil: 'g/day',
  fish_oil_omega_3: 'g/day',
  green_tea: 'ml/day',
  vitamin_c: 'mg/day',
};

export type VariableKey = keyof PlanVariables;

// Categorical variables with their options
export const CATEGORICAL_VARIABLES: Record<string, { label: string; value: number }[]> = {
  calorie_restriction: [
    { label: "No", value: 0 },
    { label: "Yes", value: 1 },
  ],
  multi_vitamins: [
    { label: "No", value: 0 },
    { label: "Yes", value: 1 },
  ],
};

// Check if variable is categorical
export function isCategoricalVariable(key: VariableKey): boolean {
  return key in CATEGORICAL_VARIABLES;
}

// Check if variable is supported by prediction API
export function isPredictionApiVariable(key: VariableKey): boolean {
  return PREDICTION_API_VARIABLES.has(key);
}

