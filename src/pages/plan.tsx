import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useStore, loadPlans } from "@/lib/store";
import { OPTIMAL_PLAN, UNITS, VariableKey, isPredictionApiVariable, VARIABLE_GROUPS, CATEGORICAL_VARIABLES, isCategoricalVariable } from "@/lib/constants";
import { Save, ArrowRight } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { applyTargetToCurrent } from "@/lib/api";

export default function Plan() {
  const [location] = useLocation();
  const { userId, currentPlan, targetPlan, optimalPlan, updateTargetPlan, setLoading, setError, latestDiffDetected, latestSuggestedPlan } = useStore();

  const getInitialFormValues = () => {
    if (targetPlan && Object.keys(targetPlan).length > 0) {
      const hasNonZeroValues = Object.values(targetPlan).some(val => val !== 0 && val !== null && val !== undefined);
      if (hasNonZeroValues) {
        return targetPlan;
      }
    }
    return currentPlan || {};
  };

  const { register, handleSubmit, getValues, reset, setValue, watch } = useForm({
    defaultValues: getInitialFormValues()
  });

  useEffect(() => {
    if (userId) {
      loadPlans(userId).then(() => {
        const { targetPlan: currentTarget, currentPlan: currentCurrent } = useStore.getState();
        const formValues = (currentTarget && Object.keys(currentTarget).length > 0 && 
                           Object.values(currentTarget).some(v => v !== 0 && v !== null && v !== undefined))
                          ? currentTarget 
                          : (currentCurrent || {});
        reset(formValues);
      });
    }
  }, [userId, reset]);
  
  useEffect(() => {
    if (userId && location === '/plan') {
      loadPlans(userId).then(() => {
        const { targetPlan: currentTarget, currentPlan: currentCurrent } = useStore.getState();
        const formValues = (currentTarget && Object.keys(currentTarget).length > 0 && 
                           Object.values(currentTarget).some(v => v !== 0 && v !== null && v !== undefined))
                          ? currentTarget 
                          : (currentCurrent || {});
        reset(formValues);
      });
    }
  }, [location, userId, reset]);

  useEffect(() => {
    if (location === '/plan' && targetPlan && Object.keys(targetPlan).length > 0) {
      const hasNonZeroValues = Object.values(targetPlan).some(val => val !== 0 && val !== null && val !== undefined);
      if (hasNonZeroValues) {
        const timeoutId = setTimeout(() => {
          reset(targetPlan);
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [targetPlan, location, reset]);

  const onSaveAll = async (data: any) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const finalTargetPlan: Record<string, number> = {};
      Object.keys(data).forEach((key) => {
        const formVal = data[key];
        if (formVal !== null && formVal !== undefined && formVal !== "") {
          const numVal = Number(formVal);
          if (!isNaN(numVal)) {
            finalTargetPlan[key as VariableKey] = numVal;
          }
        }
      });

      // Also include any values from store's targetPlan that might not be in form
      // (in case form hasn't synced yet or has empty fields)
      const { targetPlan: storeTargetPlan } = useStore.getState();
      Object.keys(storeTargetPlan).forEach((key) => {
        const storeVal = storeTargetPlan[key as VariableKey];
        if (storeVal !== undefined && storeVal !== null && storeVal !== 0) {
          // Only add if not already in form or if form value is empty/zero
          if (!(key in finalTargetPlan) || finalTargetPlan[key as VariableKey] === 0) {
            finalTargetPlan[key as VariableKey] = Number(storeVal);
          }
        }
      });
      
      console.log("[PLAN] Form data:", data);
      console.log("[PLAN] Store targetPlan:", storeTargetPlan);
      console.log("[PLAN] Final targetPlan to save:", finalTargetPlan);

      // Get all non-zero values from finalTargetPlan as diff
      const targetDiff: Record<string, number> = {};
      Object.keys(finalTargetPlan).forEach((key) => {
        const val = finalTargetPlan[key as VariableKey];
        if (val !== undefined && val !== null && val !== 0) {
          targetDiff[key] = Number(val);
        }
      });
      
      console.log("[PLAN] Saving target plan to backend:", targetDiff);
      
      // Always update target plan first (even if empty, to ensure backend has latest state)
      await updateTargetPlan(targetDiff);
      
      // Reload to get latest from backend
      await loadPlans(userId);
      
      // Now copy target plan to current plan (save target to current)
      // Use the updated target plan from backend
      await applyTargetToCurrent(userId);
      
      // Reload plans again to get updated current plan
      await loadPlans(userId);
      
      // Reset form to current plan (since target is now applied to current)
      const { currentPlan: newCurrentPlan } = useStore.getState();
      reset(newCurrentPlan || {});
      
      // Update store to reflect that target plan is now empty (after apply)
      const { setPlans } = useStore.getState();
      const { optimalPlan: newOptimalPlan } = useStore.getState();
      setPlans({
        currentPlan: newCurrentPlan,
        targetPlan: {}, // Target plan is cleared after apply
        optimalPlan: newOptimalPlan,
      });
    } catch (error) {
      console.error("[PLAN] Failed to save:", error);
      setError(error instanceof Error ? error.message : "Failed to save");
      alert("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onApplySingle = async (key: VariableKey) => {
    if (!userId) return;

    const val = getValues(key);
    // Filter out null, undefined, and NaN (val is already a number from form)
    if (val === undefined || val === null || isNaN(Number(val))) {
      return;
    }

    try {
      setLoading(true);
      const numVal = Number(val);
      await updateTargetPlan({ [key]: numVal });
      await loadPlans(userId);
      reset(targetPlan || {});
    } catch (error) {
      console.error("[PLAN] Failed to apply:", error);
      alert("Failed to apply change. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reorganized variable order: supplements, diet, exercise/lifestyle grouped together
  const getOrderedKeys = (): VariableKey[] => {
    const ordered: VariableKey[] = [
      // Supplements first
      ...VARIABLE_GROUPS.supplements,
      // Then diet
      ...VARIABLE_GROUPS.diet,
      // Then exercise/lifestyle
      ...VARIABLE_GROUPS.exercise,
    ];
    // Filter to only include keys that exist in OPTIMAL_PLAN
    const allKeys = ordered.filter(key => key in OPTIMAL_PLAN) as VariableKey[];
    
    // Separate into prediction API variables (no asterisk) and non-prediction variables (asterisk)
    const predictionKeys: VariableKey[] = [];
    const nonPredictionKeys: VariableKey[] = [];
    
    allKeys.forEach(key => {
      if (isPredictionApiVariable(key)) {
        predictionKeys.push(key);
      } else {
        nonPredictionKeys.push(key);
      }
    });
    
    // Return prediction API variables first, then non-prediction variables at the bottom
    return [...predictionKeys, ...nonPredictionKeys];
  };

  const keys = getOrderedKeys();

  return (
    <Shell>
      <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">My Plan</h1>
                <p className="text-muted-foreground">
                  Review and adjust your target plan
                </p>
              </div>
            </div>

            <Card>
              {/* Action buttons - placed before table, stacked vertically */}
              <div className="p-4 border-b space-y-2">
                {latestDiffDetected && Object.keys(latestDiffDetected).length > 0 && (
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      if (!userId) return;
                      try {
                        setLoading(true);
                        // Apply diff_detected to target plan (save to backend)
                        await updateTargetPlan(latestDiffDetected);
                        await loadPlans(userId);
                        reset({ ...targetPlan, ...latestDiffDetected });
                      } catch (error) {
                        console.error("[PLAN] Failed to apply extracted variables:", error);
                        alert("Failed to apply extracted variables");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Apply Extracted Variables
                  </Button>
                )}
                {latestSuggestedPlan && Object.keys(latestSuggestedPlan).length > 0 && (
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      if (!userId) return;
                      try {
                        setLoading(true);
                        // Step 1: Update frontend state (visible UI) first
                        const { targetPlan: currentTarget, setPlans } = useStore.getState();
                        const newTargetPlan = { ...currentTarget, ...latestSuggestedPlan };
                        
                        // Update frontend state immediately (visible side)
                        setPlans({
                          currentPlan: useStore.getState().currentPlan,
                          targetPlan: newTargetPlan,
                          optimalPlan: useStore.getState().optimalPlan,
                        });
                        
                        // Update form with new target plan (visible UI)
                        reset(newTargetPlan);
                        
                        // Step 2: Then save to backend
                        // Filter to only non-zero values for the diff
                        const targetDiff: Record<string, number> = {};
                        Object.keys(newTargetPlan).forEach((key) => {
                          const val = newTargetPlan[key as VariableKey];
                          if (val !== undefined && val !== null && val !== 0) {
                            targetDiff[key] = Number(val);
                          }
                        });
                        
                        // Save to backend
                        await updateTargetPlan(targetDiff);
                        await loadPlans(userId);
                      } catch (error) {
                        console.error("[PLAN] Failed to apply recommended plan:", error);
                        alert("Failed to apply recommended plan");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Apply Recommended Plan
                  </Button>
                )}
                <Button onClick={handleSubmit(onSaveAll)} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save All Targets
                </Button>
              </div>
              <div className="overflow-x-auto w-full">
                <Table className="w-full" style={{ minWidth: '800px' }}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Variable</TableHead>
                      <TableHead className="w-[60px]">Optimal</TableHead>
                      <TableHead className="w-[60px]">Current</TableHead>
                      <TableHead className="w-[75px]">Target</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((key) => {
                      const isPredictionVar = isPredictionApiVariable(key);
                      return (
                        <TableRow key={key}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="capitalize">
                                {key.replace(/_/g, " ")}
                                {!isPredictionVar && <span className="text-muted-foreground ml-1">*</span>}
                              </span>
                              <span className="text-xs text-muted-foreground">{UNITS[key]}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {typeof optimalPlan[key] === 'number' 
                              ? optimalPlan[key]!.toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                              : (optimalPlan[key] ?? "-")}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {typeof currentPlan[key] === 'number' 
                              ? currentPlan[key]!.toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                              : (currentPlan[key] ?? "-")}
                          </TableCell>
                          <TableCell className="w-[75px]">
                            {isCategoricalVariable(key) ? (
                              <Select
                                value={String(watch(key) ?? CATEGORICAL_VARIABLES[key][0].value)}
                                onValueChange={(v) => setValue(key, parseInt(v))}
                              >
                                <SelectTrigger className="h-8 w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CATEGORICAL_VARIABLES[key].map((opt) => (
                                    <SelectItem key={opt.value} value={String(opt.value)}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input 
                                type="number" 
                                step="0.1"
                                className="h-8 w-full"
                                {...register(key, { valueAsNumber: true })}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              type="button" 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => onApplySingle(key)}
                              title="Apply this change"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>

        <p className="text-xs text-muted-foreground">
          * Variables marked with asterisk are not used by the prediction API
        </p>
      </div>
    </Shell>
  );
}

