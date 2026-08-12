"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  calculateFutureAssets,
} from "@/lib/finance/calculator";

import AssetChart from "./AssetChart";

import ContributionSettings, {
  ContributionSetting,
} from "@/components/ContributionSettings";

import WhatIfCards from "@/components/WhatIfCards";

import GoalSetting from "@/components/GoalSetting";

import YearlyAssetTable from "@/components/YearlyAssetTable";

import NumericInput from "@/components/NumericInput";

import WithdrawalSimulator from "@/components/WithdrawalSimulator";

import SavedSimulations from "@/components/SavedSimulations";

// =========================
// タブ
// =========================

type TabType =
  | "simulation"
  | "whatif"
  | "goal"
  | "withdrawal";

// =========================
// シミュレーション状態
// =========================

type SimulationState = {
  currentAge: number;

  initialAssets: number;

  monthlyContribution: number;

  annualReturn: number;

  years: number;

  useCustomContributions: boolean;

  contributionSettings:
    ContributionSetting[];
};

// =========================
// 初期状態
// =========================

const INITIAL_STATE: SimulationState = {
  currentAge: 40,

  initialAssets:
    3_000_000,

  monthlyContribution:
    100_000,

  annualReturn:
    5,

  years:
    20,

  useCustomContributions:
    false,

  contributionSettings:
    [],
};

export default function Home() {
  // =========================
  // 表示タブ
  // =========================

  const [
    activeTab,
    setActiveTab,
  ] = useState<TabType>(
    "simulation"
  );

  // =========================
  // 年次一覧
  // =========================

  const [
    showYearlyTable,
    setShowYearlyTable,
  ] = useState(false);

  // =========================
  // 基本条件
  // =========================

  const [
    currentAge,
    setCurrentAge,
  ] = useState(
    INITIAL_STATE.currentAge
  );

  const [
    initialAssets,
    setInitialAssets,
  ] = useState(
    INITIAL_STATE.initialAssets
  );

  const [
    monthlyContribution,
    setMonthlyContribution,
  ] = useState(
    INITIAL_STATE.monthlyContribution
  );

  const [
    annualReturn,
    setAnnualReturn,
  ] = useState(
    INITIAL_STATE.annualReturn
  );

  const [
    years,
    setYears,
  ] = useState(
    INITIAL_STATE.years
  );

  // =========================
  // 積立途中変更
  // =========================

  const [
    useCustomContributions,
    setUseCustomContributions,
  ] = useState(
    INITIAL_STATE.useCustomContributions
  );

  const [
    contributionSettings,
    setContributionSettings,
  ] = useState<
    ContributionSetting[]
  >(
    INITIAL_STATE.contributionSettings
  );

  const [
    hasContributionError,
    setHasContributionError,
  ] = useState(false);

  // =========================
  // 1つ前の状態
  // =========================

  const [
    previousState,
    setPreviousState,
  ] = useState<
    SimulationState | null
  >(null);

  // =========================
  // 現在状態
  // =========================

  const getCurrentState =
    (): SimulationState => ({
      currentAge,

      initialAssets,

      monthlyContribution,

      annualReturn,

      years,

      useCustomContributions,

      contributionSettings:
        contributionSettings.map(
          (setting) => ({
            ...setting,
          })
        ),
    });

  // =========================
  // 状態保存
  // =========================

  const saveCurrentState =
    () => {
      setPreviousState(
        getCurrentState()
      );
    };

  // =========================
  // 状態復元
  // =========================

  const restoreState = (
    state: SimulationState
  ) => {
    setCurrentAge(
      state.currentAge
    );

    setInitialAssets(
      state.initialAssets
    );

    setMonthlyContribution(
      state.monthlyContribution
    );

    setAnnualReturn(
      state.annualReturn
    );

    setYears(
      state.years
    );

    setUseCustomContributions(
      state.useCustomContributions
    );

    setContributionSettings(
      state.contributionSettings.map(
        (setting) => ({
          ...setting,
        })
      )
    );

    setHasContributionError(false);
  };

  // =========================
  // お気に入り条件を使用
  // =========================

  const loadSavedSimulation = (
    state: SimulationState
  ) => {
    saveCurrentState();

    restoreState(state);

    setShowYearlyTable(false);

    setActiveTab(
      "simulation"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // 1つ前に戻す
  // =========================

  const undoLastChange =
    () => {
      if (
        !previousState
      ) {
        return;
      }

      const stateToRestore =
        previousState;

      setPreviousState(
        getCurrentState()
      );

      restoreState(
        stateToRestore
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // =========================
  // 初期状態
  // =========================

  const resetToInitial =
    () => {
      saveCurrentState();

      restoreState(
        INITIAL_STATE
      );

      setShowYearlyTable(
        false
      );

      setActiveTab(
        "simulation"
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // =========================
  // 積立設定 → 月単位
  // =========================

  const contributionPeriods =
    useMemo(() => {
      if (
        !useCustomContributions
      ) {
        return [];
      }

      return contributionSettings.map(
        (setting) => ({
          startMonth:
            (
              setting.startYear -
              1
            ) *
              12 +
            1,

          endMonth:
            (
              setting.endYear ??
              years
            ) *
            12,

          monthlyAmount:
            setting.monthlyAmount,
        })
      );
    }, [
      useCustomContributions,
      contributionSettings,
      years,
    ]);

  // =========================
  // 計算可否
  // =========================

  const canCalculate =
    !useCustomContributions ||
    !hasContributionError;

  // =========================
  // メイン計算
  // =========================

  const result =
    useMemo(() => {
      if (
        !canCalculate
      ) {
        return null;
      }

      return calculateFutureAssets({
        initialAssets,

        monthlyContribution,

        annualReturn:
          annualReturn /
          100,

        years,

        contributionPeriods,
      });
    }, [
      initialAssets,
      monthlyContribution,
      annualReturn,
      years,
      contributionPeriods,
      canCalculate,
    ]);

  // =========================
  // 金額表示
  // =========================

  const formatYen = (
    value: number
  ) =>
    `${Math.round(
      value
    ).toLocaleString(
      "ja-JP"
    )}円`;

  // =========================
  // 最後の積立設定
  // =========================

  const getLastContributionSetting =
    (
      settings:
        ContributionSetting[]
    ) => {
      if (
        settings.length ===
        0
      ) {
        return null;
      }

      return settings.reduce(
        (
          latest,
          current
        ) =>
          (
            current.endYear ??
            years
          ) >
          (
            latest.endYear ??
            years
          )
            ? current
            : latest
      );
    };

  // =========================
  // もしも？ 月＋1万円
  // =========================

  const applyMonthlyPlus =
    () => {
      saveCurrentState();

      setMonthlyContribution(
        (current) =>
          current +
          10_000
      );

      if (
        useCustomContributions
      ) {
        setContributionSettings(
          (current) =>
            current.map(
              (setting) => ({
                ...setting,

                monthlyAmount:
                  setting.monthlyAmount +
                  10_000,
              })
            )
        );
      }

      setActiveTab(
        "simulation"
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // =========================
  // もしも？ 年利＋1％
  // =========================

  const applyReturnPlus =
    () => {
      saveCurrentState();

      setAnnualReturn(
        (current) =>
          Math.min(
            30,
            current + 1
          )
      );

      setActiveTab(
        "simulation"
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // =========================
  // もしも？ ＋最大5年
  // =========================

  const applyFiveYears =
    () => {
      const oldYears =
        years;

      const extensionYears =
        Math.min(
          5,
          99 - oldYears
        );

      if (
        extensionYears <= 0
      ) {
        return;
      }

      saveCurrentState();

      const newYears =
        oldYears +
        extensionYears;

      if (
        useCustomContributions &&
        contributionSettings.length >
          0
      ) {
        setContributionSettings(
          (current) => {
            const lastSetting =
              getLastContributionSetting(
                current
              );

            if (
              !lastSetting
            ) {
              return current;
            }

            if (
              lastSetting.endYear ===
              null
            ) {
              return current;
            }

            return [
              ...current,

              {
                startYear:
                  oldYears +
                  1,

                endYear:
                  newYears,

                monthlyAmount:
                  lastSetting.monthlyAmount,
              },
            ];
          }
        );
      }

      setYears(
        newYears
      );

      setActiveTab(
        "simulation"
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // =========================
  // もしも？
  // 月＋1万円＆＋最大5年
  // =========================

  const applyBoth =
    () => {
      const oldYears =
        years;

      const extensionYears =
        Math.min(
          5,
          99 - oldYears
        );

      saveCurrentState();

      const newYears =
        oldYears +
        extensionYears;

      setMonthlyContribution(
        (current) =>
          current +
          10_000
      );

      if (
        useCustomContributions
      ) {
        setContributionSettings(
          (current) => {
            const increasedSettings =
              current.map(
                (setting) => ({
                  ...setting,

                  monthlyAmount:
                    setting.monthlyAmount +
                    10_000,
                })
              );

            if (
              increasedSettings.length ===
                0 ||
              extensionYears <=
                0
            ) {
              return increasedSettings;
            }

            const lastSetting =
              getLastContributionSetting(
                increasedSettings
              );

            if (
              !lastSetting
            ) {
              return increasedSettings;
            }

            if (
              lastSetting.endYear ===
              null
            ) {
              return increasedSettings;
            }

            return [
              ...increasedSettings,

              {
                startYear:
                  oldYears +
                  1,

                endYear:
                  newYears,

                monthlyAmount:
                  lastSetting.monthlyAmount,
              },
            ];
          }
        );
      }

      if (
        extensionYears > 0
      ) {
        setYears(
          newYears
        );
      }

      setActiveTab(
        "simulation"
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  // =========================
  // タブ
  // =========================

  const tabs: {
    id: TabType;
    label: string;
  }[] = [
    {
      id: "simulation",
      label:
        "シミュレーション",
    },

    {
      id: "whatif",
      label:
        "もしも？",
    },

    {
      id: "goal",
      label:
        "目標設定",
    },

    {
      id: "withdrawal",
      label:
        "取り崩し",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-10">
      <div className="mx-auto max-w-5xl">

        {/* =========================
            ヘッダー
        ========================= */}

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">
              資産シミュレーター
            </h1>

            <p className="mt-2 text-slate-500">
              積立から取り崩しまで、将来の資産を確認
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"

              onClick={
                undoLastChange
              }

              disabled={
                !previousState
              }

              className={`
                rounded-xl
                border
                px-4
                py-2.5
                text-sm
                font-bold
                transition
                ${
                  previousState
                    ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                }
              `}
            >
              ↩ 1つ前に戻す
            </button>

            <button
              type="button"

              onClick={
                resetToInitial
              }

              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              ↻ 初期状態に戻す
            </button>
          </div>
        </div>

        {/* =========================
            タブ
            スマホ 2×2
            PC 1×4
        ========================= */}

        <div className="mt-8 rounded-2xl bg-slate-200/70 p-1.5">
          <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
            {tabs.map(
              (tab) => (
                <button
                  key={
                    tab.id
                  }

                  type="button"

                  onClick={() =>
                    setActiveTab(
                      tab.id
                    )
                  }

                  className={`
                    min-w-0
                    rounded-xl
                    px-2
                    py-3
                    text-center
                    text-sm
                    font-bold
                    transition
                    sm:px-4
                    ${
                      activeTab ===
                      tab.id
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }
                  `}
                >
                  {tab.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* ======================================
            ① シミュレーション
        ====================================== */}

        {activeTab ===
          "simulation" && (
          <div>

            {/* 条件 */}

            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
              <h2 className="text-xl font-bold">
                シミュレーション条件
              </h2>

              <div className="mt-6 grid gap-6 md:grid-cols-2">

                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-600">
                    現在の資産
                  </span>

                  <NumericInput
                    value={
                      initialAssets
                    }

                    onValueChange={
                      setInitialAssets
                    }

                    min={0}

                    suffix="円"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-600">
                    毎月の基本積立額
                  </span>

                  <NumericInput
                    value={
                      monthlyContribution
                    }

                    onValueChange={
                      setMonthlyContribution
                    }

                    min={0}

                    suffix="円"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-600">
                    想定年利
                  </span>

                  <NumericInput
                    value={
                      annualReturn
                    }

                    onValueChange={
                      setAnnualReturn
                    }

                    min={-20}

                    max={30}

                    allowDecimal

                    allowNegative

                    suffix="%"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-600">
                    運用期間
                  </span>

                  <NumericInput
                    value={
                      years
                    }

                    onValueChange={
                      setYears
                    }

                    min={1}

                    max={99}

                    suffix="年"
                  />
                </label>
              </div>

              {/* 積立途中変更 */}

              <div className="mt-8 border-t border-slate-100 pt-6">
                <label className="flex cursor-pointer items-start gap-3 sm:items-center">
                  <input
                    type="checkbox"

                    checked={
                      useCustomContributions
                    }

                    onChange={(e) => {
                      const checked =
                        e.target.checked;

                      setUseCustomContributions(
                        checked
                      );

                      if (
                        !checked
                      ) {
                        setHasContributionError(
                          false
                        );
                      }
                    }}

                    className="mt-0.5 h-5 w-5 shrink-0 sm:mt-0"
                  />

                  <span className="font-bold">
                    積立額を途中で変更する
                  </span>
                </label>

                {useCustomContributions && (
                  <ContributionSettings
                    years={
                      years
                    }

                    monthlyContribution={
                      monthlyContribution
                    }

                    settings={
                      contributionSettings
                    }

                    onChange={
                      setContributionSettings
                    }

                    onValidationChange={
                      setHasContributionError
                    }
                  />
                )}
              </div>
            </section>

            <SavedSimulations
              currentState={
                getCurrentState()
              }

              onLoad={
                loadSavedSimulation
              }
            />

            {result ? (
              <>
                {/* 結果 */}

                <section className="mt-6 rounded-3xl bg-slate-900 p-6 text-white shadow-sm md:p-8">
                  <p className="text-sm text-slate-400">
                    {years}
                    年後の予想資産
                  </p>

                  <p className="mt-2 break-words text-4xl font-bold md:text-5xl">
                    {formatYen(
                      result.finalAssets
                    )}
                  </p>

                  <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-400">
                        元本
                      </p>

                      <p className="mt-1 break-words text-xl font-bold">
                        {formatYen(
                          result.totalPrincipal
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-400">
                        運用益
                      </p>

                      <p className="mt-1 break-words text-xl font-bold">
                        {formatYen(
                          result.totalProfit
                        )}
                      </p>
                    </div>
                  </div>
                </section>

                {/* 資産推移 */}

                <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6 md:p-8">
                  <div>
                    <h2 className="text-xl font-bold">
                      資産推移
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      総資産と元本の推移
                    </p>
                  </div>

                  <div className="mt-6">
                    <AssetChart
                      data={
                        result.yearlyResults
                      }
                    />
                  </div>
                </section>

                {/* =========================
                    年ごとの一覧
                ========================= */}

                <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
                  <button
                    type="button"

                    onClick={() =>
                      setShowYearlyTable(
                        (current) =>
                          !current
                      )
                    }

                    className="flex w-full items-center justify-between gap-4 p-6 text-left md:p-8"
                  >
                    <div>
                      <h2 className="text-xl font-bold">
                        年ごとの資産一覧
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        各年末時点の総資産・元本・運用益を確認
                      </p>
                    </div>

                    <span className="shrink-0 text-2xl font-medium text-slate-400">
                      {showYearlyTable ? "−" : "+"}
                    </span>
                  </button>

                  {showYearlyTable && (
                    <div className="border-t border-slate-100 p-4 sm:p-6 md:p-8">
                      <YearlyAssetTable
                        data={
                          result.yearlyResults
                        }

                        embedded
                      />
                    </div>
                  )}
                </section>
              </>
            ) : (
              <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <p className="font-bold text-amber-800">
                  シミュレーションを一時停止しています
                </p>

                <p className="mt-2 text-sm text-amber-700">
                  積立期間の入力内容を修正すると、
                  自動的に計算を再開します。
                </p>
              </section>
            )}
          </div>
        )}

        {/* ======================================
            ② もしも？
        ====================================== */}

        {activeTab ===
          "whatif" && (
          <div>
            {result ? (
              <WhatIfCards
                initialAssets={
                  initialAssets
                }

                monthlyContribution={
                  monthlyContribution
                }

                annualReturn={
                  annualReturn /
                  100
                }

                years={
                  years
                }

                contributionPeriods={
                  contributionPeriods
                }

                baseFinalAssets={
                  result.finalAssets
                }

                onApplyMonthlyPlus={
                  applyMonthlyPlus
                }

                onApplyReturnPlus={
                  applyReturnPlus
                }

                onApplyFiveYears={
                  applyFiveYears
                }

                onApplyBoth={
                  applyBoth
                }
              />
            ) : (
              <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <p className="font-bold text-amber-800">
                  まず入力内容を修正してください
                </p>

                <p className="mt-2 text-sm text-amber-700">
                  シミュレーション条件にエラーがあります。
                </p>
              </section>
            )}
          </div>
        )}

        {/* ======================================
            ③ 目標設定
        ====================================== */}

        {activeTab ===
          "goal" && (
          <div>
            {result ? (
              <GoalSetting
                initialAssets={
                  initialAssets
                }

                monthlyContribution={
                  monthlyContribution
                }

                annualReturn={
                  annualReturn /
                  100
                }

                years={
                  years
                }

                contributionPeriods={
                  contributionPeriods
                }

                finalAssets={
                  result.finalAssets
                }
              />
            ) : (
              <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <p className="font-bold text-amber-800">
                  まず入力内容を修正してください
                </p>

                <p className="mt-2 text-sm text-amber-700">
                  シミュレーション条件にエラーがあります。
                </p>
              </section>
            )}
          </div>
        )}

        {/* ======================================
            ④ 取り崩し
        ====================================== */}

        {activeTab ===
          "withdrawal" && (
          <div>
            {result ? (
              <>
                <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
                  <h2 className="text-xl font-bold">
                    年齢設定
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    取り崩し開始時期を計算するために使用します
                  </p>

                  <div className="mt-6 max-w-md">
                    <label>
                      <span className="mb-2 block text-sm font-medium text-slate-600">
                        現在の年齢
                      </span>

                      <NumericInput
                        value={
                          currentAge
                        }

                        onValueChange={
                          setCurrentAge
                        }

                        min={0}

                        max={120}

                        suffix="歳"
                      />
                    </label>
                  </div>
                </section>

                <WithdrawalSimulator
                  currentAge={
                    currentAge
                  }

                  defaultStartAge={
                    currentAge +
                    years
                  }

                  initialAssets={
                    initialAssets
                  }

                  monthlyContribution={
                    monthlyContribution
                  }

                  accumulationReturn={
                    annualReturn /
                    100
                  }

                  contributionPeriods={
                    contributionPeriods
                  }
                />
              </>
            ) : (
              <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <p className="font-bold text-amber-800">
                  まず入力内容を修正してください
                </p>

                <p className="mt-2 text-sm text-amber-700">
                  シミュレーション条件にエラーがあります。
                </p>
              </section>
            )}
          </div>
        )}

        {/* =========================
            注意
        ========================= */}

        <p className="mt-6 text-center text-xs text-slate-400">
          ※ 想定利回りに基づくシミュレーションであり、
          将来の運用成果を保証するものではありません。
        </p>
      </div>
    </main>
  );
}