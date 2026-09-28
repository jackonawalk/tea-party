"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PricingCalculator } from "@/components/pricing-calculator";
import { buttonVariants } from "@/components/ui/button";
import { defaultQuoteTitle, type SavedForm } from "@/lib/saved-form";

export function CalculatorScreen({
  quoteId,
  initialForm,
}: {
  quoteId?: string;
  initialForm?: SavedForm;
}) {
  const [title, setTitle] = useState(
    initialForm ? initialForm.title : defaultQuoteTitle,
  );

  useEffect(() => {
    const trimmed = title.trim();
    document.title = trimmed === "" ? defaultQuoteTitle : trimmed;
  }, [title]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-start justify-between gap-6">
        <header className="max-w-xl">
          <h1 className="text-2xl font-medium tracking-tight">
            <input
              aria-label="Quote title"
              value={title}
              placeholder={defaultQuoteTitle}
              maxLength={200}
              onChange={(event) => {
                setTitle(event.target.value);
              }}
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 rounded-md"
            />
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter records for each data source, name each project, and name each
            automation.
          </p>
        </header>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          <Plus data-icon="inline-start" />
          New
        </a>
      </div>
      <PricingCalculator
        quoteId={quoteId}
        initialForm={initialForm}
        title={title}
      />
    </main>
  );
}
