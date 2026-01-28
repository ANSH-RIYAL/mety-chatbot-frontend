import { useState } from "react";
import { useLocation } from "wouter";
import { useStore, loadPlans } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
      await loadPlans(inputUserId.trim());
      setLocation("/onboarding/about-me");
    } catch (error) {
      console.error("[LANDING] Failed to initialize:", error);
      alert("Failed to initialize. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>
            Enter your user ID to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter user ID"
                value={inputUserId}
                onChange={(e) => setInputUserId(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : "Start"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

