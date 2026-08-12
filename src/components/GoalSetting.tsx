"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  calculateRequiredDuration,
  calculateRequiredMonthlyContribution,
  calculateRequiredReturn,
} from "@/lib/finance/calculator";

import type {
  ContributionPeriod,
} from "@/types/finance";

import NumericInput from "@/components/NumericInput";

type GoalSettingProps = {
  initialAssets: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
  contributionPeriods: ContributionPeriod[];
  finalAssets: number;
};

const formatYen = (
  value: number
) =>
  `${Math.round(
    value
  ).toLocaleString(
    "ja-JP"
  )}円`;

const formatManYen = (
  value: number
) =>
  `${Math.round(
    value / 10_000
  ).toLocaleString(
    "ja-JP"
  )}万円`;

export default function GoalSetting({
  initialAssets,
  monthlyContribution,
  annualReturn,
  years,
  contributionPeriods,
  finalAssets,
}: GoalSettingProps) {
  const [
    goalAmount,
    setGoalAmount,
  ] = useState(
    50_000_000
  );

  const difference =
    finalAssets -
    goalAmount;

  const achievementRate =
    goalAmount > 0
      ? (
          finalAssets /
          goalAmount
        ) * 100
      : 0;

  const goalReached =
    finalAssets >=
    goalAmount;

  const requiredMonthlyContribution =
    useMemo(() => {
      if (
        goalAmount <= 0
      ) {
        return null;
      }

      return calculateRequiredMonthlyContribution(
        goalAmount,
        initialAssets,
        annualReturn,
        years,
        monthlyContribution,
        contributionPeriods
      );
    }, [
      goalAmount,
      initialAssets,
      annualReturn,
      years,
      monthlyContribution,
      contributionPeriods,
    ]);

  const requiredReturn =
    useMemo(() => {
      if (
        goalAmount <= 0
      ) {
        return null;
      }

      return calculateRequiredReturn(
        goalAmount,
        initialAssets,
        monthlyContribution,
        years,
        contributionPeriods
      );
    }, [
      goalAmount,
      initialAssets,
      monthlyContribution,
      years,
      contributionPeriods,
    ]);

  const requiredDuration =
    useMemo(() => {
      if (
        goalAmount <= 0
      ) {
        return null;
      }

      return calculateRequiredDuration(
        goalAmount,
        initialAssets,
        monthlyContribution,
        annualReturn,
        years,
        contributionPeriods
      );
    }, [
      goalAmount,
      initialAssets,
      monthlyContribution,
      annualReturn,
      years,
      contributionPeriods,
    ]);

  const monthlyIncrease =
    requiredMonthlyContribution !==
    null
      ? Math.max(
          0,
          requiredMonthlyContribution -
            monthlyContribution
        )
      : null;

  const currentReturnPercent =
    annualReturn * 100;

  const requiredReturnPercent =
    requiredReturn !== null
      ? requiredReturn *
        100
      : null;

  const returnIncrease =
    requiredReturnPercent !==
    null
      ? Math.max(
          0,
          requiredReturnPercent -
            currentReturnPercent
        )
      : null;

  const currentMonths =
    years * 12;

  const durationIncreaseMonths =
    requiredDuration !==
    null
      ? Math.max(
          0,
          requiredDuration.months -
            currentMonths
        )
      : null;

  const extraYears =
    durationIncreaseMonths !==
    null
      ? Math.floor(
          durationIncreaseMonths /
            12
        )
      : null;

  const extraMonths =
    durationIncreaseMonths !==
    null
      ? durationIncreaseMonths %
        12
      : null;

  const formatExtension =
    () => {
      if (
        durationIncreaseMonths ===
        null
      ) {
        return "";
      }

      if (
        durationIncreaseMonths ===
        0
      ) {
        return "延長不要";
      }

      const parts: string[] =
        [];

      if (
        extraYears !== null &&
        extraYears > 0
      ) {
        parts.push(
          `＋${extraYears}年`
        );
      }

      if (
        extraMonths !== null &&
        extraMonths > 0
      ) {
        parts.push(
          `${extraMonths}か月`
        );
      }

      return parts.join("");
    };

  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <div>
        <h2 className="text-xl font-bold">
          ゴール設定
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          目標金額を設定して、
          今のプランでどこまで届くか確認
        </p>
      </div>

      {/* 目標金額 */}

      <div className="mt-6">
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-600">
            目標金額
          </span>

          <NumericInput
            value={
              goalAmount
            }

            onValueChange={
              setGoalAmount
            }

            min={1}

            suffix="円"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">
            目標金額
          </p>

          <p className="mt-2 text-2xl font-bold">
            {formatManYen(
              goalAmount
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">
            現在の予想
          </p>

          <p className="mt-2 text-2xl font-bold">
            {formatManYen(
              finalAssets
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">
            差額
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${
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
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">
            達成率
          </p>

          <p className="mt-2 text-2xl font-bold">
            {achievementRate.toFixed(
              1
            )}
            %
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full ${
              goalReached
                ? "bg-emerald-500"
                : "bg-blue-500"
            }`}

            style={{
              width: `${Math.min(
                100,
                achievementRate
              )}%`,
            }}
          />
        </div>
      </div>

      {goalReached ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-bold text-emerald-800">
            目標達成見込みです
          </p>

          <p className="mt-2 text-sm text-emerald-700">
            現在の条件では、
            目標金額を{" "}
            {formatYen(
              difference
            )}{" "}
            上回る見込みです。
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-bold text-amber-800">
            どうすれば達成できる？
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-white p-4">
              <p className="text-sm text-slate-500">
                積立額を増やす
              </p>

              {monthlyIncrease !==
              null ? (
                <>
                  <p className="mt-2 text-xl font-bold">
                    月＋
                    {Math.round(
                      monthlyIncrease
                    ).toLocaleString(
                      "ja-JP"
                    )}
                    円
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    必要基本積立額：{" "}
                    {formatYen(
                      requiredMonthlyContribution ??
                        0
                    )}
                  </p>

                  {contributionPeriods.length >
                    0 && (
                    <p className="mt-2 text-xs text-slate-400">
                      ※ 途中積立設定にも
                      同額を上乗せした場合
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  この条件では算出できません
                </p>
              )}
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-sm text-slate-500">
                運用期間を延ばす
              </p>

              {durationIncreaseMonths !==
              null ? (
                <>
                  <p className="mt-2 text-xl font-bold">
                    {formatExtension()}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    目標到達まで：{" "}
                    {requiredDuration
                      ? `${requiredDuration.years}年${requiredDuration.remainingMonths}か月`
                      : ""}
                  </p>

                  {contributionPeriods.length >
                    0 && (
                    <p className="mt-2 text-xs text-slate-400">
                      ※ 現在プラン終了後は、
                      最終月の積立額を継続
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  99年以内では到達しません
                </p>
              )}
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="text-sm text-slate-500">
                計算上の必要利回り
              </p>

              {returnIncrease !==
                null &&
              requiredReturnPercent !==
                null ? (
                <>
                  <p className="mt-2 text-xl font-bold">
                    ＋
                    {returnIncrease.toFixed(
                      1
                    )}
                    %
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    必要年利：{" "}
                    {requiredReturnPercent.toFixed(
                      1
                    )}
                    %
                  </p>

                  {contributionPeriods.length >
                    0 && (
                    <p className="mt-2 text-xs text-slate-400">
                      ※ 現在の途中積立設定を
                      そのまま反映
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  設定可能範囲では算出できません
                </p>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs text-amber-700">
            ※ 利回りを上げれば必ず達成できるという意味ではありません。
          </p>
        </div>
      )}
    </section>
  );
}