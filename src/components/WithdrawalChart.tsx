"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  WithdrawalYearlyResult,
} from "@/lib/finance/calculator";

type DisplayMode =
  | "age"
  | "year";

type WithdrawalChartProps = {
  data: WithdrawalYearlyResult[];

  displayMode: DisplayMode;

  withdrawalStartAge: number;
};

// =========================
// PC用 Y軸表示
// =========================

function formatDesktopManYen(
  value: number
) {
  if (value === 0) {
    return "0万円";
  }

  return `${Math.round(
    value / 10_000
  ).toLocaleString(
    "ja-JP"
  )}万円`;
}

// =========================
// スマホ用 Y軸表示
// =========================

function formatMobileManYen(
  value: number
) {
  if (value === 0) {
    return "0";
  }

  return `${Math.round(
    value / 10_000
  ).toLocaleString(
    "ja-JP"
  )}万`;
}

// =========================
// Tooltip
// =========================

function formatTooltipYen(
  value: number
) {
  return `${Math.round(
    value
  ).toLocaleString(
    "ja-JP"
  )}円`;
}

export default function WithdrawalChart({
  data,
  displayMode,
  withdrawalStartAge,
}: WithdrawalChartProps) {
  const [
    isMobile,
    setIsMobile,
  ] = useState(false);

  // =========================
  // スマホ判定
  // iPhone Safari互換
  // =========================

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(max-width: 640px)"
      );

    const updateIsMobile =
      () => {
        setIsMobile(
          mediaQuery.matches
        );
      };

    // 初回判定
    updateIsMobile();

    // 新しいブラウザ
    if (
      typeof mediaQuery.addEventListener ===
      "function"
    ) {
      mediaQuery.addEventListener(
        "change",
        updateIsMobile
      );

      return () => {
        mediaQuery.removeEventListener(
          "change",
          updateIsMobile
        );
      };
    }

    // 古いSafari / iPhone向け
    if (
      typeof mediaQuery.addListener ===
      "function"
    ) {
      mediaQuery.addListener(
        updateIsMobile
      );

      return () => {
        mediaQuery.removeListener(
          updateIsMobile
        );
      };
    }

    return;
  }, []);

  // =========================
  // グラフ用データ
  // =========================

  const chartData =
    data.map((row) => ({
      year:
        row.year,

      age:
        withdrawalStartAge +
        row.year -
        1,

      assets:
        row.endAssets,

      totalWithdrawn:
        row.totalWithdrawn,
    }));

  // =========================
  // X軸
  // =========================

  const xDataKey =
    displayMode ===
    "age"
      ? "age"
      : "year";

  return (
    <div className="h-[330px] w-full sm:h-[420px]">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart
          data={
            chartData
          }
          margin={{
            top: 20,

            right:
              isMobile
                ? 8
                : 20,

            bottom: 10,

            left:
              isMobile
                ? 0
                : 20,
          }}
        >
          {/* =========================
              グリッド
          ========================= */}

          <CartesianGrid
            strokeDasharray="3 3"
          />

          {/* =========================
              X軸
          ========================= */}

          <XAxis
            dataKey={
              xDataKey
            }
            tickFormatter={(
              value
            ) =>
              displayMode ===
              "age"
                ? `${value}歳`
                : `${value}年`
            }
            tick={{
              fontSize:
                isMobile
                  ? 12
                  : 14,
            }}
            minTickGap={
              isMobile
                ? 18
                : 8
            }
          />

          {/* =========================
              Y軸
          ========================= */}

          <YAxis
            width={
              isMobile
                ? 64
                : 90
            }
            tickFormatter={
              isMobile
                ? formatMobileManYen
                : formatDesktopManYen
            }
            tick={{
              fontSize:
                isMobile
                  ? 11
                  : 14,
            }}
          />

          {/* =========================
              Tooltip
          ========================= */}

          <Tooltip
            formatter={(
              value,
              name
            ) => {
              const numericValue =
                typeof value ===
                  "number"
                  ? value
                  : Number(
                      value
                    );

              const label =
                name ===
                "assets"
                  ? "資産残高"
                  : name ===
                      "totalWithdrawn"
                    ? "累計取り崩し額"
                    : String(
                        name
                      );

              return [
                formatTooltipYen(
                  numericValue
                ),
                label,
              ];
            }}
            labelFormatter={(
              value
            ) =>
              displayMode ===
              "age"
                ? `${value}歳`
                : `${value}年目`
            }
          />

          {/* =========================
              凡例
          ========================= */}

          <Legend
            formatter={(
              value
            ) => {
              if (
                value ===
                "assets"
              ) {
                return "資産残高";
              }

              if (
                value ===
                "totalWithdrawn"
              ) {
                return "累計取り崩し額";
              }

              return value;
            }}
          />

          {/* =========================
              資産残高
          ========================= */}

          <Area
            type="monotone"
            dataKey="assets"
            name="assets"
            stroke="#2563eb"
            fill="#93c5fd"
            fillOpacity={
              0.45
            }
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
            }}
          />

          {/* =========================
              累計取り崩し額
          ========================= */}

          <Area
            type="monotone"
            dataKey="totalWithdrawn"
            name="totalWithdrawn"
            stroke="#10b981"
            fill="#a7f3d0"
            fillOpacity={
              0.3
            }
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}