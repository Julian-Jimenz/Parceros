import { EVENT } from "@/lib/config/event";
import { isAdultAtEvent } from "@/lib/age";
import type { RegistrationFormValues } from "@/lib/validation/registrationSchema";

export function getVisibleSteps(values: RegistrationFormValues): number[] {
  const steps = [1, 2, 3, 4, 5];
  if (values.registrationOption === "free_with_jersey") {
    steps.push(6);
  }
  if (values.birthDate && !isAdultAtEvent(values.birthDate) && EVENT.minorsEnabled) {
    steps.push(7);
  }
  steps.push(8, 9);
  return steps;
}
