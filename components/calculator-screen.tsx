import { PricingCalculator } from "@/components/pricing-calculator";
import type { SavedForm } from "@/lib/saved-form";

export function CalculatorScreen({
  quoteId,
  initialForm,
}: {
  quoteId?: string;
  initialForm?: SavedForm;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-xl">
        <h1 className="text-2xl font-medium tracking-tight">
          Pricing calculator
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter records for each data source, name each project, and name each
          automation.
        </p>
      </header>
      <PricingCalculator quoteId={quoteId} initialForm={initialForm} />
    </main>
  );
}
