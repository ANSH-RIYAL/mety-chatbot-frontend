import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import * as api from "@/lib/api";
import { VARIABLE_GROUPS, UNITS, CATEGORICAL_VARIABLES, isCategoricalVariable, isPredictionApiVariable, VariableKey } from "@/lib/constants";

export default function MyDiet() {
  const [, setLocation] = useLocation();
  const { userId, setLoading, setError } = useStore();
  
  const { register, handleSubmit, setValue, watch } = useForm<Record<string, number>>({
    defaultValues: {}
  });

  const onSubmit = async (data: any) => {
    if (!userId) {
      alert("No user ID found.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const payload: Record<string, number> = {};
      // Only include prediction API variables (no asterisk variables)
      VARIABLE_GROUPS.diet
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
        page: "My Diet",
        payload,
      });

      // Onboarding now saves directly to current_plan via backend
      setLocation("/onboarding/exercise");
    } catch (error) {
      console.error("[DIET] Failed to submit:", error);
      setError(error instanceof Error ? error.message : "Failed to submit");
      alert("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingWrapper
      title="My Diet"
      description="Tell us about your diet."
      currentStep={3}
      totalSteps={4}
      onNext={handleSubmit(onSubmit)}
    >
      <div className="grid gap-4">
        {VARIABLE_GROUPS.diet
          .filter(key => isPredictionApiVariable(key as VariableKey))
          .map((key) => {
          const keyStr = key as string;
          if (isCategoricalVariable(keyStr as any)) {
            const options = CATEGORICAL_VARIABLES[keyStr];
            return (
              <div key={keyStr} className="grid gap-2">
                <Label htmlFor={keyStr}>
                  {keyStr.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Label>
                <Select
                  defaultValue={String(watch(keyStr as any) ?? options[0].value)}
                  onValueChange={(v) => setValue(keyStr as any, parseInt(v))}
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

