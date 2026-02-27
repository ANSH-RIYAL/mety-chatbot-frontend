
import { useLocation } from "wouter";
import { useForm, Controller } from "react-hook-form";
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
    control,
    reset,
  } = useForm<FormValues>();

  /* ---------------------------------------------------- */
  /* Load profile from backend */
  /* ---------------------------------------------------- */
  useEffect(() => {
  const loadProfile = async () => {
    if (!userId) return;

    try {
      const response = await api.getPlan(userId);

      // 👇 ADD THIS LINE
      console.log("FULL RESPONSE FROM getPlan:", response);

      if (response?.profile) {
        reset({
          name: response.profile.name ?? "",
          age: response.profile.age ?? undefined,
          gender: response.profile.gender ?? undefined,
        });
      }

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

        {/* Name */}
        <div className="grid gap-2">
          <Label>Name</Label>
          <Input {...register("name", { required: true })} />
        </div>

        {/* Age */}
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

        {/* Gender */}
        <div className="grid gap-2">
          <Label>Gender</Label>

          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select
                value={
                  field.value !== undefined
                    ? String(field.value)
                    : undefined
                }
                onValueChange={(v) =>
                  field.onChange(parseInt(v, 10))
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
            )}
          />
        </div>

      </div>
    </OnboardingWrapper>
  );
}