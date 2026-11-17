import { daysInMonth, priceUsage } from "@/lib/pricing"

export type Plan = {
  integrations: string[]
  name: string
  price: number
  credits: number
  annualCredits: number
  pricePerCredit: number
  annualPrice: number
  annualMonthlyPrice: number
  customAddOn: boolean
  upToSyncedRows: number
  upToProjectRecords: number
  actionsPerMonth: number
  upToUsers: number
  estimatedSpend: number
}

// Actions keep a separate scale and do not spend credits. Records are in
// millions and one action is one automation record.
const starterPrice = 500
const starterActions = 0.001

const monthsInYear = 12

// Half of a plan's monthly credits are suggested as sources, half as projects.
// Projects are measured daily, so that half is spread across the month.
const sourceCreditShare = 0.5

type Tier = {
  name: string
  credits: number
  price: number
  users: number
  integrations: string[]
  customAddOn: boolean
}

// Enterprise prices are about 85% of what Fivetran + Snowflake would cost for
// the same usage with 5 sources (see lib/compare.ts as of November 2026),
// rounded to the nearest $50. Growth and Scale already sit near 85%. Price per
// credit falls with every tier while the bill grows slowly.
// Enterprise 12 is 350 credits at $112,800 a year.
const tiers: Tier[] = [
  { name: "Starter", credits: 1, price: 500, users: 3, integrations: ["Files", "SaaS"], customAddOn: false },
  { name: "Growth", credits: 3, price: 1000, users: 10, integrations: ["SQL"], customAddOn: false },
  { name: "Scale", credits: 5, price: 1400, users: 15, integrations: ["ERPs", "BYOW"], customAddOn: true },
  { name: "Enterprise Bronze", credits: 8, price: 2050, users: 25, integrations: [], customAddOn: true },
  { name: "Enterprise Silver", credits: 12, price: 2600, users: 35, integrations: [], customAddOn: true },
  { name: "Enterprise Gold", credits: 18, price: 3050, users: 50, integrations: [], customAddOn: true },
  { name: "Enterprise 4", credits: 25, price: 3550, users: 55, integrations: [], customAddOn: true },
  { name: "Enterprise 5", credits: 35, price: 4300, users: 60, integrations: [], customAddOn: true },
  { name: "Enterprise 6", credits: 50, price: 4900, users: 70, integrations: [], customAddOn: true },
  { name: "Enterprise 7", credits: 70, price: 5400, users: 75, integrations: [], customAddOn: true },
  { name: "Enterprise 8", credits: 100, price: 6200, users: 85, integrations: [], customAddOn: true },
  { name: "Enterprise 9", credits: 140, price: 7200, users: 95, integrations: [], customAddOn: true },
  { name: "Enterprise 10", credits: 200, price: 8050, users: 100, integrations: [], customAddOn: true },
  { name: "Enterprise 11", credits: 280, price: 8800, users: 110, integrations: [], customAddOn: true },
  { name: "Enterprise 12", credits: 350, price: 9400, users: 120, integrations: [], customAddOn: true },
]

function planFor(tier: Tier, index: number): Plan {
  const scale = tier.price / starterPrice
  const syncedRows = tier.credits * sourceCreditShare
  const projectRecords =
    (tier.credits * (1 - sourceCreditShare)) / daysInMonth
  const actions = starterActions * scale

  const priced = priceUsage({
    sources: [{ name: "Sources", recordsInMillions: syncedRows }],
    projects: [{ name: "Projects", recordsInMillions: projectRecords }],
    automations: [{ name: "Actions", recordsInMillions: actions }],
    whiteGlove: false,
  })

  const annualPrice = tier.price * monthsInYear

  return {
    name: tier.name,
    price: tier.price,
    credits: tier.credits,
    annualCredits: tier.credits * monthsInYear,
    pricePerCredit: tier.price / tier.credits,
    annualPrice,
    annualMonthlyPrice: Math.round(annualPrice / monthsInYear),
    customAddOn: tier.customAddOn,
    integrations: tiers
      .slice(0, index + 1)
      .flatMap((earlier) => earlier.integrations),
    upToSyncedRows: syncedRows,
    upToProjectRecords: projectRecords,
    actionsPerMonth: Math.round(actions * 1000000),
    upToUsers: tier.users,
    estimatedSpend: priced.monthlyTotal,
  }
}

export const plans = tiers.map(planFor)

// The smallest plan whose included credits cover the usage. Usage above the
// largest plan still suggests the largest plan.
export function suggestPlan(creditsUsed: number) {
  const fits = plans.find((plan) => plan.credits >= creditsUsed)
  return fits === undefined ? plans[plans.length - 1] : fits
}
