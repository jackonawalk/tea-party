import { priceUsage } from "@/lib/pricing"

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

// Starter is the base, sized with the pricing calculator. Records are in
// millions and one action is one automation record.
const starterPrice = 500
const starterSyncedRows = .5
const starterProjectRecords = 0.25
const starterActions = 0.001

// Annual billing is the monthly price with two months free.
const monthsInYear = 12
const annualMonthsFree = 2

// Growth is 5 credits at twice Starter's mix, which is 0.4 of that mix per
// credit. Scale and larger tiers keep that mix so limits rise with credits.
const growthCredits = 5
const recordsPerCredit = 2 / growthCredits

type Tier = {
  name: string
  credits: number
  price: number
  users: number
  integrations: string[]
  customAddOn: boolean
  limitsFromCredits: boolean
}

const tiers: Tier[] = [
  { name: "Starter", credits: 1, price: 500, users: 3, integrations: ["Files", "SaaS"], customAddOn: false, limitsFromCredits: false },
  { name: "Growth", credits: 5, price: 1000, users: 10, integrations: ["SQL"], customAddOn: false, limitsFromCredits: false },
  { name: "Scale", credits: 10, price: 1700, users: 15, integrations: ["ERPs", "Warehouses"], customAddOn: true, limitsFromCredits: true },
  { name: "Enterprise", credits: 20, price: 3000, users: 25, integrations: [], customAddOn: true, limitsFromCredits: true },
  { name: "Volume 30", credits: 30, price: 4200, users: 35, integrations: [], customAddOn: true, limitsFromCredits: true },
  { name: "Volume 40", credits: 40, price: 5200, users: 50, integrations: [], customAddOn: true, limitsFromCredits: true },
  { name: "Volume 50", credits: 50, price: 6000, users: 65, integrations: [], customAddOn: true, limitsFromCredits: true },
  { name: "Volume 65", credits: 65, price: 7500, users: 80, integrations: [], customAddOn: true, limitsFromCredits: true },
  { name: "Volume 80", credits: 80, price: 8800, users: 100, integrations: [], customAddOn: true, limitsFromCredits: true },
  { name: "Volume 100", credits: 100, price: 10000, users: 150, integrations: [], customAddOn: true, limitsFromCredits: true },
]

function planFor(tier: Tier, index: number): Plan {
  const scale = tier.limitsFromCredits
    ? tier.credits * recordsPerCredit
    : tier.price / starterPrice
  const syncedRows = starterSyncedRows * scale
  const projectRecords = starterProjectRecords * scale
  const actions = starterActions * scale

  const priced = priceUsage({
    sources: [{ name: "Sources", recordsInMillions: syncedRows }],
    projects: [{ name: "Projects", recordsInMillions: projectRecords }],
    automations: [{ name: "Actions", recordsInMillions: actions }],
    whiteGlove: false,
  })

  const annualPrice = tier.price * (monthsInYear - annualMonthsFree)

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
