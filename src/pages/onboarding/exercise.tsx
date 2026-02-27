import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import * as api from "@/lib/api";
import { VARIABLE_GROUPS, UNITS, CATEGORICAL_VARIABLES, isCategoricalVariable, isPredictionApiVariable, VariableKey } from "@/lib/constants";

export default function MyExercise() {
  const [, setLocation] = useLocation();
  const { userId, setLoading, setError } = useStore();
  
  const { register, handleSubmit, setValue, watch, reset } = useForm<Record<string, number>>({
    defaultValues: {}
  });

  // Fetch existing data when component mounts
  useEffect(() => {
    if (!userId) return;
    
    const loadExistingData = async () => {
      try {
        const response = await api.getPlan(userId);
        if (response.current_plan) {
          const exerciseKeys = VARIABLE_GROUPS.exercise.filter(key => 
            isPredictionApiVariable(key as VariableKey)
          );
          const exerciseData: Record<string, number> = {};
          exerciseKeys.forEach((key) => {
            const value = response.current_plan[key as keyof typeof response.current_plan];
            if (value !== undefined && value !== null) {
              exerciseData[key] = Number(value);
            }
          });
          reset(exerciseData);
        }
      } catch (error) {
        console.error("[EXERCISE] Failed to load existing data:", error);
      }
    };
    
    loadExistingData();
  }, [userId, reset]);

  const onSubmit = async (data: any) => {
    if (!userId) {
      alert("No user ID found.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payload: Record<string, number> = {};
      VARIABLE_GROUPS.exercise
        .filter(key => isPredictionApiVariable(key as VariableKey))
        .forEach((key) => {
          const keyStr = key as string;
          const value = data[keyStr];
          if (value !== undefined && value !== null && value !== "") {
            payload[keyStr] = Number(value);
          }
        });

      await api.submitOnboarding({
        user_id: userId,
        page: "My Exercise",
        payload,
      });

      // Final step - go to plan page
      setLocation("/plan");
    } catch (error) {
      console.error("[EXERCISE] Failed to submit:", error);
      setError(error instanceof Error ? error.message : "Failed to submit");
      alert("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingWrapper
      title="My Exercise"
      description="Tell us about your exercise habits."
      currentStep={4}
      totalSteps={4}
      onNext={handleSubmit(onSubmit)}
    >
      <div className="grid gap-4">
        {VARIABLE_GROUPS.exercise
          .filter(key => isPredictionApiVariable(key as VariableKey))
          .map((key) => {
          const keyStr = key as string;
          if (isCategoricalVariable(keyStr as any)) {
            const options = CATEGORICAL_VARIABLES[keyStr];
            const watched = watch(keyStr as any);
            const selectValue =
              watched === undefined || watched === null
                ? undefined
                : String(watched);
            return (
              <div key={keyStr} className="grid gap-2">
                <Label htmlFor={keyStr}>
                  {keyStr.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Label>
                <Select
                  value={selectValue}
                  onValueChange={(v) =>
                    setValue(keyStr as any, parseInt(v, 10), { shouldDirty: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${keyStr.replace(/_/g, " ")}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }
          return (
            <div key={keyStr} className="grid gap-2">
              <Label htmlFor={keyStr}>
                {keyStr.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                {UNITS[keyStr as keyof typeof UNITS] && ` (${UNITS[keyStr as keyof typeof UNITS]})`}
              </Label>
              <Input
                id={keyStr}
                type="number"
                step="0.1"
                {...register(keyStr as any, { valueAsNumber: true })}
              />
            </div>
          );
        })}
      </div>
    </OnboardingWrapper>
  );
}
