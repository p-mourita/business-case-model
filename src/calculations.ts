import {
  CostInputs,
  GeneralInputs,
  MarketInputs,
  RevenueInputs,
  Scenario,
  ScenarioResult,
  YearlyResult
} from "./types";

function getVariableCostPerUnit(productType: "software" | "hardware", cost: CostInputs): number {
  if (productType === "software") {
    return (
      cost.infraCostPerUser +
      cost.licenseCostPerUser +
      cost.supportCostPerUnit
    );
  }
  return (
    cost.manufacturingCostPerUnit +
    cost.shippingCostPerUnit +
    cost.packagingCostPerUnit +
    cost.supportCostPerUnit
  );
}

export function buildScenarioResult(
  general: GeneralInputs,
  cost: CostInputs,
  market: MarketInputs,
  revenue: RevenueInputs,
  scenario: Scenario
): ScenarioResult {
  const years = general.years;
  const yearly: YearlyResult[] = [];

  const upfrontCapex = cost.devCapex + cost.launchMarketingCapex;
  let cumulativeCashFlow = -upfrontCapex;
  let paybackYear: number | null = null;

  const unitVariableCost = getVariableCostPerUnit(general.productType, cost);

  for (let i = 0; i < years; i++) {
    const yearIndex = i;
    const basePrice =
      revenue.basePricePerUnit *
      Math.pow(1 + revenue.annualPriceGrowthPct / 100, i);
    const pricePerUnit = basePrice * scenario.priceMultiplier;

    const tamUnits = market.tamUnitsPerYear[i] ?? 0;
    const samUnits = tamUnits * (market.samPct / 100);
    const somUnits = samUnits * (market.somPct / 100);
    const adoptionPct = (market.adoptionPctPerYear[i] ?? 0) / 100;

    const baseUnits = somUnits * adoptionPct;
    const units = baseUnits * scenario.adoptionMultiplier;

    const revenueYear = pricePerUnit * units;
    const variableCost = unitVariableCost * units;
    const grossProfit = revenueYear - variableCost;
    const fixedCost = cost.annualFixedOpex;
    const netProfit = grossProfit - fixedCost;

    cumulativeCashFlow += netProfit;

    if (paybackYear === null && cumulativeCashFlow >= 0) {
      paybackYear = yearIndex + 1; // human readable (Year 1..5)
    }

    const grossMarginPct =
      revenueYear > 0 ? (grossProfit / revenueYear) * 100 : 0;
    const netMarginPct =
      revenueYear > 0 ? (netProfit / revenueYear) * 100 : 0;

    yearly.push({
      year: yearIndex + 1,
      pricePerUnit,
      units,
      revenue: revenueYear,
      variableCost,
      grossProfit,
      grossMarginPct,
      fixedCost,
      netProfit,
      netMarginPct,
      cumulativeCashFlow
    });
  }

  const totalRevenue = yearly.reduce((s, y) => s + y.revenue, 0);
  const totalNetProfit = yearly.reduce((s, y) => s + y.netProfit, 0);

  const contributionMargin = revenue.basePricePerUnit - unitVariableCost;
  const breakEvenUnits =
    contributionMargin > 0 ? upfrontCapex / contributionMargin : null;

  return {
    scenario,
    yearly,
    totalRevenue,
    totalNetProfit,
    paybackYear,
    breakEvenUnits
  };
}
