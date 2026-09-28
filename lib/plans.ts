import { priceUsage } from "@/lib/pricing"

export type Plan = {
  integrations: string[]
  name: string
  price: number
  upToSyncedRows: number
  upToProjectRecords: number
  actionsPerMonth: number
  upToUsers: number
  estimatedSpend: number
}

// Starter is the base, sized with the pricing calculator. Records are in
// millions and one action is one automation record.
const starterPrice = 500
const starterSyncedRows = 1
const starterProjectRecords = 0.25
const starterActions = 0.001

const tiers = [
  { name: "Starter", price: 500, users: 3, integrations: ["Files", "SaaS"] },
  { name: "Growth", price: 1000, users: 10, integrations: ["SQL"] },
  { name: "Scale", price: 3000, users: 25, integrations: ["ERPs", "Warehouses"] },
  { name: "Enterprise", price: 10000, users: 50, integrations: [] },
]

function planFor(tier: (typeof tiers)[number], index: number): Plan {
  // Every plan keeps Starter's mix and scales it with the monthly price.
  const scale = tier.price / starterPrice
  const syncedRows = starterSyncedRows * scale
  const projectRecords = starterProjectRecords * scale
  const actions = starterActions * scale

  const priced = priceUsage({
    sources: [{ name: "Sources", recordsInMillions: syncedRows }],
    projects: [{ name: "Projects", recordsInMillions: projectRecords }],
    automations: [{ name: "Actions", recordsInMillions: actions }],
    whiteGlove: false,
  })

  return {
    name: tier.name,
    price: tier.price,
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
