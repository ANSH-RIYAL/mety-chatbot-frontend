import { useState } from "react";
import { useLocation } from "wouter";
import { useStore, loadPlans } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { userId, setUserId } = useStore();
  const [inputUserId, setInputUserId] = useState(userId || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUserId.trim()) return;

    setIsLoading(true);
    try {
      setUserId(inputUserId.trim());
      const response = await loadPlans(inputUserId.trim());

      // If user already completed onboarding, go to plan page
      if (response?.profile?.name) {
        setLocation("/plan");
      } else {
        setLocation("/onboarding/about-me");
      }
    } catch (error) {
      console.error("[LANDING] Failed to initialize:", error);
      alert("Failed to initialize. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-28 h-80 w-80 rounded-[42%] bg-[hsl(154_48%_84%_/0.38)] blur-3xl" />
        <div className="absolute -right-14 top-20 h-72 w-72 rounded-[38%] bg-[hsl(172_40%_86%_/0.32)] blur-3xl" />
        <div className="absolute bottom-8 left-1/4 h-72 w-72 -translate-x-1/2 rounded-[48%] bg-[hsl(148_40%_86%_/0.28)] blur-3xl" />
        <div className="absolute top-1/2 right-[12%] h-56 w-56 -translate-y-1/2 rounded-[55%] bg-primary/12 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <Card className="animate-fade-in-up mx-auto w-full max-w-md border border-border/80 bg-card/95 shadow-lg shadow-black/5 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Welcome to Mety
            </CardTitle>
            <CardDescription>
              Enter your user ID to continue your personalized plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="text"
                placeholder="Enter user ID"
                value={inputUserId}
                onChange={(e) => setInputUserId(e.target.value)}
                disabled={isLoading}
                required
                className="h-9 bg-white/90"
              />
              <Button type="submit" className="w-full shadow-md shadow-primary/20" disabled={isLoading}>
                {isLoading ? "Preparing your profile..." : "Start your health plan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}