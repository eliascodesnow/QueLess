"use client";

import { useFormState, useFormStatus } from "react-dom";
import { completeOnboardingAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Setting up your business…" : "Set up your business"}
    </Button>
  );
}

export function OnboardingForm() {
  const [state, formAction] = useFormState(completeOnboardingAction, {
    error: undefined as string | undefined,
  });

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label>Business name</Label>
        <Input name="name" placeholder="e.g. Clinic or Barbershop" required />
      </div>

      {state?.error && <p className="text-sm text-terracotta-dark">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
