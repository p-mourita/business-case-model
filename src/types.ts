export type ProductType = "software" | "hardware";

export interface GeneralInputs {
  productName: string;
  productType: ProductType;
  currency: string;
  years: number; // horizon, fixed to 5 in UI but kept generic
}

export interface CostInputs {
  // Upfront / Capex
  devCapex: number;              // R&D, engineering
  launchMarketingCapex: number;  // launch campaigns, certifications

  // Software-specific variable costs
  infraCostPerUser: number;      // cloud, hosting per active user
  licenseCostPerUser: number;    // 3rd party APIs, SaaS per user

  // Hardware-specific variable costs
  manufacturingCostPerUnit: number;
  shippingCostPerUnit: number;
  packagingCostPerUnit: number;

  // Common variable cost
  supportCostPerUnit: number;    // customer support per user/unit

  // Fixed annual operating expenses
  annualFixedOpex: number;       // salaries, overhead, etc.
}

export interface MarketInputs {
  tamUnitsPerYear: number[];     // TAM in units, per year
  samPct: number;                // % of TAM that is SAM
  somPct: number;                // % of SAM that is SOM
  adoptionPctPerYear: number[];  // % of SOM captured each year
}

export interface RevenueInputs {
  basePricePerUnit: number;
  annualPriceGrowthPct: number;
}

export interface Scenario {
  id: string;
  name: string;
  adoptionMultiplier: number;
  priceMultiplier: number;
}

export interface CompetitorInputs {
  competitorName: string;
  competitorPrice: number;
}

export interface YearlyResult {
  year: number;
  pricePerUnit: number;
  units: number;
  revenue: number;
  variableCost: number;
  grossProfit: number;
  grossMarginPct: number;
  fixedCost: number;
  netProfit: number;
  netMarginPct: number;
  cumulativeCashFlow: number;
}

export interface ScenarioResult {
  scenario: Scenario;
  yearly: YearlyResult[];
  totalRevenue: number;
  totalNetProfit: number;
  paybackYear: number | null;
  breakEvenUnits: number | null;
}
