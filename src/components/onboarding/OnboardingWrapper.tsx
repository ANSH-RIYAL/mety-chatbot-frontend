import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface OnboardingWrapperProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  children: React.ReactNode;
}

export function OnboardingWrapper({
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  children,
}: OnboardingWrapperProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    const routes = [
      "/onboarding/about-me",
      "/onboarding/supplements",
      "/onboarding/diet",
      "/onboarding/exercise",
    ];
    if (currentStep > 1) {
      setLocation(routes[currentStep - 2]);
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {description} ({currentStep} of {totalSteps})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={onNext}>
              {currentStep === totalSteps ? "Finish" : "Next"}
              {currentStep < totalSteps && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

