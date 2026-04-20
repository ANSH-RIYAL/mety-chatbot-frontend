import { useLocation } from "wouter";
import type { ComponentType } from "react";

/**
 * Wraps each onboarding screen so route changes run a soft transition (fade + light slide).
 */
export function OnboardingRouteTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="onboarding-flip-root min-h-screen">
      <div key={location} className="onboarding-flip-page min-h-screen">
        {children}
      </div>
    </div>
  );
}

/** Stable wrapper factory for wouter <Route component={...} /> */
export function withOnboardingPageFlip<P extends object>(Page: ComponentType<P>) {
  function Wrapped(props: P) {
    return (
      <OnboardingRouteTransition>
        <Page {...props} />
      </OnboardingRouteTransition>
    );
  }
  Wrapped.displayName = `OnboardingFlip(${Page.displayName || Page.name || "Page"})`;
  return Wrapped;
}
