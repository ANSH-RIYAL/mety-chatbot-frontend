import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeartPulse, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";

export function LifespanCard({
  embedded = false,
  recalculateNonce = 0,
}: {
  embedded?: boolean;
  recalculateNonce?: number;
}) {
  const { lifespanProjection, setLifespanProjection, userId } = useStore();

  const handleRecalculate = async () => {
    if (!userId) return;

    try {
      setLifespanProjection({ _loading: true } as any);
      
      const { loadPlans } = await import("@/lib/store");
      await loadPlans(userId);
      
      const { targetPlan: latestTarget, currentPlan: latestCurrent, profile: latestProfile } = useStore.getState();
      
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
      
      predictionVars.forEach((key) => {
        const currentVal = latestCurrent[key as keyof typeof latestCurrent];
        if (currentVal !== undefined && currentVal !== null && currentVal !== 0 && !isNaN(Number(currentVal))) {
          predictionInput[key] = Number(currentVal);
        }
      });
      
      Object.entries(latestTarget).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 0 && !isNaN(Number(value))) {
          if (predictionVars.includes(key)) {
            predictionInput[key] = Number(value);
          }
        }
      });
      
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
      const { lifespanProjection: prev } = useStore.getState();
      if (!prev || !(prev as any)?._loading) {
        setLifespanProjection(prev);
      }
    }
  };

  // Recalculate projections when requested by parent (e.g. opening the Projections tab)
  useEffect(() => {
    if (!recalculateNonce) return;
    handleRecalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recalculateNonce]);

  const projection = lifespanProjection;
  const isLoading = (projection as any)?._loading === true;
  const lifespan = projection?.all_cause_mortality_predicted_lifespan;
  const risks = projection && !isLoading ? [
    { label: "Cancer", rr: projection.cancer_predicted_rr },
    { label: "Cardiovascular", rr: projection.cardio_vascular_disease_predicted_rr },
    { label: "Diabetes", rr: projection.diabetes_predicted_rr },
    { label: "Stroke", rr: projection.stroke_predicted_rr },
  ] : [];

  const hasProjection = projection && !isLoading && lifespan !== undefined && lifespan !== null;

  return (
    <Card className={cn(embedded && "border-0 shadow-none bg-transparent")}>
      <CardHeader className={cn(embedded ? "p-0 pb-2" : "p-4 pb-2")}>
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
          <HeartPulse className="h-4 w-4 text-primary" />
          Projections
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(embedded ? "p-0 pt-0 space-y-3" : "p-4 pt-0 space-y-3")}>
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

        <div className="space-y-2 pt-1">
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
