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

function projectRecordsLabel(millions: number) {
  // Floor the label. Rounding up can push the example into the next plan
  // when those records are entered in the calculator.
  if (millions >= 1) {
    const shown = Math.floor(millions * 1000) / 1000;
    return `${countFormat.format(shown)}M`;
  }
  const thousands = Math.floor(millions * 10000) / 10;
  return `${countFormat.format(thousands)}k`;
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
    value: (plan) => projectRecordsLabel(plan.upToProjectRecords),
  },
  {
    label: "Automations",
    note: "actions",
    value: (plan) => actionsLabel(plan.actionsPerMonth),
  },
  { label: "Users", value: () => "Unlimited" },
  { label: "LLM tokens", value: () => "Unlimited" },
];

const integrationRows = ["Files", "SaaS", "SQL", "BYOW", "ERPs", "Custom"];

// fromPlan is the index of the first plan that includes the feature.
const securityRows = [
  { label: "Encryption at rest and in transit", fromPlan: 0 },
  { label: "Role-based access", fromPlan: 1 },
  { label: "SSO", fromPlan: 2 },
  { label: "Audit logs", fromPlan: 2 },
];

const groupHeaderClass =
  "bg-muted px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground";

const rowHeaderClass =
  "sticky left-0 bg-background px-4 py-4 text-left font-normal text-muted-foreground";

const planColumnClass = "min-w-36 px-4 py-4";

const visiblePlans = plans.slice(0, 4);

export default function PlansPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight">Plans</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Annual pricing for each plan.
        </p>
      </header>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Plan prices and limits</caption>
          <thead>
            <tr className="border-b">
              <th
                className="sticky left-0 bg-background px-4 py-3 text-left font-medium"
                scope="col"
              >
                <span className="sr-only">Plan</span>
              </th>
              {visiblePlans.map((plan) => (
                <th
                  key={plan.name}
                  className="min-w-36 px-4 py-3 text-left font-medium"
                  scope="col"
                >
                  {plan.name}
                  <span className="mt-1 block font-normal text-muted-foreground">
                    <span className="tabular-nums">
                      {moneyFormat.format(plan.annualPrice)}
                    </span>{" "}
                    per year
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
              {visiblePlans.map((plan) => (
                <td
                  key={plan.name}
                  className={`${planColumnClass} tabular-nums`}
                >
                  {countFormat.format(plan.annualCredits)}
                </td>
              ))}
            </tr>
            <tr className="border-t">
              <th className={rowHeaderClass} scope="row">
                Price per credit
              </th>
              {visiblePlans.map((plan) => (
                <td
                  key={plan.name}
                  className={`${planColumnClass} tabular-nums`}
                >
                  {moneyFormat.format(plan.annualPrice / plan.annualCredits)}
                </td>
              ))}
            </tr>
            <tr className="border-t">
              <th
                className={`${groupHeaderClass} sticky left-0`}
                scope="colgroup"
              >
                Monthly Usage
              </th>
              {visiblePlans.map((plan) => (
                <th key={plan.name} className={groupHeaderClass} />
              ))}
            </tr>
            {limitRows.map((row) => (
              <tr key={row.label} className="border-t">
                <th className={rowHeaderClass} scope="row">
                  {row.label}
                </th>
                {visiblePlans.map((plan) => (
                  <td
                    key={plan.name}
                    className={`${planColumnClass} tabular-nums`}
                  >
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
                className={`${groupHeaderClass} sticky left-0`}
                scope="colgroup"
              >
                Data Sources
              </th>
              {visiblePlans.map((plan) => (
                <th key={plan.name} className={groupHeaderClass} />
              ))}
            </tr>
            {integrationRows.map((label) => (
              <tr key={label} className="border-t">
                <th className={rowHeaderClass} scope="row">
                  {label}
                </th>
                {visiblePlans.map((plan) => (
                  <td key={plan.name} className={planColumnClass}>
                    {label === "Custom" ? (
                      plan.customAddOn ? (
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
                className={`${groupHeaderClass} sticky left-0`}
                scope="colgroup"
              >
                Security
              </th>
              {visiblePlans.map((plan) => (
                <th key={plan.name} className={groupHeaderClass} />
              ))}
            </tr>
            {securityRows.map((row) => (
              <tr key={row.label} className="border-t">
                <th className={rowHeaderClass} scope="row">
                  {row.label}
                </th>
                {visiblePlans.map((plan, index) => (
                  <td key={plan.name} className={planColumnClass}>
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
