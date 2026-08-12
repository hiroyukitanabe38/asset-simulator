"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { calculateFutureAssets } from "@/lib/finance/calculator";
import type { ContributionPeriod } from "@/types/finance";

type ReturnComparisonProps = {
  initialAssets: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
  contributionPeriods: ContributionPeriod[];
};

const formatManYen = (value: number) =>
  `${Math.round(value / 10_000).toLocaleString("ja-JP")}万円`;

export default function ReturnComparison({
  initialAssets,
  monthlyContribution,
  annualReturn,
  years,
  contributionPeriods,
}: ReturnComparisonProps) {
  const cautiousReturn = Math.max(-0.2, annualReturn - 0.02);
  const baseReturn = annualReturn;
  const optimisticReturn = Math.min(0.3, annualReturn + 0.02);

  const cautiousResult = calculateFutureAssets({
    initialAssets,
    monthlyContribution,
    annualReturn: cautiousReturn,
    years,
    contributionPeriods,
  });

  const baseResult = calculateFutureAssets({
    initialAssets,
    monthlyContribution,
    annualReturn: baseReturn,
    years,
    contributionPeriods,
  });

  const optimisticResult = calculateFutureAssets({
    initialAssets,
    monthlyContribution,
    annualReturn: optimisticReturn,
    years,
    contributionPeriods,
  });

  const chartData = baseResult.yearlyResults.map((baseYear, index) => ({
    year: baseYear.year,
    cautious:
      cautiousResult.yearlyResults[index]?.assets ?? 0,
    base:
      baseYear.assets,
    optimistic:
      optimisticResult.yearlyResults[index]?.assets ?? 0,
  }));

  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <div>
        <h2 className="text-xl font-bold">
          利回りが違ったら？
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          想定利回りの違いによる資産額の差を比較
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-500">
            慎重シナリオ
          </p>

          <p className="mt-2 text-lg font-bold">
            年利 {(cautiousReturn * 100).toFixed(1)}%
          </p>

          <p className="mt-3 text-2xl font-bold">
            {formatManYen(cautiousResult.finalAssets)}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            基本より
            {" "}
            {formatManYen(
              cautiousResult.finalAssets -
                baseResult.finalAssets
            )}
          </p>
        </div>

        <div className="rounded-2xl border-2 border-blue-500 p-5">
          <p className="text-sm font-medium text-blue-600">
            基本シナリオ
          </p>

          <p className="mt-2 text-lg font-bold">
            年利 {(baseReturn * 100).toFixed(1)}%
          </p>

          <p className="mt-3 text-2xl font-bold">
            {formatManYen(baseResult.finalAssets)}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            現在の設定
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-500">
            好調シナリオ
          </p>

          <p className="mt-2 text-lg font-bold">
            年利 {(optimisticReturn * 100).toFixed(1)}%
          </p>

          <p className="mt-3 text-2xl font-bold">
            {formatManYen(optimisticResult.finalAssets)}
          </p>

          <p className="mt-2 text-sm text-emerald-600">
            基本より
            {" "}
            +{formatManYen(
              optimisticResult.finalAssets -
                baseResult.finalAssets
            )}
          </p>
        </div>
      </div>

      <div className="mt-8 h-[420px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="year"
              tickFormatter={(value) => `${value}年`}
            />

            <YAxis
              tickFormatter={(value) =>
                formatManYen(Number(value))
              }
              width={90}
            />

            <Tooltip
              formatter={(value) =>
                formatManYen(Number(value))
              }
              labelFormatter={(value) =>
                `${value}年目`
              }
            />

            <Legend />

            <Line
              type="monotone"
              dataKey="cautious"
              name={`慎重 ${(cautiousReturn * 100).toFixed(1)}%`}
              stroke="#64748b"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="base"
              name={`基本 ${(baseReturn * 100).toFixed(1)}%`}
              stroke="#2563eb"
              strokeWidth={3}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="optimistic"
              name={`好調 ${(optimisticReturn * 100).toFixed(1)}%`}
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        ※ 各シナリオは設定した利回りが一定で継続した場合の試算です。
      </p>
    </section>
  );
}