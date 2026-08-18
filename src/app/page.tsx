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

import ComparisonTab from "@/components/ComparisonTab";

import GoalSetting from "@/components/GoalSetting";

import YearlyAssetTable from "@/components/YearlyAssetTable";

import NumericInput from "@/components/NumericInput";

import WithdrawalSimulator from "@/components/WithdrawalSimulator";

import SavedSimulations from "@/components/SavedSimulations";

type TabType =
  | "simulation"
  | "comparison"
  | "goal"
  | "withdrawal";

type TabIconName =
  | "lightbulb"
  | "comparison"
  | "goal"
  | "withdrawal";

type TabIconProps = {
  name: TabIconName;
};

function TabIcon({
  name,
}: TabIconProps) {
  const commonProps = {
    "aria-hidden": true,
    className:
      "h-4 w-4 shrink-0",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap:
      "round" as const,
    strokeLinejoin:
      "round" as const,
  };

  // Lightbulb
  if (
    name ===
    "lightbulb"
  ) {
    return (
      <svg
        {...commonProps}
      >
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    );
  }

  // ChartNoAxesColumn
  if (
    name ===
    "comparison"
  ) {
    return (
      <svg
        {...commonProps}
      >
        <path d="M5 21v-6" />
        <path d="M12 21V3" />
        <path d="M19 21V9" />
      </svg>
    );
  }

  // ChartLine
  if (
    name ===
    "goal"
  ) {
    return (
      <svg
        {...commonProps}
      >
        <path d="M3 3v18h18" />
        <path d="m7 16 4-4 4 4 5-6" />
      </svg>
    );
  }

  // CircleDollarSign
  return (
    <svg
      {...commonProps}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
      />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

type SimulationInputState = {
  initialAssets: boolean;
  monthlyContribution: boolean;
  annualReturn: boolean;
  years: boolean;
};

type SimulationState = {
  currentAge: number;
  initialAssets: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
  useCustomContributions: boolean;
  contributionSettings: ContributionSetting[];
};

const INITIAL_STATE: SimulationState = {
  currentAge: 40,
  initialAssets: 3_000_000,
  monthlyContribution: 100_000,
  annualReturn: 5,
  years: 20,
  useCustomContributions: false,
  contributionSettings: [],
};

const EMPTY_INPUT_STATE: SimulationInputState = {
  initialAssets: false,
  monthlyContribution: false,
  annualReturn: false,
  years: false,
};

export default function Home() {
  const [
    activeTab,
    setActiveTab,
  ] = useState<TabType>(
    "simulation"
  );

  const [
    showYearlyTable,
    setShowYearlyTable,
  ] = useState(false);

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

  const [
    simulationInputs,
    setSimulationInputs,
  ] = useState<SimulationInputState>(
    EMPTY_INPUT_STATE
  );

  const hasAllSimulationInputs =
    simulationInputs.initialAssets &&
    simulationInputs.monthlyContribution &&
    simulationInputs.annualReturn &&
    simulationInputs.years;

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

  const [
    previousState,
    setPreviousState,
  ] = useState<
    SimulationState | null
  >(null);

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

  const saveCurrentState =
    () => {
      setPreviousState(
        getCurrentState()
      );
    };

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

    setHasContributionError(
      false
    );

    setSimulationInputs({
      initialAssets: true,
      monthlyContribution: true,
      annualReturn: true,
      years: true,
    });
  };

  const loadSavedSimulation = (
    state: SimulationState
  ) => {
    saveCurrentState();

    restoreState(state);

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

  const undoLastChange =
    () => {
      if (!previousState) {
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

  const resetToInitial =
    () => {
      saveCurrentState();

      restoreState(
        INITIAL_STATE
      );

      setSimulationInputs(
        EMPTY_INPUT_STATE
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

  const canCalculate =
    hasAllSimulationInputs &&
    (!useCustomContributions ||
      !hasContributionError);

  const result =
    useMemo(() => {
      if (!canCalculate) {
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

  const formatYen = (
    value: number
  ) =>
    `${Math.round(
      value
    ).toLocaleString(
      "ja-JP"
    )}円`;

  const tabs: {
    id: TabType;
    label: string;
    icon: TabIconName;
  }[] = [
    {
      id: "simulation",
      label:
        "シミュレーション",
      icon:
        "lightbulb",
    },
    {
      id: "comparison",
      label:
        "くらべる",
      icon:
        "comparison",
    },
    {
      id: "goal",
      label:
        "どれくらい？",
      icon:
        "goal",
    },
    {
      id: "withdrawal",
      label:
        "取り崩し",
      icon:
        "withdrawal",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-10">
      <div className="mx-auto max-w-5xl">
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
                  <span className="flex items-center justify-center gap-1.5">
                    <TabIcon
                      name={
                        tab.icon
                      }
                    />

                    <span>
                      {
                        tab.label
                      }
                    </span>
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        {activeTab ===
          "simulation" && (
          <div>
            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
              <h2 className="text-xl font-bold">
                シミュレーション条件
              </h2>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-600">
                    現在の運用資産
                  </span>

                  <NumericInput
                    value={
                      simulationInputs.initialAssets
                        ? initialAssets
                        : null
                    }
                    onValueChange={(value) => {
                      setInitialAssets(
                        value
                      );

                      setSimulationInputs(
                        (current) => ({
                          ...current,
                          initialAssets:
                            true,
                        })
                      );
                    }}
                    allowEmpty
                    onEmpty={() =>
                      setSimulationInputs(
                        (current) => ({
                          ...current,
                          initialAssets:
                            false,
                        })
                      )
                    }
                    placeholder="例：3,000,000"
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
                      simulationInputs.monthlyContribution
                        ? monthlyContribution
                        : null
                    }
                    onValueChange={(value) => {
                      setMonthlyContribution(
                        value
                      );

                      setSimulationInputs(
                        (current) => ({
                          ...current,
                          monthlyContribution:
                            true,
                        })
                      );
                    }}
                    allowEmpty
                    onEmpty={() =>
                      setSimulationInputs(
                        (current) => ({
                          ...current,
                          monthlyContribution:
                            false,
                        })
                      )
                    }
                    placeholder="例：100,000"
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
                      simulationInputs.annualReturn
                        ? annualReturn
                        : null
                    }
                    onValueChange={(value) => {
                      setAnnualReturn(
                        value
                      );

                      setSimulationInputs(
                        (current) => ({
                          ...current,
                          annualReturn:
                            true,
                        })
                      );
                    }}
                    allowEmpty
                    onEmpty={() =>
                      setSimulationInputs(
                        (current) => ({
                          ...current,
                          annualReturn:
                            false,
                        })
                      )
                    }
                    placeholder="例：5"
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
                      simulationInputs.years
                        ? years
                        : null
                    }
                    onValueChange={(value) => {
                      setYears(
                        value
                      );

                      setSimulationInputs(
                        (current) => ({
                          ...current,
                          years:
                            true,
                        })
                      );
                    }}
                    allowEmpty
                    onEmpty={() =>
                      setSimulationInputs(
                        (current) => ({
                          ...current,
                          years:
                            false,
                        })
                      )
                    }
                    placeholder="例：20"
                    min={1}
                    max={99}
                    suffix="年"
                  />
                </label>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <label className="flex cursor-pointer items-start gap-3 sm:items-center">
                  <input
                    type="checkbox"
                    disabled={
                      !hasAllSimulationInputs
                    }
                    checked={
                      useCustomContributions
                    }
                    onChange={(event) => {
                      const checked =
                        event.target.checked;

                      setUseCustomContributions(
                        checked
                      );

                      if (!checked) {
                        setHasContributionError(
                          false
                        );
                      }
                    }}
                    className="mt-0.5 h-5 w-5 shrink-0 disabled:cursor-not-allowed disabled:opacity-40 sm:mt-0"
                  />

                  <span
                    className={`font-bold ${
                      hasAllSimulationInputs
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    積立額を途中で変更する
                  </span>
                </label>

                {useCustomContributions &&
                  hasAllSimulationInputs && (
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

            {result && (
              <SavedSimulations
                currentState={
                  getCurrentState()
                }
                onLoad={
                  loadSavedSimulation
                }
              />
            )}

            {result ? (
              <>
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
                      {showYearlyTable
                        ? "−"
                        : "+"}
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
            ) : !hasAllSimulationInputs ? (
              <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-6 text-center shadow-sm md:p-8">
                <p className="font-bold text-slate-700">
                  条件を入力するとシミュレーション結果が表示されます
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  4つの条件をすべて入力してください。
                </p>
              </section>
            ) : (
              <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <p className="font-bold text-amber-800">
                  シミュレーションを一時停止しています
                </p>

                <p className="mt-2 text-sm text-amber-700">
                  積立期間の入力内容を修正すると、自動的に計算を再開します。
                </p>
              </section>
            )}
          </div>
        )}

        {activeTab ===
          "comparison" && (
          <ComparisonTab
            onGoToSimulation={() => {
              setActiveTab(
                "simulation"
              );

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          />
        )}

        {activeTab ===
          "goal" && (
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
              result?.finalAssets ??
              0
            }
          />
        )}

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
                  まずシミュレーション条件を入力してください
                </p>

                <p className="mt-2 text-sm text-amber-700">
                  取り崩し計算には、4つのシミュレーション条件が必要です。
                </p>
              </section>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          ※ 想定利回りに基づくシミュレーションであり、将来の運用成果を保証するものではありません。
        </p>
      </div>
    </main>
  );
}