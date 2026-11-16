"use client";

import { useEffect, useState } from "react";
import {
  ChartColumnIcon,
  CoinsIcon,
  DatabaseIcon,
  FolderPlusIcon,
  InfinityIcon,
  PlugIcon,
  Plus,
  RefreshCwIcon,
  SquarePenIcon,
  UsersIcon,
} from "lucide-react";
import { PricingCalculator } from "@/components/pricing-calculator";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { defaultQuoteTitle, type SavedForm } from "@/lib/saved-form";

const creditRows = [
  { label: "Creating new projects", Icon: FolderPlusIcon, pricing: "credit" },
  { label: "Syncing more data", Icon: DatabaseIcon, pricing: "credit" },
  { label: "Editing a project", Icon: SquarePenIcon, pricing: "unlimited" },
  { label: "Data refresh", Icon: RefreshCwIcon, pricing: "unlimited" },
  { label: "Data visualizations", Icon: ChartColumnIcon, pricing: "unlimited" },
  { label: "MCP and API", Icon: PlugIcon, pricing: "unlimited" },
  { label: "Users", Icon: UsersIcon, pricing: "unlimited" },
] as const;

const pricingStyles = {
  credit: {
    label: "Per credit",
    Icon: CoinsIcon,
    hint: "Based on the amount of data processed",
    className:
      "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
  },
  unlimited: {
    label: "Unlimited",
    Icon: InfinityIcon,
    hint: undefined,
    className:
      "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  },
} as const;

function PricingPill({ pricing }: { pricing: keyof typeof pricingStyles }) {
  const { label, Icon, hint, className } = pricingStyles[pricing];
  const pillClassName = `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${className}`;
  const content = (
    <>
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </>
  );

  if (!hint) {
    return <span className={pillClassName}>{content}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={`${label}: ${hint}`}
        className={`${pillClassName} cursor-help outline-none focus-visible:ring-3 focus-visible:ring-ring/50`}
      >
        {content}
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

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
            <caption className="sr-only">Feature pricing</caption>
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium" scope="col">
                  Feature
                </th>
                <th
                  className="px-4 py-3 text-center font-medium whitespace-nowrap"
                  scope="col"
                >
                  Pricing
                </th>
              </tr>
            </thead>
            <tbody>
              {creditRows.map((row) => (
                <tr key={row.label} className="border-b last:border-b-0">
                  <th className="px-4 py-3 text-left font-normal" scope="row">
                    <span className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <row.Icon aria-hidden="true" className="size-4" />
                      </span>
                      {row.label}
                    </span>
                  </th>
                  <td className="px-4 py-3 text-center">
                    <PricingPill pricing={row.pricing} />
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
