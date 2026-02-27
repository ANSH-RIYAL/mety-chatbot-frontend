import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useStore, loadPlans } from "@/lib/store";
import { OPTIMAL_PLAN, UNITS, VariableKey, CATEGORICAL_VARIABLES, isCategoricalVariable } from "@/lib/constants";
import { Save } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import * as api from "@/lib/api";

interface LogEntry {
  period_start: string;
  period_end: string;
  adherence: {
    total: number;
    diet: number;
    supplement: number;
  };
}

export default function Log() {
  const { userId, currentPlan, targetPlan, setLoading, setError } = useStore();
  const [adherence, setAdherence] = useState<{ total: number; diet: number; supplement: number } | null>(null);
  const [previousLogs, setPreviousLogs] = useState<LogEntry[]>([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const { handleSubmit, reset, setValue, watch } = useForm<Record<string, number>>({
    defaultValues: {}
  });

  useEffect(() => {
    setPreviousLogs([]);
    
    if (userId) {
      loadPlans(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (currentPlan && Object.keys(currentPlan).length > 0) {
      Object.keys(currentPlan).forEach((key) => {
        const value = currentPlan[key as keyof typeof currentPlan];
        if (value !== undefined && value !== null && value !== 0) {
          setValue(key, value as number);
        }
      });
    }
  }, [currentPlan, setValue]);

  const onSubmit = async (data: any) => {
    if (!userId) {
      alert("No user ID found.");
      return;
    }

    if (!periodStart || !periodEnd) {
      alert("Please enter both start and end dates.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const log: Record<string, number> = {};
      Object.keys(OPTIMAL_PLAN).forEach((key) => {
        const keyStr = key as string;
        const value = data[keyStr];
        if (value !== undefined && value !== null && value !== "") {
          log[keyStr] = Number(value);
        }
      });

      const response = await api.submitLog({
        user_id: userId,
        log,
        period_start: periodStart,
        period_end: periodEnd,
      });

      setAdherence(response.adherence);
      setPreviousLogs([...previousLogs, {
        period_start: periodStart,
        period_end: periodEnd,
        adherence: response.adherence,
      }]);

      const resetValues: Record<string, number> = {};
      Object.keys(currentPlan).forEach((key) => {
        const value = currentPlan[key as keyof typeof currentPlan];
        if (value !== undefined && value !== null && value !== 0) {
          resetValues[key] = value as number;
        }
      });
      reset(resetValues);
      alert(`Log submitted! Adherence: ${(response.adherence.total * 100).toFixed(0)}%`);
    } catch (error) {
      console.error("[LOG] Failed to submit:", error);
      setError(error instanceof Error ? error.message : "Failed to submit");
      alert("Failed to submit log. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const keys = Object.keys(OPTIMAL_PLAN) as VariableKey[];

  return (
    <Shell>
      <div className="p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Daily Log</h1>
              <p className="text-muted-foreground">
                Track your adherence to the plan
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="period_start">Period Start</Label>
                    <Input
                      id="period_start"
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="h-8 w-40"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="period_end">Period End</Label>
                    <Input
                      id="period_end"
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="h-8 w-40"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Please enter average intake over your window in the same unit as mentioned beside the variable
                </p>
              </CardContent>
            </Card>

            {adherence && (
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-100">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(adherence.total * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Total Adherence</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(adherence.diet * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Diet Adherence</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(adherence.supplement * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Supplement Adherence</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {previousLogs.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Previous Logs</h3>
                  <div className="space-y-2">
                    {previousLogs.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">
                          {log.period_start} to {log.period_end}
                        </span>
                        <span className="text-sm font-medium">
                          {(log.adherence.total * 100).toFixed(0)}% adherence
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Log Values</h2>
                  <Button onClick={handleSubmit(onSubmit)}>
                    <Save className="h-4 w-4 mr-2" />
                    Submit Log
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Variable</TableHead>
                        <TableHead className="w-[80px]">Target</TableHead>
                        <TableHead className="w-[200px]">Log Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keys.map((key) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="capitalize">{key.replace(/_/g, " ")}</span>
                              <span className="text-xs text-muted-foreground">{UNITS[key]}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {typeof targetPlan[key] === 'number' && targetPlan[key] !== 0
                              ? targetPlan[key]!.toLocaleString(undefined, { maximumFractionDigits: 2 }) 
                              : "-"}
                          </TableCell>
                          <TableCell>
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
                                onValueChange={(v) =>
                                  setValue(key, parseInt(v, 10), { shouldDirty: true })
                                }
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
                                value={watch(key) ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setValue(key, val === "" ? undefined as any : parseFloat(val), { shouldDirty: true });
                                }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
      </div>
    </Shell>
  );
}
