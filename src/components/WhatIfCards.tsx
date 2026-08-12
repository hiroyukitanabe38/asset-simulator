"use client";

import { calculateFutureAssets } from "@/lib/finance/calculator";
import type { ContributionPeriod } from "@/types/finance";

type WhatIfCardsProps = {
  initialAssets: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
  contributionPeriods: ContributionPeriod[];
  baseFinalAssets: number;

  onApplyMonthlyPlus: () => void;
  onApplyReturnPlus: () => void;
  onApplyFiveYears: () => void;
  onApplyBoth: () => void;
};

const formatManYen = (value: number) =>
  `${Math.round(value / 10_000).toLocaleString("ja-JP")}万円`;

export default function WhatIfCards({
  initialAssets,
  monthlyContribution,
  annualReturn,
  years,
  contributionPeriods,
  baseFinalAssets,

  onApplyMonthlyPlus,
  onApplyReturnPlus,
  onApplyFiveYears,
  onApplyBoth,
}: WhatIfCardsProps) {
  // =========================
  // 延長可能年数
  // 最大99年
  // =========================

  const extensionYears = Math.min(
    5,
    Math.max(0, 99 - years)
  );

  const extendedYears =
    years + extensionYears;

  // =========================
  // 最も終了月が遅い積立設定
  // =========================

  const lastContributionPeriod =
    contributionPeriods.length > 0
      ? contributionPeriods.reduce(
          (latest, current) =>
            current.endMonth > latest.endMonth
              ? current
              : latest
        )
      : null;

  // =========================
  // 月＋1万円
  // =========================

  const plus10kPeriods =
    contributionPeriods.map((period) => ({
      ...period,
      monthlyAmount:
        period.monthlyAmount + 10_000,
    }));

  const scenarioMonthlyPlus =
    calculateFutureAssets({
      initialAssets,

      monthlyContribution:
        monthlyContribution + 10_000,

      annualReturn,

      years,

      contributionPeriods:
        plus10kPeriods,
    });

  // =========================
  // 年利＋1％
  // =========================

  const returnIncrease =
    Math.max(
      0,
      Math.min(
        0.01,
        0.3 - annualReturn
      )
    );

  const increasedReturn =
    annualReturn + returnIncrease;

  const scenarioReturnPlus =
    calculateFutureAssets({
      initialAssets,

      monthlyContribution,

      annualReturn:
        increasedReturn,

      years,

      contributionPeriods,
    });

  // =========================
  // ＋最大5年
  // =========================

  const extendedPeriods =
    lastContributionPeriod &&
    extensionYears > 0
      ? [
          ...contributionPeriods,

          {
            startMonth:
              years * 12 + 1,

            endMonth:
              extendedYears * 12,

            monthlyAmount:
              lastContributionPeriod.monthlyAmount,
          },
        ]
      : contributionPeriods;

  const scenarioFiveYears =
    calculateFutureAssets({
      initialAssets,

      monthlyContribution,

      annualReturn,

      years:
        extendedYears,

      contributionPeriods:
        extendedPeriods,
    });

  // =========================
  // 月＋1万円 ＆ ＋最大5年
  // =========================

  const lastPlus10kPeriod =
    plus10kPeriods.length > 0
      ? plus10kPeriods.reduce(
          (latest, current) =>
            current.endMonth > latest.endMonth
              ? current
              : latest
        )
      : null;

  const extendedPlus10kPeriods =
    lastPlus10kPeriod &&
    extensionYears > 0
      ? [
          ...plus10kPeriods,

          {
            startMonth:
              years * 12 + 1,

            endMonth:
              extendedYears * 12,

            monthlyAmount:
              lastPlus10kPeriod.monthlyAmount,
          },
        ]
      : plus10kPeriods;

  const scenarioBoth =
    calculateFutureAssets({
      initialAssets,

      monthlyContribution:
        monthlyContribution + 10_000,

      annualReturn,

      years:
        extendedYears,

      contributionPeriods:
        extendedPlus10kPeriods,
    });

  // =========================
  // 表示タイトル
  // =========================

  const extensionTitle =
    extensionYears > 0
      ? `あと${extensionYears}年続けたら`
      : "運用期間は99年です";

  const bothTitle =
    extensionYears > 0
      ? `月＋1万円＆＋${extensionYears}年なら`
      : "月＋1万円＆期間延長";

  // =========================
  // カード
  //
  // titleではなく
  // 固有idをkeyとして使う
  // =========================

  const cards = [
    {
      id: "monthly-plus",

      title:
        "月＋1万円なら",

      description:
        "毎月の積立額を1万円増やした場合",

      value:
        scenarioMonthlyPlus.finalAssets,

      onApply:
        onApplyMonthlyPlus,

      disabled:
        false,
    },

    {
      id: "return-plus",

      title:
        returnIncrease > 0
          ? `年利＋${(
              returnIncrease * 100
            ).toFixed(1)}％なら`
          : "年利は上限30％です",

      description:
        returnIncrease > 0
          ? "想定年利を1％上げた場合"
          : "想定年利の設定上限に達しています",

      value:
        scenarioReturnPlus.finalAssets,

      onApply:
        onApplyReturnPlus,

      disabled:
        returnIncrease <= 0,
    },

    {
      id: "years-plus",

      title:
        extensionTitle,

      description:
        extensionYears > 0
          ? `運用期間を${extensionYears}年間延ばした場合`
          : "運用期間の上限に達しています",

      value:
        scenarioFiveYears.finalAssets,

      onApply:
        onApplyFiveYears,

      disabled:
        extensionYears <= 0,
    },

    {
      id: "monthly-and-years-plus",

      title:
        bothTitle,

      description:
        extensionYears > 0
          ? `積立額を1万円増やして${extensionYears}年間延長した場合`
          : "運用期間が99年のため、期間延長できません",

      value:
        scenarioBoth.finalAssets,

      onApply:
        onApplyBoth,

      disabled:
        extensionYears <= 0,
    },
  ];

  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <div>
        <h2 className="text-xl font-bold">
          もしも？
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          条件を少し変えると、
          未来はどう変わる？
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const difference =
            card.value -
            baseFinalAssets;

          return (
            <button
              key={card.id}
              type="button"

              onClick={
                card.onApply
              }

              disabled={
                card.disabled
              }

              className={`
                group
                rounded-2xl
                border
                p-5
                text-left
                transition
                duration-200
                ${
                  card.disabled
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50"
                    : "border-slate-200 bg-white hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                }
              `}
            >
              <p className="text-sm font-medium text-slate-600">
                {card.title}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {card.description}
              </p>

              <p className="mt-4 text-2xl font-bold">
                {formatManYen(
                  card.value
                )}
              </p>

              <p
                className={`mt-2 text-sm font-bold ${
                  difference >= 0
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                {difference >= 0
                  ? "+"
                  : ""}

                {formatManYen(
                  difference
                )}
              </p>

              {!card.disabled ? (
                <p className="mt-4 text-sm font-bold text-blue-600">
                  この条件を試す →
                </p>
              ) : (
                <p className="mt-4 text-xs text-slate-400">
                  現在の上限設定では
                  適用できません
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}