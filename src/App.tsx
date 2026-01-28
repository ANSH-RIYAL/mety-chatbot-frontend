import { Switch, Route } from "wouter";
import Landing from "./pages/landing";
import AboutMe from "./pages/onboarding/about-me";
import MySupplements from "./pages/onboarding/supplements";
import MyDiet from "./pages/onboarding/diet";
import MyExercise from "./pages/onboarding/exercise";
import Plan from "./pages/plan";
import Log from "./pages/log";

function App() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/onboarding/about-me" component={AboutMe} />
      <Route path="/onboarding/supplements" component={MySupplements} />
      <Route path="/onboarding/diet" component={MyDiet} />
      <Route path="/onboarding/exercise" component={MyExercise} />
      <Route path="/plan" component={Plan} />
      <Route path="/log" component={Log} />
    </Switch>
  );
}

export default App;

