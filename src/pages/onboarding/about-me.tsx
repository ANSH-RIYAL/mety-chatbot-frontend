// import { useLocation } from "wouter";
// import { useForm } from "react-hook-form";
// import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useStore } from "@/lib/store";
// import * as api from "@/lib/api";
// import { useEffect } from "react";

// export default function AboutMe() {
//   const [, setLocation] = useLocation();
//   const { userId, profile, updateProfile, setLoading, setError } = useStore();
  
//   const { register, handleSubmit, setValue, watch } = useForm({
//     defaultValues: profile || {}
//   });

//   // Make Select fully controlled so it can't silently fall back to "0" (Male).
//   // Also handles the case where profile loads after first render.
//   useEffect(() => {
//     if (profile?.gender === 0 || profile?.gender === 1) {
//       setValue("gender", profile.gender);
//     }
//     // Intentionally do nothing when gender is unset (undefined/null)
//   }, [profile?.gender, setValue]);

//   const onSubmit = async (data: any) => {
//     if (!userId) {
//       alert("No user ID found. Please go back to landing page.");
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);
      
//       await api.submitOnboarding({
//         user_id: userId,
//         page: "About Me",
//         payload: {
//           name: data.name,
//           age: data.age,
//           // Only send gender if user explicitly selected it
//           gender: typeof data.gender === "number" ? data.gender : undefined,
//         },
//       });

//       // Avoid overwriting existing stored gender with undefined
//       updateProfile({
//         name: data.name,
//         age: data.age,
//         ...(typeof data.gender === "number" ? { gender: data.gender } : {}),
//       });
      
//       setLocation("/onboarding/supplements");
//     } catch (error) {
//       console.error("[ABOUT ME] Failed to submit:", error);
//       setError(error instanceof Error ? error.message : "Failed to submit");
//       alert("Failed to save. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <OnboardingWrapper
//       title="About Me"
//       description="Let's start with the basics."
//       currentStep={1}
//       totalSteps={4}
//       onNext={handleSubmit(onSubmit)}
//     >
//       <div className="grid gap-4">
//         <div className="grid gap-2">
//           <Label htmlFor="name">Name</Label>
//           <Input id="name" {...register("name", { required: true })} />
//         </div>
        
//         <div className="grid gap-2">
//           <Label htmlFor="age">Age</Label>
//           <Input id="age" type="number" {...register("age", { valueAsNumber: true, required: true })} />
//         </div>

//         <div className="grid gap-2">
//           <Label>Gender</Label>
//           {/*
//             Don't default to Male when gender is not set.
//             Only preselect a value if we already have one saved in profile.
//           */}
//           {(() => {
//             const watchedGender = watch("gender");
//             const selectValue =
//               watchedGender === 0 || watchedGender === 1 ? String(watchedGender) : undefined;
//             return (
//               <Select
//                 value={selectValue}
//                 onValueChange={(v) => setValue("gender", parseInt(v, 10))}
//               >
//             <SelectTrigger>
//               <SelectValue placeholder="Select gender" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="0">Male</SelectItem>
//               <SelectItem value="1">Female</SelectItem>
//             </SelectContent>
//               </Select>
//             );
//           })()}
//         </div>
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import * as api from "@/lib/api";

type FormValues = {
  name?: string;
  age?: number;
  gender?: number;
};

export default function AboutMe() {
  const [, setLocation] = useLocation();
  const { userId, setLoading, setError } = useStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
  } = useForm<FormValues>();

  /* ---------------------------------------------------- */
  /* Load profile from backend */
  /* ---------------------------------------------------- */
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;

      try {
        // ✅ Use user/vars endpoint
        await api.getUserVars(userId);

        // Your backend stores profile inside Firestore user document
        // but /user/vars returns:
        // { user_id, vars_extracted, target_plan }
        // It does NOT return profile.

        // So we need to fetch it directly from plan/get
        // and read from current_plan OR modify backend.

        // Since profile is not returned anywhere,
        // safest solution is: do not auto-load profile for now.
        // (Your backend currently doesn't expose it.)

        reset({});
      } catch (err) {
        console.error("[ABOUT ME] Failed to load profile:", err);
      }
    };

    loadProfile();
  }, [userId, reset]);

  /* ---------------------------------------------------- */
  /* Submit */
  /* ---------------------------------------------------- */
  const onSubmit = async (data: FormValues) => {
    if (!userId) {
      alert("No user ID found.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.submitOnboarding({
        user_id: userId,
        page: "About Me",
        payload: {
          name: data.name,
          age: data.age,
          gender:
            typeof data.gender === "number"
              ? data.gender
              : undefined,
        },
      });

      setLocation("/onboarding/supplements");
    } catch (error) {
      console.error("[ABOUT ME] Failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to submit"
      );
      alert("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------- */
  /* Render */
  /* ---------------------------------------------------- */
  return (
    <OnboardingWrapper
      title="About Me"
      description="Let's start with the basics."
      currentStep={1}
      totalSteps={4}
      onNext={handleSubmit(onSubmit)}
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Name</Label>
          <Input {...register("name", { required: true })} />
        </div>

        <div className="grid gap-2">
          <Label>Age</Label>
          <Input
            type="number"
            {...register("age", {
              valueAsNumber: true,
              required: true,
            })}
          />
        </div>

        <div className="grid gap-2">
          <Label>Gender</Label>

          {(() => {
            const watchedGender = watch("gender");
            const selectValue =
              watchedGender === 0 || watchedGender === 1
                ? String(watchedGender)
                : undefined;

            return (
              <Select
                value={selectValue}
                onValueChange={(v) =>
                  setValue("gender", parseInt(v, 10))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Male</SelectItem>
                  <SelectItem value="1">Female</SelectItem>
                </SelectContent>
              </Select>
            );
          })()}
        </div>
      </div>
    </OnboardingWrapper>
  );
}
