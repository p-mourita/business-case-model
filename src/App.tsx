import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

import {
  CompetitorInputs,
  CostInputs,
  GeneralInputs,
  MarketInputs,
  RevenueInputs,
  Scenario,
  ScenarioResult
} from "./types";

import { buildScenarioResult } from "./calculations";
import { exportToCSV, exportToXLSX, exportToPDF } from "./exports";

// YEARS CONSTANT
const YEARS = 5;

/* ---------------------------
   DEFAULT MODEL VALUES
---------------------------- */
const defaultGeneral: GeneralInputs = {
  productName: "New Product",
  productType: "software",
  currency: "€",
  years: YEARS
};

const defaultCost: CostInputs = {
  devCapex: 200000,
  launchMarketingCapex: 50000,
  infraCostPerUser: 1.5,
  licenseCostPerUser: 0.5,
  manufacturingCostPerUnit: 40,
  shippingCostPerUnit: 5,
  packagingCostPerUnit: 3,
  supportCostPerUnit: 2,
  annualFixedOpex: 150000
};

const defaultMarket: MarketInputs = {
  tamUnitsPerYear: [100000, 120000, 150000, 180000, 200000],
  samPct: 40,
  somPct: 30,
  adoptionPctPerYear: [1, 3, 5, 7, 10]
};

const defaultRevenue: RevenueInputs = {
  basePricePerUnit: 99,
  annualPriceGrowthPct: 3
};

const defaultScenarios: Scenario[] = [
  { id: "conservative", name: "Conservative", adoptionMultiplier: 0.6, priceMultiplier: 0.95 },
  { id: "base",         name: "Base",         adoptionMultiplier: 1.0, priceMultiplier: 1.0 },
  { id: "aggressive",   name: "Aggressive",   adoptionMultiplier: 1.4, priceMultiplier: 1.05 }
];

const defaultCompetitor: CompetitorInputs = {
  competitorName: "Main Competitor",
  competitorPrice: 109
};

/* ---------------------------
   SMALL HELPERS
---------------------------- */
const fmtCurrency = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const fmtCurrencyShort = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}`;

const fmtPct = (value: number) => `${value.toFixed(1)}%`;

/* ---------------------------
   MAIN APP
---------------------------- */
const App: React.FC = () => {
  const [general, setGeneral] = useState<GeneralInputs>(defaultGeneral);
  const [cost, setCost] = useState<CostInputs>(defaultCost);
  const [market, setMarket] = useState<MarketInputs>(defaultMarket);
  const [revenue, setRevenue] = useState<RevenueInputs>(defaultRevenue);
  const [scenarios] = useState<Scenario[]>(defaultScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("base");
  const [competitor, setCompetitor] = useState<CompetitorInputs>(defaultCompetitor);

  const selectedScenario =
    scenarios.find((s) => s.id === selectedScenarioId) ?? scenarios[1];

  /* ---------------------------
     BUILD ALL SCENARIO RESULTS
  ---------------------------- */
  const scenarioResults: ScenarioResult[] = useMemo(
    () =>
      scenarios.map((s) =>
        buildScenarioResult(general, cost, market, revenue, s)
      ),
    [general, cost, market, revenue, scenarios]
  );

  const currentResult = scenarioResults.find(
    (r) => r.scenario.id === selectedScenario.id
  )!;

  /* ---------------------------
     SENSITIVITY ANALYSIS
  ---------------------------- */
  const sensitivityData = useMemo(() => {
    const delta = 0.1;

    const computeNet = (multiplier: number) => {
      const testScenario: Scenario = {
        id: "temp",
        name: "tmp",
        adoptionMultiplier: selectedScenario.adoptionMultiplier,
        priceMultiplier: selectedScenario.priceMultiplier * multiplier
      };
      return buildScenarioResult(general, cost, market, revenue, testScenario)
        .totalNetProfit;
    };

    return [
      { label: "-10% price", net: computeNet(1 - delta) },
      { label: "Base price", net: currentResult.totalNetProfit },
      { label: "+10% price", net: computeNet(1 + delta) }
    ];
  }, [currentResult.totalNetProfit, general, cost, market, revenue, selectedScenario]);

  const competitorDelta =
    competitor.competitorPrice > 0
      ? ((revenue.basePricePerUnit - competitor.competitorPrice) /
          competitor.competitorPrice) *
        100
      : null;

  /* ---------------------------
     RENDER UI
  ---------------------------- */
  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      {/* HEADER */}
      <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Product Business Case Calculator
          </h1>
          <p className="text-sm text-slate-600">
            Standardised 5-year business case model for software & hardware products — with scenarios,
            market sizing, break-even and sensitivity analysis.
          </p>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.75fr)]">
        {/* LEFT COLUMN – INPUT FORMS */}
        <section className="flex flex-col gap-4">

          {/* General */}
          <Card title="General">
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Product name"
                value={general.productName}
                onChange={(v) => setGeneral({ ...general, productName: v })}
              />
              <SelectInput
                label="Product type"
                value={general.productType}
                options={[
                  { value: "software", label: "Software" },
                  { value: "hardware", label: "Hardware" }
                ]}
                onChange={(v) =>
                  setGeneral({ ...general, productType: v as "software" | "hardware" })
                }
              />
              <TextInput
                label="Currency"
                value={general.currency}
                onChange={(v) => setGeneral({ ...general, currency: v })}
              />
              <NumberInput
                label="Horizon (years)"
                value={general.years}
                min={1}
                max={10}
                onChange={(v) => setGeneral({ ...general, years: v || YEARS })}
              />
            </div>
          </Card>

          {/* Costs */}
          <Card title="Costs">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Upfront / Capex
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput
                label="Development capex"
                currency={general.currency}
                value={cost.devCapex}
                onChange={(v) => setCost({ ...cost, devCapex: v })}
              />
              <CurrencyInput
                label="Launch & certification capex"
                currency={general.currency}
                value={cost.launchMarketingCapex}
                onChange={(v) => setCost({ ...cost, launchMarketingCapex: v })}
              />
            </div>

            <h4 className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Variable cost per unit/user
            </h4>

            {general.productType === "software" ? (
              <div className="grid grid-cols-2 gap-3">
                <CurrencyInput
                  label="Infra cost per user"
                  currency={general.currency}
                  value={cost.infraCostPerUser}
                  onChange={(v) => setCost({ ...cost, infraCostPerUser: v })}
                />
                <CurrencyInput
                  label="3rd party licenses per user"
                  currency={general.currency}
                  value={cost.licenseCostPerUser}
                  onChange={(v) => setCost({ ...cost, licenseCostPerUser: v })}
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <CurrencyInput
                  label="Manufacturing per unit"
                  currency={general.currency}
                  value={cost.manufacturingCostPerUnit}
                  onChange={(v) =>
                    setCost({ ...cost, manufacturingCostPerUnit: v })
                  }
                />
                <CurrencyInput
                  label="Shipping per unit"
                  currency={general.currency}
                  value={cost.shippingCostPerUnit}
                  onChange={(v) => setCost({ ...cost, shippingCostPerUnit: v })}
                />
                <CurrencyInput
                  label="Packaging per unit"
                  currency={general.currency}
                  value={cost.packagingCostPerUnit}
                  onChange={(v) =>
                    setCost({ ...cost, packagingCostPerUnit: v })
                  }
                />
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3">
              <CurrencyInput
                label="Support per unit/user"
                currency={general.currency}
                value={cost.supportCostPerUnit}
                onChange={(v) =>
                  setCost({ ...cost, supportCostPerUnit: v })
                }
              />
              <CurrencyInput
                label="Annual fixed opex"
                currency={general.currency}
                value={cost.annualFixedOpex}
                onChange={(v) => setCost({ ...cost, annualFixedOpex: v })}
              />
            </div>
          </Card>

          {/* Market Sizing */}
          <Card title="Market sizing (TAM/SAM/SOM)">
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  TAM (units per year)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: general.years }).map((_, i) => (
                    <NumberInput
                      key={i}
                      label={`Y${i + 1}`}
                      hideLabel
                      value={market.tamUnitsPerYear[i] ?? 0}
                      onChange={(v) => {
                        const arr = [...market.tamUnitsPerYear];
                        arr[i] = v;
                        setMarket({ ...market, tamUnitsPerYear: arr });
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumberInput
                  label="SAM (% of TAM)"
                  value={market.samPct}
                  onChange={(v) => setMarket({ ...market, samPct: v })}
                />

                <NumberInput
                  label="SOM (% of SAM)"
                  value={market.somPct}
                  onChange={(v) => setMarket({ ...market, somPct: v })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Adoption (% of SOM captured per year)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: general.years }).map((_, i) => (
                    <NumberInput
                      key={i}
                      hideLabel
                      value={market.adoptionPctPerYear[i] ?? 0}
                      onChange={(v) => {
                        const arr = [...market.adoptionPctPerYear];
                        arr[i] = v;
                        setMarket({ ...market, adoptionPctPerYear: arr });
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing & competitor */}
          <Card title="Pricing & competitor">
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput
                label="Price per unit — Year 1"
                currency={general.currency}
                value={revenue.basePricePerUnit}
                onChange={(v) =>
                  setRevenue({ ...revenue, basePricePerUnit: v })
                }
              />
              <NumberInput
                label="Annual price growth (%)"
                value={revenue.annualPriceGrowthPct}
                onChange={(v) =>
                  setRevenue({ ...revenue, annualPriceGrowthPct: v })
                }
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <TextInput
                label="Competitor name"
                value={competitor.competitorName}
                onChange={(v) =>
                  setCompetitor({ ...competitor, competitorName: v })
                }
              />
              <CurrencyInput
                label="Competitor price"
                currency={general.currency}
                value={competitor.competitorPrice}
                onChange={(v) =>
                  setCompetitor({ ...competitor, competitorPrice: v })
                }
              />
            </div>

            {competitorDelta !== null && (
              <p className="mt-2 text-xs text-slate-600">
                Your price is{" "}
                <span
                  className={
                    competitorDelta > 0
                      ? "text-emerald-700 font-semibold"
                      : "text-rose-700 font-semibold"
                  }
                >
                  {competitorDelta >= 0 ? "+" : ""}
                  {competitorDelta.toFixed(1)}%
                </span>{" "}
                vs {competitor.competitorName}.
              </p>
            )}
          </Card>
        </section>

        {/* RIGHT COLUMN – RESULTS & CHARTS */}
        <section className="flex flex-col gap-4">

          {/* Scenario Summary */}
          <Card title="Scenario summary">
            <div className="mb-3 flex flex-wrap gap-2">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenarioId(s.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    s.id === selectedScenarioId
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <SummaryTile
                label="Total revenue (5y)"
                value={fmtCurrency(currentResult.totalRevenue, general.currency)}
              />
              <SummaryTile
                label="Total net profit (5y)"
                value={fmtCurrency(currentResult.totalNetProfit, general.currency)}
              />
              <SummaryTile
                label="Payback year"
                value={
                  currentResult.paybackYear
                    ? `Year ${currentResult.paybackYear}`
                    : "Not reached"
                }
              />
              <SummaryTile
                label="Break-even units"
                value={
                  currentResult.breakEvenUnits
                    ? currentResult.breakEvenUnits.toFixed(0)
                    : "N/A"
                }
              />
            </div>
          </Card>

          {/* Revenue + Net Profit */}
          <Card title="Revenue & net profit over time">
            <ChartWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={currentResult.yearly.map((y) => ({
                    year: `Y${y.year}`,
                    revenue: y.revenue,
                    netProfit: y.netProfit
                  }))}
                  margin={{ left: -20, right: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) =>
                      fmtCurrencyShort(value as number, general.currency)
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="netProfit"
                    name="Net profit"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </Card>

          {/* Units + Margins */}
          <Card title="Units & margin evolution">
            <div className="grid gap-3 md:grid-cols-2">

              {/* Units */}
              <ChartWrapper>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={currentResult.yearly.map((y) => ({
                      year: `Y${y.year}`,
                      units: y.units
                    }))}
                    margin={{ left: -20, right: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => `${v.toLocaleString()}`} />
                    <Tooltip
                      formatter={(value) =>
                        (value as number).toLocaleString()
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="units"
                      name="Units"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartWrapper>

              {/* Margins */}
              <ChartWrapper>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={currentResult.yearly.map((y) => ({
                      year: `Y${y.year}`,
                      gross: y.grossMarginPct,
                      net: y.netMarginPct
                    }))}
                    margin={{ left: -20, right: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} />
                    <Tooltip formatter={(value) => fmtPct(value as number)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="gross"
                      name="Gross margin %"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      name="Net margin %"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartWrapper>

            </div>
          </Card>

          {/* Scenario Comparison */}
          <Card title="Scenario comparison — revenue (5y)">
            <ChartWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={Array.from({ length: general.years }).map((_, i) => {
                    const row: any = { year: `Y${i + 1}` };
                    scenarioResults.forEach((r) => {
                      row[r.scenario.name] = r.yearly[i]?.revenue ?? 0;
                    });
                    return row;
                  })}
                  margin={{ left: -20, right: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) =>
                      fmtCurrencyShort(value as number, general.currency)
                    }
                  />
                  <Legend />
                  {scenarioResults.map((r, index) => {
                    const colors = ["#6b7280", "#2563eb", "#16a34a"];
                    return (
                      <Line
                        key={r.scenario.id}
                        type="monotone"
                        dataKey={r.scenario.name}
                        name={r.scenario.name}
                        stroke={colors[index] ?? "#6b7280"}
                        strokeWidth={2}
                        dot={false}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </Card>

          {/* Sensitivity Analysis */}
          <Card title="Sensitivity analysis — price vs net profit (5y)">
            <p className="mb-2 text-xs text-slate-600">
              Impact on 5-year net profit when price changes by ±10% in the current scenario.
            </p>
            <ChartWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sensitivityData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value) =>
                      fmtCurrencyShort(value as number, general.currency)
                    }
                  />
                  <Bar dataKey="net" name="Total net profit (5y)" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </Card>

        </section>
      </main>

      {/* ---------------------------
          EXPORT BUTTON BAR
      ---------------------------- */}
      <div className="mt-5 flex justify-end">
        <div className="flex gap-2 rounded-full bg-white px-4 py-2 text-xs shadow-md ring-1 ring-slate-200">
          <span className="self-center text-[11px] text-slate-500">
            Export:
          </span>

          <button
            className="rounded-full border border-slate-300 px-3 py-1 hover:border-blue-400"
            onClick={() => exportToCSV(currentResult, general.currency)}
          >
            CSV
          </button>

          <button
            className="rounded-full border border-slate-300 px-3 py-1 hover:border-blue-400"
            onClick={() => exportToXLSX(currentResult, general.currency)}
          >
            XLSX
          </button>

          <button
            className="rounded-full border border-slate-300 px-3 py-1 hover:border-blue-400"
            onClick={() => exportToPDF(currentResult, general.currency)}
          >
            PDF
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   REUSABLE SMALL UI COMPONENTS
============================================================================ */

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children
}) => (
  <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
    <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
    {children}
  </section>
);

const SummaryTile: React.FC<{ label: string; value: string }> = ({
  label,
  value
}) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

const ChartWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-56 w-full rounded-xl bg-slate-50 p-2">
    {children}
  </div>
);

/* INPUT COMPONENTS */

interface BaseInputProps {
  label: string;
  hideLabel?: boolean;
}

const TextInput: React.FC<
  BaseInputProps & { value: string; onChange: (v: string) => void }
> = ({ label, value, onChange, hideLabel }) => (
  <label className="flex flex-col gap-1 text-xs">
    {!hideLabel && (
      <span className="font-medium text-slate-700">{label}</span>
    )}
    <input
      className="rounded-lg border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

const NumberInput: React.FC<
  BaseInputProps & {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
  }
> = ({ label, value, onChange, hideLabel, min, max }) => (
  <label className="flex flex-col gap-1 text-xs">
    {!hideLabel && (
      <span className="font-medium text-slate-700">{label}</span>
    )}
    <input
      type="number"
      min={min}
      max={max}
      className="rounded-lg border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
    />
  </label>
);

const CurrencyInput: React.FC<
  BaseInputProps & {
    value: number;
    onChange: (v: number) => void;
    currency: string;
  }
> = ({ label, value, onChange, currency }) => (
  <label className="flex flex-col gap-1 text-xs">
    <span className="font-medium text-slate-700">{label}</span>
    <div className="flex items-center gap-1">
      <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
        {currency}
      </span>
      <input
        type="number"
        className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  </label>
);

const SelectInput: React.FC<
  BaseInputProps & {
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
  }
> = ({ label, value, options, onChange }) => (
  <label className="flex flex-col gap-1 text-xs">
    <span className="font-medium text-slate-700">{label}</span>
    <select
      className="rounded-lg border border-slate-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </label>
);

export default App;
