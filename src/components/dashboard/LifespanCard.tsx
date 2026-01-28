import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeartPulse, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import * as api from "@/lib/api";

export function LifespanCard() {
  const { lifespanProjection, setLifespanProjection, userId } = useStore();

  const handleRecalculate = async () => {
    if (!userId) return;

    try {
      // Set loading state - show "-" during calculation
      setLifespanProjection({ _loading: true } as any);

      // Reload plans from backend first to ensure we have latest values
      const { loadPlans } = await import("@/lib/store");
      await loadPlans(userId);

      // Get latest plans from store (after reload)
      const { targetPlan: latestTarget, currentPlan: latestCurrent, profile: latestProfile } = useStore.getState();

      // Build prediction input: target plan (diffs) + current plan (for missing values)
      // Target plan only contains diffs, so we fill missing with current plan
      const predictionInput: Record<string, number> = {};

      const predictionVars = [
        "alcohol", "calorie_restriction", "cardio", "dairy", "dietary_fiber",
        "fat_trans", "fish_oil_omega_3", "fruits_and_veggies", "gender",
        "grain_refined", "grain_unrefined", "green_tea", "legumes",
        "meat_poultry", "meat_processed", "meat_unprocessed", "multi_vitamins",
        "olive_oil", "refined_sugar", "artificial_sweetener", "sauna_duration",
        "sauna_frequency", "sleep_duration", "strength_training",
        "vitamin_e", "water", "age"
      ];

      // Start with current plan values (base)
      predictionVars.forEach((key) => {
        const currentVal = latestCurrent[key as keyof typeof latestCurrent];
        if (currentVal !== undefined && currentVal !== null && currentVal !== 0 && !isNaN(Number(currentVal))) {
          predictionInput[key] = Number(currentVal);
        }
      });

      // Overlay target plan values (diffs) - these override current plan
      // Only include non-zero values from target plan
      Object.entries(latestTarget).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 0 && !isNaN(Number(value))) {
          if (predictionVars.includes(key)) {
            predictionInput[key] = Number(value);
          }
        }
      });

      // Handle age and gender - check target first, then current, then profile
      if (!predictionInput.age) {
        const targetAge = (latestTarget as any).age;
        const currentAge = (latestCurrent as any).age;
        if (targetAge !== undefined && targetAge !== null && targetAge !== 0) {
          predictionInput.age = Number(targetAge);
        } else if (currentAge !== undefined && currentAge !== null && currentAge !== 0) {
          predictionInput.age = Number(currentAge);
        } else if (latestProfile?.age) {
          predictionInput.age = latestProfile.age;
        } else {
          alert("Age is required for predictions. Please complete the 'About Me' onboarding step.");
          setLifespanProjection(null);
          return;
        }
      }

      if (!predictionInput.gender && predictionInput.gender !== 0) {
        const targetGender = (latestTarget as any).gender;
        const currentGender = (latestCurrent as any).gender;
        if (targetGender !== undefined && targetGender !== null) {
          predictionInput.gender = Number(targetGender);
        } else if (currentGender !== undefined && currentGender !== null) {
          predictionInput.gender = Number(currentGender);
        } else if (latestProfile?.gender !== undefined) {
          predictionInput.gender = latestProfile.gender;
        } else {
          alert("Gender is required for predictions. Please complete the 'About Me' onboarding step.");
          setLifespanProjection(null);
          return;
        }
      }

      // Check if we have minimum required variables (age and gender)
      if (!predictionInput.age || (predictionInput.gender === undefined && predictionInput.gender !== 0)) {
        alert("Please set age and gender in your plan before calculating predictions.");
        setLifespanProjection(null);
        return;
      }

      console.log("[LIFESPAN CARD] Sending prediction input:", predictionInput);
      const projection = await api.directPredictLifespan(predictionInput);
      setLifespanProjection(projection);
    } catch (error) {
      console.error("[LIFESPAN CARD] Failed to recalculate:", error);
      alert("Failed to calculate predictions. Please try again.");
      // Restore previous projection on error
      const { lifespanProjection: prev } = useStore.getState();
      if (!prev || !(prev as any)._loading) {
        setLifespanProjection(prev);
      }
    }
  };

  const projection = lifespanProjection;
  const isLoading = (projection as any)?._loading === true;
  const lifespan = projection?.all_cause_mortality_predicted_lifespan;
  const risks = projection && !isLoading ? [
    { label: "Cancer", rr: projection.cancer_predicted_rr },
    { label: "Cardiovascular", rr: projection.cardio_vascular_disease_predicted_rr },
    { label: "Diabetes", rr: projection.diabetes_predicted_rr },
    { label: "Stroke", rr: projection.stroke_predicted_rr },
  ] : [];

  // Always show structure - use "-" during loading or if no projection yet
  const hasProjection = projection && !isLoading && lifespan !== undefined && lifespan !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
          <HeartPulse className="h-4 w-4 text-primary" />
          Projections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Always show structure - use "-" during loading */}
        <div>
          <div className="text-3xl font-bold text-primary tracking-tight">
            {hasProjection ? (
              <>
                {lifespan!.toFixed(1)} <span className="text-base font-normal text-muted-foreground">years</span>
              </>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Predicted all-cause mortality lifespan
          </p>
        </div>

        <div className="space-y-2 pt-2">
          {hasProjection && risks.length > 0 ? (
            risks.map((risk) => {
              if (risk.rr === undefined) return null;
              const percent = ((risk.rr - 1) * 100).toFixed(0);
              return (
                <div key={risk.label} className="flex items-center justify-between text-sm">
                  <span>{risk.label} Risk</span>
                  <span className={`font-bold ${Number(percent) < 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {percent}%
                  </span>
                </div>
              );
            })
          ) : (
            // Show placeholders for risks during loading or when no projection
            ["Cancer", "Cardiovascular", "Diabetes", "Stroke"].map((label) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span>{label} Risk</span>
                <span className="text-muted-foreground">-</span>
              </div>
            ))
          )}
        </div>

        <Button className="w-full" size="sm" variant="outline" onClick={handleRecalculate}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Recalculate
        </Button>
      </CardContent>
    </Card>
  );
}

