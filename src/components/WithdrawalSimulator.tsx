"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  calculateFutureAssets,
  calculateWithdrawalSimulation,
  type WithdrawalMethod,
} from "@/lib/finance/calculator";

import type {
  ContributionPeriod,
} from "@/types/finance";

import NumericInput from "@/components/NumericInput";
import WithdrawalChart from "@/components/WithdrawalChart";
import WithdrawalYearlyTable from "@/components/WithdrawalYearlyTable";

type DisplayMode =
  | "age"
  | "year";

type WithdrawalSimulatorProps = {
  currentAge: number;

  defaultStartAge: number;

  initialAssets: number;

  monthlyContribution: number;

  accumulationReturn: number;

  contributionPeriods: ContributionPeriod[];
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

export default function WithdrawalSimulator({
  currentAge,
  defaultStartAge,
  initialAssets,
  monthlyContribution,
  accumulationReturn,
  contributionPeriods,
}: WithdrawalSimulatorProps) {
  // =========================
  // 表示方法
  // =========================

  const [
    displayMode,
    setDisplayMode,
  ] = useState<DisplayMode>(
    "age"
  );

  // =========================
  // 取り崩し開始年齢
  // =========================

  const [
    withdrawalStartAge,
    setWithdrawalStartAge,
  ] = useState(
    defaultStartAge
  );

  useEffect(() => {
    setWithdrawalStartAge(
      defaultStartAge
    );
  }, [
    defaultStartAge,
  ]);

  // =========================
  // 取り崩し条件
  // =========================

  const [
    method,
    setMethod,
  ] = useState<WithdrawalMethod>(
    "fixed"
  );

  const [
    monthlyWithdrawal,
    setMonthlyWithdrawal,
  ] = useState(
    200_000
  );

  const [
    annualWithdrawalRate,
    setAnnualWithdrawalRate,
  ] = useState(
    4
  );

  const [
    withdrawalReturn,
    setWithdrawalReturn,
  ] = useState(
    3
  );

  const [
    withdrawalYears,
    setWithdrawalYears,
  ] = useState(
    30
  );

  // =========================
  // 資産形成表示年齢
  // =========================

  const accumulationDisplayAge =
    defaultStartAge;

  // =========================
  // 現在 → 取り崩し開始
  // =========================

  const accumulationYears =
    Math.max(
      0,
      withdrawalStartAge -
        currentAge
    );

  // =========================
  // 取り崩し開始時点の資産
  // =========================

  const startingAssets =
    useMemo(() => {
      if (
        accumulationYears <=
        0
      ) {
        return initialAssets;
      }

      const accumulationResult =
        calculateFutureAssets({
          initialAssets,

          monthlyContribution,

          annualReturn:
            accumulationReturn,

          years:
            Math.min(
              99,
              accumulationYears
            ),

          contributionPeriods,
        });

      return accumulationResult.finalAssets;
    }, [
      accumulationYears,
      initialAssets,
      monthlyContribution,
      accumulationReturn,
      contributionPeriods,
    ]);

  // =========================
  // 取り崩し計算
  // =========================

  const result =
    useMemo(() => {
      return calculateWithdrawalSimulation({
        initialAssets:
          startingAssets,

        annualReturn:
          withdrawalReturn /
          100,

        years:
          withdrawalYears,

        method,

        monthlyWithdrawal:
          method ===
          "fixed"
            ? monthlyWithdrawal
            : undefined,

        annualWithdrawalRate:
          method ===
          "percentage"
            ? annualWithdrawalRate /
              100
            : undefined,
      });
    }, [
      startingAssets,
      withdrawalReturn,
      withdrawalYears,
      method,
      monthlyWithdrawal,
      annualWithdrawalRate,
    ]);

  // =========================
  // 資産寿命
  // =========================

  const assetLifeMainText =
    result.depleted &&
    result.depletionYears !==
      null &&
    result.depletionRemainingMonths !==
      null
      ? `${result.depletionYears}年${result.depletionRemainingMonths}か月`
      : `${withdrawalYears}年以上`;

  const assetLifeSubText =
    result.depleted
      ? "この時点で資産が尽きる見込み"
      : `${withdrawalYears}年後も${formatManYen(
          result.finalAssets
        )}残る見込み`;

  // =========================
  // 初年度年間取り崩し
  // =========================

  const firstYearWithdrawal =
    result.yearlyResults[0]
      ?.yearlyWithdrawal ??
    0;

  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">

      {/* =========================
          タイトル
      ========================= */}

      <div>
        <h2 className="text-xl font-bold">
          取り崩しシミュレーション
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          取り崩し開始年齢を設定して、
          資産がどのくらい持つか確認
        </p>
      </div>

      {/* =========================
          開始設定
      ========================= */}

      <div className="mt-6 grid gap-5 rounded-2xl bg-slate-50 p-5 md:grid-cols-2">

        {/* 開始年齢 */}

        <label>
          <span className="mb-2 block text-sm font-medium text-slate-600">
            取り崩し開始年齢
          </span>

          <NumericInput
            value={
              withdrawalStartAge
            }

            onValueChange={
              setWithdrawalStartAge
            }

            min={
              currentAge
            }

            max={
              Math.min(
                120,
                currentAge +
                  99
              )
            }

            suffix="歳"
          />

          <p className="mt-2 text-xs text-slate-400">
            現在
            {currentAge}
            歳から
            {accumulationYears}
            年後
          </p>
        </label>

        {/* 開始資産 */}

        <div>
          <p className="text-sm text-slate-500">
            取り崩し開始時点の予想資産
          </p>

          <p className="mt-3 text-3xl font-bold">
            {formatManYen(
              startingAssets
            )}
          </p>
        </div>

        {/* =========================
            補足
        ========================= */}

        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p className="text-slate-600">
              資産形成シミュレーション表示：
              <span className="font-bold text-slate-900">
                {" "}
                {accumulationDisplayAge}
                歳時点
              </span>
            </p>

            <p className="text-slate-600">
              取り崩し開始：
              <span className="font-bold text-slate-900">
                {" "}
                {withdrawalStartAge}
                歳
              </span>
            </p>
          </div>

          {withdrawalStartAge !==
            accumulationDisplayAge && (
            <p className="mt-3 text-xs leading-5 text-blue-600">
              取り崩し計算では、
              {withdrawalStartAge}
              歳時点の資産を再計算しています。
            </p>
          )}
        </div>
      </div>

      {/* =========================
          方法
      ========================= */}

      <div className="mt-6">
        <p className="text-sm font-medium text-slate-600">
          取り崩し方法
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            type="button"

            onClick={() =>
              setMethod(
                "fixed"
              )
            }

            className={`
              rounded-2xl
              border
              p-4
              text-left
              transition
              ${
                method ===
                "fixed"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }
            `}
          >
            <p className="font-bold">
              定額取り崩し
            </p>

            <p className="mt-1 text-sm text-slate-500">
              毎月決まった金額を取り崩す
            </p>
          </button>

          <button
            type="button"

            onClick={() =>
              setMethod(
                "percentage"
              )
            }

            className={`
              rounded-2xl
              border
              p-4
              text-left
              transition
              ${
                method ===
                "percentage"
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }
            `}
          >
            <p className="font-bold">
              定率取り崩し
            </p>

            <p className="mt-1 text-sm text-slate-500">
              年初残高に対して一定割合を取り崩す
            </p>
          </button>
        </div>
      </div>

      {/* =========================
          入力
      ========================= */}

      <div className="mt-6 grid gap-6 md:grid-cols-2">

        {method ===
        "fixed" ? (
          <label>
            <span className="mb-2 block text-sm font-medium text-slate-600">
              毎月の取り崩し額
            </span>

            <NumericInput
              value={
                monthlyWithdrawal
              }

              onValueChange={
                setMonthlyWithdrawal
              }

              min={0}

              suffix="円"
            />
          </label>
        ) : (
          <label>
            <span className="mb-2 block text-sm font-medium text-slate-600">
              年間取り崩し率
            </span>

            <NumericInput
              value={
                annualWithdrawalRate
              }

              onValueChange={
                setAnnualWithdrawalRate
              }

              min={0}
              max={100}

              allowDecimal

              suffix="%"
            />

            <p className="mt-2 text-xs text-slate-400">
              年初残高 × 設定率を12分割し、
              その年は毎月同額を取り崩します。
            </p>
          </label>
        )}

        <label>
          <span className="mb-2 block text-sm font-medium text-slate-600">
            取り崩し中の想定年利
          </span>

          <NumericInput
            value={
              withdrawalReturn
            }

            onValueChange={
              setWithdrawalReturn
            }

            min={-20}
            max={30}

            allowDecimal
            allowNegative

            suffix="%"
          />
        </label>

        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-medium text-slate-600">
            取り崩し期間
          </span>

          <div className="md:max-w-[50%]">
            <NumericInput
              value={
                withdrawalYears
              }

              onValueChange={
                setWithdrawalYears
              }

              min={1}
              max={99}

              suffix="年"
            />
          </div>
        </label>
      </div>

      {/* =========================
          結果カード
      ========================= */}

      <div className="mt-8 grid gap-4 md:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">
            最終残高
          </p>

          <p className="mt-2 text-2xl font-bold">
            {formatManYen(
              result.finalAssets
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">
            累計取り崩し額
          </p>

          <p className="mt-2 text-2xl font-bold">
            {formatManYen(
              result.totalWithdrawn
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          {method ===
          "fixed" ? (
            <>
              <p className="text-sm text-slate-500">
                年間取り崩し額
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatManYen(
                  firstYearWithdrawal
                )}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500">
                初年度の月額
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatYen(
                  result.initialMonthlyWithdrawal
                )}
              </p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">
            資産寿命
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${
              result.depleted
                ? "text-red-500"
                : "text-emerald-600"
            }`}
          >
            {assetLifeMainText}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            {assetLifeSubText}
          </p>
        </div>
      </div>

      {/* =========================
          グラフ
      ========================= */}

      <div className="mt-8 border-t border-slate-100 pt-8">

        {/* タイトル＋切替 */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-bold">
              取り崩し後の資産推移
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              資産残高と累計取り崩し額の推移
            </p>
          </div>

          <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">

            <button
              type="button"

              onClick={() =>
                setDisplayMode(
                  "age"
                )
              }

              className={`
                rounded-lg
                px-4
                py-2
                text-sm
                font-bold
                transition
                ${
                  displayMode ===
                  "age"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500"
                }
              `}
            >
              年齢で表示
            </button>

            <button
              type="button"

              onClick={() =>
                setDisplayMode(
                  "year"
                )
              }

              className={`
                rounded-lg
                px-4
                py-2
                text-sm
                font-bold
                transition
                ${
                  displayMode ===
                  "year"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500"
                }
              `}
            >
              年数で表示
            </button>
          </div>
        </div>

        <div className="mt-6">
          <WithdrawalChart
            data={
              result.yearlyResults
            }

            displayMode={
              displayMode
            }

            withdrawalStartAge={
              withdrawalStartAge
            }
          />
        </div>
      </div>

      {/* =========================
          一覧
      ========================= */}

      <WithdrawalYearlyTable
        data={
          result.yearlyResults
        }

        displayMode={
          displayMode
        }

        withdrawalStartAge={
          withdrawalStartAge
        }
      />

      {/* =========================
          定率補足
      ========================= */}

      {method ===
        "percentage" && (
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="font-bold text-blue-800">
            定率取り崩しの考え方
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-700">
            各年の年初資産に設定した取り崩し率を掛けて、
            その年の年間取り崩し額を決定します。
            その金額を12分割し、
            1年間は毎月同額を取り崩します。
            翌年になると、
            その時点の資産残高をもとに再計算します。
          </p>
        </div>
      )}

      <p className="mt-5 text-xs text-slate-400">
        ※ 月初に取り崩した後、
        残った資産を1か月運用する前提です。
      </p>
    </section>
  );
}