import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";

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
    <div className="bg-page-dye min-h-screen w-full">
      <div className="flex min-h-screen w-full justify-center px-4 sm:px-6 lg:px-8">
        <div
          className={[
            "flex w-full max-w-4xl flex-col",
            "rounded-2xl border border-border/80 bg-card shadow-sm",
            "ring-1 ring-black/[0.04]",
            "mt-6 mb-10 sm:my-8",
          ].join(" ")}
        >
          <header className="w-full shrink-0 rounded-t-2xl border-b border-border/70 bg-card py-8 md:py-10">
            <div className="px-6 md:px-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    {title}
                  </h1>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
                <div className="shrink-0 rounded-lg border border-border bg-muted/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  Step {currentStep} of {totalSteps}
                </div>
              </div>
              <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </header>

          <main className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col overflow-hidden rounded-b-2xl bg-card">
              <div className="flex-1 px-6 py-6 md:px-8 md:py-8">{children}</div>

              <div className="flex items-center justify-between gap-4 border-t border-border/70 bg-muted/30 px-6 py-4 md:px-8">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={handleBack}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="min-w-[7.5rem] shrink-0 gap-1 rounded-lg px-5 shadow-sm"
                  onClick={onNext}
                >
                  {currentStep === totalSteps ? "Finish" : "Continue"}
                  {currentStep < totalSteps ? (
                    <ChevronRight className="h-4 w-4 opacity-90" />
                  ) : (
                    <ArrowRight className="h-4 w-4 opacity-90" />
                  )}
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
