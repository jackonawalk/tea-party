import type { Metadata } from "next";
import { Check } from "lucide-react";
import { plans, type Plan } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Plans",
  robots: {
    index: false,
    follow: false,
  },
};

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const countFormat = new Intl.NumberFormat("en-US");

function actionsLabel(actions: number) {
  if (actions >= 1000000) {
    return `${actions / 1000000}M`;
  }
  return `${actions / 1000}k`;
}

const limitRows: {
  label: string;
  note?: string;
  value: (plan: Plan) => string;
}[] = [
  {
    label: "Sources",
    note: "records",
    value: (plan) => `${countFormat.format(plan.upToSyncedRows)}M`,
  },
  {
    label: "Projects",
    note: "records",
    value: (plan) => `${countFormat.format(plan.upToProjectRecords * 1000)}k`,
  },
  {
    label: "Workflows",
    note: "actions",
    value: (plan) => actionsLabel(plan.actionsPerMonth),
  },
  { label: "Users", value: (plan) => countFormat.format(plan.upToUsers) },
  { label: "LLM tokens", value: () => "Unlimited" },
];

const integrationRows = [
  "Files",
  "SaaS",
  "SQL",
  "Warehouses",
  "ERPs",
  "Custom",
];

// fromPlan is the index of the first plan that includes the feature.
const securityRows = [
  { label: "Encryption at rest and in transit", fromPlan: 0 },
  { label: "Role-based access", fromPlan: 1 },
  { label: "SSO", fromPlan: 2 },
  { label: "Audit logs", fromPlan: 2 },
];

const groupHeaderClass =
  "bg-muted/50 px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground";

const rowHeaderClass = "px-4 py-4 text-left font-normal text-muted-foreground";

export default function PlansPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-xl">
        <h1 className="text-2xl font-medium tracking-tight">Plans</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Monthly pricing for each plan, with the most each plan includes.
        </p>
      </header>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <caption className="sr-only">Plan prices and limits</caption>
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-medium" scope="col">
                <span className="sr-only">Plan</span>
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.name}
                  className="px-4 py-3 text-left font-medium"
                  scope="col"
                >
                  {plan.name}
                  <span className="mt-1 block text-muted-foreground">
                    <span className="tabular-nums">
                      {moneyFormat.format(plan.price)}
                    </span>{" "}
                    per month
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className={rowHeaderClass} scope="row">
                Credits
              </th>
              {plans.map((plan) => (
                <td key={plan.name} className="px-4 py-4 tabular-nums">
                  {plan.credits}
                </td>
              ))}
            </tr>
            <tr className="border-t">
              <th
                className={groupHeaderClass}
                colSpan={plans.length + 1}
                scope="colgroup"
              >
                Usage
              </th>
            </tr>
            {limitRows.map((row) => (
              <tr key={row.label} className="border-t">
                <th className={rowHeaderClass} scope="row">
                  {row.label}
                </th>
                {plans.map((plan) => (
                  <td key={plan.name} className="px-4 py-4 tabular-nums">
                    {row.value(plan)}
                    {row.note && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {row.note}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t">
              <th
                className={groupHeaderClass}
                colSpan={plans.length + 1}
                scope="colgroup"
              >
                Integrations
              </th>
            </tr>
            {integrationRows.map((label) => (
              <tr key={label} className="border-t">
                <th className={rowHeaderClass} scope="row">
                  {label}
                </th>
                {plans.map((plan) => (
                  <td key={plan.name} className="px-4 py-4">
                    {label === "Custom" ? (
                      plan.name === "Scale" || plan.name === "Enterprise" ? (
                        <span className="text-muted-foreground">Add-on</span>
                      ) : null
                    ) : plan.integrations.includes(label) ? (
                      <Check className="size-4" aria-label="Included" />
                    ) : (
                      <span className="sr-only">Not included</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t">
              <th
                className={groupHeaderClass}
                colSpan={plans.length + 1}
                scope="colgroup"
              >
                Security
              </th>
            </tr>
            {securityRows.map((row) => (
              <tr key={row.label} className="border-t">
                <th className={rowHeaderClass} scope="row">
                  {row.label}
                </th>
                {plans.map((plan, index) => (
                  <td key={plan.name} className="px-4 py-4">
                    {index >= row.fromPlan ? (
                      <Check className="size-4" aria-label="Included" />
                    ) : (
                      <span className="sr-only">Not included</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
