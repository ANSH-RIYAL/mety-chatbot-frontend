import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import * as api from "@/lib/api";

export default function AboutMe() {
  const [, setLocation] = useLocation();
  const { userId, profile, updateProfile, setLoading, setError } = useStore();
  
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: profile || {}
  });

  const onSubmit = async (data: any) => {
    if (!userId) {
      alert("No user ID found. Please go back to landing page.");
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
          gender: data.gender,
        },
      });

      updateProfile(data);
      
      setLocation("/onboarding/supplements");
    } catch (error) {
      console.error("[ABOUT ME] Failed to submit:", error);
      setError(error instanceof Error ? error.message : "Failed to submit");
      alert("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name", { required: true })} />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="age">Age</Label>
          <Input id="age" type="number" {...register("age", { valueAsNumber: true, required: true })} />
        </div>

        <div className="grid gap-2">
          <Label>Gender</Label>
          <Select 
            defaultValue={String(profile?.gender ?? 0)} 
            onValueChange={(v) => setValue("gender", parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Male</SelectItem>
              <SelectItem value="1">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </OnboardingWrapper>
  );
}

