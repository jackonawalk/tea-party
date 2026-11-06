"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PricingCalculator } from "@/components/pricing-calculator";
import { buttonVariants } from "@/components/ui/button";
import { defaultQuoteTitle, type SavedForm } from "@/lib/saved-form";

const creditRows = [
  { label: "Creating new projects", free: false },
  { label: "Syncing more data", free: false },
  { label: "Editing a project", free: true },
  { label: "Unlimited data updates", free: true },
  { label: "Data visualizations", free: true },
  { label: "MCP and API", free: true },
];

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
            Build an estimate based on your data, sources, and workflows.
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
      >
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">What counts as a credit</caption>
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium" scope="col">
                  Feature
                </th>
                <th
                  className="px-4 py-3 text-center font-medium whitespace-nowrap"
                  scope="col"
                >
                  Consumes credits
                </th>
                <th
                  className="px-4 py-3 text-center font-medium whitespace-nowrap"
                  scope="col"
                >
                  Included for free
                </th>
              </tr>
            </thead>
            <tbody>
              {creditRows.map((row) => (
                <tr key={row.label} className="border-b last:border-b-0">
                  <th className="px-4 py-3 text-left font-normal" scope="row">
                    {row.label}
                  </th>
                  <td className="px-4 py-3 text-center">
                    {row.free ? (
                      <span className="sr-only">Does not consume credits</span>
                    ) : (
                      <span>
                        <span aria-hidden="true">✅</span>
                        <span className="sr-only">Consumes credits</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.free ? (
                      <span>
                        <span aria-hidden="true">✅</span>
                        <span className="sr-only">Included for free</span>
                      </span>
                    ) : (
                      <span className="sr-only">Not included</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PricingCalculator>
    </main>
  );
}
