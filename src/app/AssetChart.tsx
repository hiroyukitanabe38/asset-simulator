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

type AssetChartData = {
  year: number;
  assets: number;
  principal: number;
  profit: number;
};

type AssetChartProps = {
  data: AssetChartData[];
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

export default function AssetChart({
  data,
}: AssetChartProps) {
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

  return (
    <div className="h-[330px] w-full sm:h-[400px]">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart
          data={data}
          margin={{
            top: 20,

            right:
              isMobile
                ? 8
                : 20,

            bottom: 0,

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
            strokeDasharray="4 4"
          />

          {/* =========================
              X軸
          ========================= */}

          <XAxis
            dataKey="year"
            tickFormatter={(
              value
            ) =>
              `${value}年`
            }
            tick={{
              fontSize:
                isMobile
                  ? 12
                  : 14,
            }}
            minTickGap={
              isMobile
                ? 16
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
                  ? "総資産"
                  : name ===
                      "principal"
                    ? "元本"
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
              label
            ) =>
              `${label}年`
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
                return "総資産";
              }

              if (
                value ===
                "principal"
              ) {
                return "元本";
              }

              return value;
            }}
          />

          {/* =========================
              元本
          ========================= */}

          <Area
            type="monotone"
            dataKey="principal"
            name="principal"
            stroke="#64748b"
            fill="#cbd5e1"
            fillOpacity={
              0.35
            }
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
            }}
          />

          {/* =========================
              総資産
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
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}