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
  if (millions >= 1) {
    return `${countFormat.format(millions)}M`;
  }
  return `${countFormat.format(millions * 1000)}k`;
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
  "bg-muted px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground";

const rowHeaderClass =
  "sticky left-0 bg-background px-4 py-4 text-left font-normal text-muted-foreground";

const planColumnClass = "min-w-36 px-4 py-4";

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string | string[] }>;
}) {
  const params = await searchParams;
  const billing = Array.isArray(params.billing)
    ? params.billing[0]
    : params.billing;
  const annual = billing !== "monthly";

  return (
    <main className="mx-auto flex w-full max-w-none flex-1 flex-col px-4 py-10 sm:px-6">
      <header className="mb-8 flex max-w-xl flex-col gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Plans</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {annual
              ? "Annual pricing for each plan, with two months free."
              : "Monthly pricing for each plan, with the most each plan includes."}
          </p>
        </div>
        <div className="flex w-fit rounded-lg border p-0.5 text-sm">
          <a
            href="/plans"
            aria-current={annual ? "page" : undefined}
            className={
              annual
                ? "rounded-md bg-foreground px-3 py-1 text-background"
                : "rounded-md px-3 py-1 text-muted-foreground"
            }
          >
            Annual
          </a>
          <a
            href="/plans?billing=monthly"
            aria-current={annual ? undefined : "page"}
            className={
              annual
                ? "rounded-md px-3 py-1 text-muted-foreground"
                : "rounded-md bg-foreground px-3 py-1 text-background"
            }
          >
            Monthly
          </a>
        </div>
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
              {plans.map((plan) => (
                <th
                  key={plan.name}
                  className="min-w-36 px-4 py-3 text-left font-medium"
                  scope="col"
                >
                  {plan.name}
                  <span className="mt-1 block font-normal text-muted-foreground">
                    <span className="tabular-nums">
                      {moneyFormat.format(
                        annual ? plan.annualMonthlyPrice : plan.price,
                      )}
                    </span>{" "}
                    {annual ? "billed annually" : "per month"}
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
                <td
                  key={plan.name}
                  className={`${planColumnClass} tabular-nums`}
                >
                  {countFormat.format(plan.annualCredits)}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    per year
                  </span>
                </td>
              ))}
            </tr>
            <tr className="border-t">
              <th className={rowHeaderClass} scope="row">
                Price per credit
              </th>
              {plans.map((plan) => (
                <td
                  key={plan.name}
                  className={`${planColumnClass} tabular-nums`}
                >
                  {moneyFormat.format(
                    (annual ? plan.annualMonthlyPrice : plan.price) /
                      plan.credits,
                  )}
                </td>
              ))}
            </tr>
            <tr className="border-t">
              <th
                className={`${groupHeaderClass} sticky left-0`}
                scope="colgroup"
              >
                Usage
              </th>
              {plans.map((plan) => (
                <th key={plan.name} className={groupHeaderClass} />
              ))}
            </tr>
            {limitRows.map((row) => (
              <tr key={row.label} className="border-t">
                <th className={rowHeaderClass} scope="row">
                  {row.label}
                </th>
                {plans.map((plan) => (
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
                Integrations
              </th>
              {plans.map((plan) => (
                <th key={plan.name} className={groupHeaderClass} />
              ))}
            </tr>
            {integrationRows.map((label) => (
              <tr key={label} className="border-t">
                <th className={rowHeaderClass} scope="row">
                  {label}
                </th>
                {plans.map((plan) => (
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
              {plans.map((plan) => (
                <th key={plan.name} className={groupHeaderClass} />
              ))}
            </tr>
            {securityRows.map((row) => (
              <tr key={row.label} className="border-t">
                <th className={rowHeaderClass} scope="row">
                  {row.label}
                </th>
                {plans.map((plan, index) => (
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
