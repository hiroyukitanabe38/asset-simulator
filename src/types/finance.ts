export type InvestmentStyle =
  | "lump_and_monthly"
  | "monthly_only"
  | "lump_only";

export type ContributionPeriod = {
  startMonth: number;
  endMonth: number;
  monthlyAmount: number;
};

export type SimulationInput = {
  initialAssets: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
  investmentStyle?: InvestmentStyle;
  contributionPeriods?: ContributionPeriod[];
};

export type MonthlyResult = {
  month: number;
  assets: number;
  principal: number;
};

export type YearlyResult = {
  year: number;
  assets: number;
  principal: number;
  profit: number;
};

export type SimulationResult = {
  finalAssets: number;
  totalPrincipal: number;
  totalProfit: number;
  monthlyResults: MonthlyResult[];
  yearlyResults: YearlyResult[];
};