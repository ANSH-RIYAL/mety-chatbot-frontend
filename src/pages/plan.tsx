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

  const normalizeTargetDefaults = (values: Record<string, any>) => {
    const next = { ...(values || {}) };
    Object.keys(next).forEach((k) => {
      if (next[k] === 0) delete next[k];
    });
    return next;
  };

  const getInitialFormValues = () => {
    return normalizeTargetDefaults((targetPlan || {}) as any);
  };

  const { handleSubmit, getValues, reset, setValue, watch, formState } = useForm({
    defaultValues: getInitialFormValues()
  });

  useEffect(() => {
    if (userId) {
      loadPlans(userId).then(() => {
        const { targetPlan: currentTarget } = useStore.getState();
        reset(normalizeTargetDefaults((currentTarget || {}) as any));
      });
    }
  }, [userId, reset]);
  
  useEffect(() => {
    if (userId && location === '/plan') {
      loadPlans(userId).then(() => {
        const { targetPlan: currentTarget } = useStore.getState();
        reset(normalizeTargetDefaults((currentTarget || {}) as any));
      });
    }
  }, [location, userId, reset]);

  useEffect(() => {
    if (location === '/plan' && targetPlan && Object.keys(targetPlan).length > 0) {
      const hasNonZeroValues = Object.values(targetPlan).some(val => val !== 0 && val !== null && val !== undefined);
      if (hasNonZeroValues) {
        const timeoutId = setTimeout(() => {
          reset(normalizeTargetDefaults(targetPlan as any));
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
            const isExplicit = !!(formState.dirtyFields as any)?.[key];
            if (numVal !== 0 || isExplicit) {
              finalTargetPlan[key as VariableKey] = numVal;
            }
          }
        }
      });
      
      console.log("[PLAN] Form data:", data);
      console.log("[PLAN] Final targetPlan to save:", finalTargetPlan);

      const targetDiff: Record<string, number> = {};
      Object.keys(finalTargetPlan).forEach((key) => {
        const val = finalTargetPlan[key as VariableKey];
        if (val !== undefined && val !== null && !isNaN(Number(val))) {
          targetDiff[key] = Number(val);
        }
      });
      
      console.log("[PLAN] Saving target plan to backend:", targetDiff);
      
      await updateTargetPlan(targetDiff);
      await loadPlans(userId);
      await applyTargetToCurrent(userId);
      await loadPlans(userId);
      
      const { currentPlan: newCurrentPlan, setPlans, optimalPlan: newOptimalPlan } = useStore.getState();
      reset(normalizeTargetDefaults((newCurrentPlan || {}) as any));
      
      setPlans({
        currentPlan: newCurrentPlan,
        targetPlan: {},
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
    if (val === undefined || val === null || isNaN(Number(val))) {
      return;
    }

    try {
      setLoading(true);
      const numVal = Number(val);
      await updateTargetPlan({ [key]: numVal });
      await loadPlans(userId);
      reset(normalizeTargetDefaults((targetPlan || {}) as any));
    } catch (error) {
      console.error("[PLAN] Failed to apply:", error);
      alert("Failed to apply change. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getOrderedKeys = (): VariableKey[] => {
    const ordered: VariableKey[] = [
      ...VARIABLE_GROUPS.supplements,
      ...VARIABLE_GROUPS.diet,
      ...VARIABLE_GROUPS.exercise,
    ];
    const allKeys = ordered.filter(key => key in OPTIMAL_PLAN) as VariableKey[];
    
    const predictionKeys: VariableKey[] = [];
    const nonPredictionKeys: VariableKey[] = [];
    
    allKeys.forEach(key => {
      if (isPredictionApiVariable(key)) {
        predictionKeys.push(key);
      } else {
        nonPredictionKeys.push(key);
      }
    });
    
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
          <div className="p-4 border-b flex flex-wrap gap-2 sm:justify-end">
            {latestDiffDetected && Object.keys(latestDiffDetected).length > 0 && (
              <Button 
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!userId) return;
                  try {
                    setLoading(true);
                    await updateTargetPlan(latestDiffDetected);
                    await loadPlans(userId);
                    reset(normalizeTargetDefaults({ ...targetPlan, ...latestDiffDetected } as any));
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
                size="sm"
                onClick={async () => {
                  if (!userId) return;
                  try {
                    setLoading(true);
                    const { targetPlan: currentTarget, setPlans } = useStore.getState();
                    const newTargetPlan = { ...currentTarget, ...latestSuggestedPlan };
                    
                    setPlans({
                      currentPlan: useStore.getState().currentPlan,
                      targetPlan: newTargetPlan,
                      optimalPlan: useStore.getState().optimalPlan,
                    });
                    
                    reset(normalizeTargetDefaults(newTargetPlan as any));
                    
                    const targetDiff: Record<string, number> = {};
                    Object.keys(newTargetPlan).forEach((key) => {
                      const val = newTargetPlan[key as VariableKey];
                      if (val !== undefined && val !== null && val !== 0) {
                        targetDiff[key] = Number(val);
                      }
                    });
                    
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
            <Button onClick={handleSubmit(onSaveAll)} size="sm">
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
                  <TableHead className="w-[120px]">Target</TableHead>
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
                      <TableCell className="w-[120px]">
                        {isCategoricalVariable(key) ? (
                          (() => {
                            const watched = watch(key);
                            const selectValue =
                              watched === undefined || watched === null
                                ? undefined
                                : String(watched);
                            return (
                              <Select
                                value={selectValue}
                                onValueChange={(v) => setValue(key, parseInt(v, 10), { shouldDirty: true })}
                              >
                                <SelectTrigger className="h-8 w-24">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {CATEGORICAL_VARIABLES[key].map((opt) => (
                                    <SelectItem key={opt.value} value={String(opt.value)}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          })()
                        ) : (
                          <Input 
                            type="number" 
                            step="0.1"
                            className="h-8 w-24"
                            placeholder="-"
                            value={watch(key) ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setValue(key, val === "" ? undefined as any : parseFloat(val), { shouldDirty: true });
                            }}
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
