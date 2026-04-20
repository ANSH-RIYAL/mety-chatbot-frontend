import { Switch, Route } from "wouter";
import Landing from "./pages/landing";
import AboutMe from "./pages/onboarding/about-me";
import MySupplements from "./pages/onboarding/supplements";
import MyDiet from "./pages/onboarding/diet";
import MyExercise from "./pages/onboarding/exercise";
import Plan from "./pages/plan";
import Log from "./pages/log";
import { withOnboardingPageFlip } from "./components/onboarding/OnboardingRouteTransition";

const AboutMeFlipped = withOnboardingPageFlip(AboutMe);
const SupplementsFlipped = withOnboardingPageFlip(MySupplements);
const DietFlipped = withOnboardingPageFlip(MyDiet);
const ExerciseFlipped = withOnboardingPageFlip(MyExercise);

function App() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/onboarding/about-me" component={AboutMeFlipped} />
      <Route path="/onboarding/supplements" component={SupplementsFlipped} />
      <Route path="/onboarding/diet" component={DietFlipped} />
      <Route path="/onboarding/exercise" component={ExerciseFlipped} />
      <Route path="/plan" component={Plan} />
      <Route path="/log" component={Log} />
    </Switch>
  );
}

export default App;

