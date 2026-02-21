// import { useLocation } from "wouter";
// import { useForm } from "react-hook-form";
// import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useStore } from "@/lib/store";
// import * as api from "@/lib/api";
// import { VARIABLE_GROUPS, UNITS, isPredictionApiVariable, VariableKey } from "@/lib/constants";

// export default function MySupplements() {
//   const [, setLocation] = useLocation();
//   const { userId, setLoading, setError } = useStore();
  
//   const { register, handleSubmit, setValue, watch } = useForm<Record<string, number>>({
//     defaultValues: {}
//   });

//   const onSubmit = async (data: any) => {
//     if (!userId) {
//       alert("No user ID found.");
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);
      
//       // Convert form data to payload (only non-empty values)
//       // Only include prediction API variables (no asterisk variables)
//       const payload: Record<string, number> = {};
//       VARIABLE_GROUPS.supplements
//         .filter(key => isPredictionApiVariable(key as VariableKey))
//         .forEach((key) => {
//           const value = data[key];
//           if (value !== undefined && value !== null && value !== "") {
//             payload[key] = Number(value);
//           }
//         });

//       await api.submitOnboarding({
//         user_id: userId,
//         page: "My Supplements",
//         payload,
//       });

//       // Onboarding now saves directly to current_plan via backend
//       setLocation("/onboarding/diet");
//     } catch (error) {
//       console.error("[SUPPLEMENTS] Failed to submit:", error);
//       setError(error instanceof Error ? error.message : "Failed to submit");
//       alert("Failed to save. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <OnboardingWrapper
//       title="My Supplements"
//       description="Tell us about your supplement intake."
//       currentStep={2}
//       totalSteps={4}
//       onNext={handleSubmit(onSubmit)}
//     >
//       <div className="grid gap-4">
//         {VARIABLE_GROUPS.supplements
//           .filter(key => isPredictionApiVariable(key as VariableKey))
//           .map((key) => {
//           const keyStr = key as string;
//           if (keyStr === "multi_vitamins") {
//             return (
//               <div key={keyStr} className="flex items-center space-x-2">
//                 <Checkbox
//                   id={keyStr}
//                   checked={watch(keyStr as any) === 1}
//                   onCheckedChange={(checked) => setValue(keyStr as any, checked ? 1 : 0)}
//                 />
//                 <Label htmlFor={keyStr} className="cursor-pointer">
//                   Multi Vitamins
//                 </Label>
//               </div>
//             );
//           }
//           return (
//             <div key={keyStr} className="grid gap-2">
//               <Label htmlFor={keyStr}>
//                 {keyStr.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
//                 {UNITS[keyStr as keyof typeof UNITS] && ` (${UNITS[keyStr as keyof typeof UNITS]})`}
//               </Label>
//               <Input
//                 id={keyStr}
//                 type="number"
//                 step="0.1"
//                 {...register(keyStr as any, { valueAsNumber: true })}
//               />
//             </div>
//           );
//         })}
//       </div>
//     </OnboardingWrapper>
//   );
// }

import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/lib/store";
import * as api from "@/lib/api";
import { VARIABLE_GROUPS, UNITS } from "@/lib/constants";

export default function MySupplements() {
  const [, setLocation] = useLocation();
  const { userId, setLoading } = useStore();

  const { register, handleSubmit, setValue, watch, reset } =
    useForm<Record<string, number>>();

  // ✅ Load existing plan
  useEffect(() => {
    const load = async () => {
      if (!userId) return;

      const response = await api.getPlan(userId);
      const current = response.current_plan;

      reset(current);
    };

    load();
  }, [userId, reset]);

  const onSubmit = async (data: any) => {
    if (!userId) return;

    try {
      setLoading(true);

      const payload: Record<string, number> = {};
      VARIABLE_GROUPS.supplements.forEach((key) => {
        const val = data[key];
        if (val !== undefined && val !== null && val !== "") {
          const num = Number(val);
          if (!isNaN(num)) payload[key] = num;
        }
      });

      await api.submitOnboarding({
        user_id: userId,
        page: "My Supplements",
        payload,
      });

      setLocation("/onboarding/diet");
    } catch (error) {
      alert("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingWrapper
      title="My Supplements"
      description="Tell us about your supplement intake."
      currentStep={2}
      totalSteps={4}
      onNext={handleSubmit(onSubmit)}
    >
      <div className="grid gap-4">
        {VARIABLE_GROUPS.supplements.map((key) => {
            if (key === "multi_vitamins") {
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    checked={watch(key) === 1}
                    onCheckedChange={(checked) =>
                      setValue(key, checked ? 1 : 0)
                    }
                  />
                  <Label>Multi Vitamins</Label>
                </div>
              );
            }

            return (
              <div key={key} className="grid gap-2">
                <Label>
                  {key.replace(/_/g, " ")}{" "}
                  {UNITS[key as keyof typeof UNITS] &&
                    `(${UNITS[key as keyof typeof UNITS]})`}
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  {...register(key, { valueAsNumber: true })}
                />
              </div>
            );
          })}
      </div>
    </OnboardingWrapper>
  );
}
