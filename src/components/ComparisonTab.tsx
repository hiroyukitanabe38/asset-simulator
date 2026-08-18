"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import type {
  ContributionSetting,
} from "@/components/ContributionSettings";

type SavedSimulationState = {
  currentAge: number;
  initialAssets: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
  useCustomContributions: boolean;
  contributionSettings: ContributionSetting[];
};

type SavedSimulation = {
  id: string;
  name: string;
  savedAt: string;
  state: SavedSimulationState;
};

type ComparisonTabProps = {
  onGoToSimulation: () => void;
};

type YearlyPoint = {
  year: number;
  assets: number;
  principal: number;
};

type ComparisonResult = {
  finalAssets: number;
  totalPrincipal: number;
  totalProfit: number;
  yearlyResults: YearlyPoint[];
};

type ComparedSimulation = SavedSimulation & {
  color: string;
  lightColor: string;
  result: ComparisonResult;
};

type ChartRange = {
  id: string;
  label: string;
  start: number;
  end: number;
};

const STORAGE_KEY =
  "asset-simulator-saved-simulations";

const CARD_COLORS = [
  {
    color: "#2563eb",
    lightColor: "#eff6ff",
  },
  {
    color: "#10b981",
    lightColor: "#ecfdf5",
  },
  {
    color: "#8b5cf6",
    lightColor: "#f5f3ff",
  },
];

const formatYen = (value: number) =>
  `${Math.round(value).toLocaleString("ja-JP")}円`;

const formatCompactYen = (value: number) => {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 100_000_000) {
    const oku = value / 100_000_000;

    return `${Number(oku.toFixed(1)).toLocaleString(
      "ja-JP"
    )}億円`;
  }

  if (absoluteValue >= 10_000) {
    return `${Math.round(value / 10_000).toLocaleString(
      "ja-JP"
    )}万円`;
  }

  return formatYen(value);
};

const isValidState = (
  value: unknown
): value is SavedSimulationState => {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const state =
    value as Partial<SavedSimulationState>;

  return (
    typeof state.currentAge === "number" &&
    typeof state.initialAssets === "number" &&
    typeof state.monthlyContribution === "number" &&
    typeof state.annualReturn === "number" &&
    typeof state.years === "number" &&
    typeof state.useCustomContributions === "boolean" &&
    Array.isArray(state.contributionSettings)
  );
};

const isValidSavedSimulation = (
  value: unknown
): value is SavedSimulation => {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const simulation =
    value as Partial<SavedSimulation>;

  return (
    typeof simulation.id === "string" &&
    typeof simulation.name === "string" &&
    typeof simulation.savedAt === "string" &&
    isValidState(simulation.state)
  );
};

const getMonthlyContribution = (
  state: SavedSimulationState,
  month: number
) => {
  if (!state.useCustomContributions) {
    return state.monthlyContribution;
  }

  const year = Math.ceil(month / 12);

  const setting =
    state.contributionSettings.find(
      (item) =>
        year >= item.startYear &&
        year <=
          (item.endYear ?? state.years)
    );

  return setting
    ? setting.monthlyAmount
    : state.monthlyContribution;
};

const calculateComparison = (
  state: SavedSimulationState
): ComparisonResult => {
  const monthlyRate =
    Math.pow(
      1 + state.annualReturn / 100,
      1 / 12
    ) - 1;

  let assets = state.initialAssets;
  let principal = state.initialAssets;

  const yearlyResults: YearlyPoint[] = [
    {
      year: 0,
      assets,
      principal,
    },
  ];

  for (
    let month = 1;
    month <= state.years * 12;
    month += 1
  ) {
    const contribution =
      getMonthlyContribution(
        state,
        month
      );

    assets =
      (assets + contribution) *
      (1 + monthlyRate);

    principal += contribution;

    if (month % 12 === 0) {
      yearlyResults.push({
        year: month / 12,
        assets,
        principal,
      });
    }
  }

  return {
    finalAssets: assets,
    totalPrincipal: principal,
    totalProfit:
      assets - principal,
    yearlyResults,
  };
};

const createChartRanges = (
  maximumYears: number
): ChartRange[] => {
  const ranges: ChartRange[] = [
    {
      id: "all",
      label: "全期間",
      start: 0,
      end: maximumYears,
    },
  ];

  if (maximumYears <= 10) {
    return ranges;
  }

  for (
    let start = 0;
    start < maximumYears;
    start += 10
  ) {
    const end = Math.min(
      start + 10,
      maximumYears
    );

    ranges.push({
      id: `${start}-${end}`,
      label: `${start}〜${end}年`,
      start,
      end,
    });
  }

  return ranges;
};

export default function ComparisonTab({
  onGoToSimulation,
}: ComparisonTabProps) {
  const [
    savedSimulations,
    setSavedSimulations,
  ] = useState<SavedSimulation[]>([]);

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<string[]>([]);

  const [
    showSelector,
    setShowSelector,
  ] = useState(false);

  const [
    storageError,
    setStorageError,
  ] = useState("");

  const [
    activeRangeId,
    setActiveRangeId,
  ] = useState("all");

  const [
    selectedYear,
    setSelectedYear,
  ] = useState<number | null>(null);

  const chartRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (!stored) {
        return;
      }

      const parsed: unknown =
        JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        return;
      }

      const validSimulations =
        parsed.filter(
          isValidSavedSimulation
        );

      setSavedSimulations(
        validSimulations
      );

      setSelectedIds(
        validSimulations
          .slice(0, 3)
          .map(
            (simulation) =>
              simulation.id
          )
      );
    } catch {
      setStorageError(
        "保存済み条件を読み込めませんでした。"
      );
    }
  }, []);

  const comparedSimulations =
    useMemo<ComparedSimulation[]>(
      () =>
        selectedIds
          .map((id) =>
            savedSimulations.find(
              (simulation) =>
                simulation.id === id
            )
          )
          .filter(
            (
              simulation
            ): simulation is SavedSimulation =>
              Boolean(simulation)
          )
          .map(
            (
              simulation,
              index
            ) => ({
              ...simulation,
              ...CARD_COLORS[index],
              result:
                calculateComparison(
                  simulation.state
                ),
            })
          ),
      [
        selectedIds,
        savedSimulations,
      ]
    );

  const maximumYears = useMemo(
    () =>
      Math.max(
        0,
        ...comparedSimulations.map(
          (simulation) =>
            simulation.state.years
        )
      ),
    [comparedSimulations]
  );

  const chartRanges = useMemo(
    () =>
      createChartRanges(
        maximumYears
      ),
    [maximumYears]
  );

  const activeRange =
    chartRanges.find(
      (range) =>
        range.id === activeRangeId
    ) ?? chartRanges[0];

  useEffect(() => {
    if (
      !chartRanges.some(
        (range) =>
          range.id === activeRangeId
      )
    ) {
      setActiveRangeId("all");
    }

    setSelectedYear(null);
  }, [
    activeRangeId,
    chartRanges,
  ]);

  const toggleSimulation = (
    id: string
  ) => {
    setSelectedIds(
      (current) => {
        if (current.includes(id)) {
          return current.filter(
            (selectedId) =>
              selectedId !== id
          );
        }

        if (current.length >= 3) {
          return current;
        }

        return [
          ...current,
          id,
        ];
      }
    );
  };

  const handleChartPointer = (
    clientX: number
  ) => {
    const chart = chartRef.current;

    if (!chart) {
      return;
    }

    const bounds =
      chart.getBoundingClientRect();

    const leftPadding = 48;
    const rightPadding = 14;

    const plotWidth = Math.max(
      1,
      bounds.width -
        leftPadding -
        rightPadding
    );

    const position = Math.min(
      1,
      Math.max(
        0,
        (clientX -
          bounds.left -
          leftPadding) /
          plotWidth
      )
    );

    const rangeLength = Math.max(
      1,
      activeRange.end -
        activeRange.start
    );

    setSelectedYear(
      Math.round(
        activeRange.start +
          position *
            rangeLength
      )
    );
  };

  if (
    savedSimulations.length === 0
  ) {
    return (
      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-bold">
          お気に入り条件を比較
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          保存した条件を最大3件まで並べて比較できます
        </p>

        {storageError && (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {storageError}
          </p>
        )}

        <div className="mt-6 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-6 text-center">
          <p className="font-bold text-slate-700">
            比較できる条件がまだありません
          </p>

          <p className="mt-2 text-sm text-slate-500">
            シミュレーション条件を入力して、お気に入りに保存してください。
          </p>

          <button
            type="button"
            onClick={
              onGoToSimulation
            }
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            シミュレーションへ
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              お気に入り条件を比較
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              最大3件の結果と資産推移を見比べられます
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowSelector(
                (current) =>
                  !current
              )
            }
            className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-100"
          >
            条件を選ぶ
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-sm font-bold text-slate-600">
            比較中の条件
          </p>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
            {selectedIds.length}
            件
          </span>
        </div>

        {showSelector && (
          <div className="mt-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-700">
                比較する条件を選択
              </p>

              <p className="text-xs text-slate-400">
                最大3件
              </p>
            </div>

            <div className="mt-3 space-y-2">
              {savedSimulations.map(
                (simulation) => {
                  const checked =
                    selectedIds.includes(
                      simulation.id
                    );

                  const disabled =
                    !checked &&
                    selectedIds.length >= 3;

                  return (
                    <label
                      key={
                        simulation.id
                      }
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                        checked
                          ? "border-blue-300 bg-blue-50"
                          : disabled
                            ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50"
                            : "border-slate-200 bg-white hover:border-blue-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={
                          checked
                        }
                        disabled={
                          disabled
                        }
                        onChange={() =>
                          toggleSimulation(
                            simulation.id
                          )
                        }
                        className="h-5 w-5 rounded border-slate-300 accent-blue-600"
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-slate-700">
                          {
                            simulation.name
                          }
                        </span>

                        <span className="mt-0.5 block text-xs text-slate-400">
                          月
                          {formatCompactYen(
                            simulation
                              .state
                              .monthlyContribution
                          )}
                          ・年利
                          {
                            simulation
                              .state
                              .annualReturn
                          }
                          ％・
                          {
                            simulation
                              .state
                              .years
                          }
                          年
                        </span>
                      </span>
                    </label>
                  );
                }
              )}
            </div>

            <p className="mt-3 text-xs text-slate-400">
              最初に選んだ条件を基準として差額を表示します。
            </p>
          </div>
        )}
      </section>

      {comparedSimulations.length ===
      0 ? (
        <section className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-slate-700">
            比較する条件を選んでください
          </p>

          <button
            type="button"
            onClick={() =>
              setShowSelector(true)
            }
            className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
          >
            条件を選ぶ
          </button>
        </section>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            {comparedSimulations.map(
              (
                simulation,
                index
              ) => {
                const baseResult =
                  comparedSimulations[0]
                    .result;

                const difference =
                  simulation.result
                    .finalAssets -
                  baseResult.finalAssets;

                return (
                  <article
                    key={
                      simulation.id
                    }
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div
                      className="h-1.5"
                      style={{
                        backgroundColor:
                          simulation.color,
                      }}
                    />

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="flex min-w-0 items-center gap-2 text-lg font-bold">
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                simulation.color,
                            }}
                          />

                          <span className="break-words">
                            {
                              simulation.name
                            }
                          </span>
                        </h3>

                        {index === 0 ? (
                          <span
                            className="rounded-full px-3 py-1 text-xs font-bold"
                            style={{
                              backgroundColor:
                                simulation.lightColor,
                              color:
                                simulation.color,
                            }}
                          >
                            比較基準
                          </span>
                        ) : (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              difference >= 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            基準より
                            {difference >= 0
                              ? "+"
                              : ""}
                            {formatCompactYen(
                              difference
                            )}
                          </span>
                        )}
                      </div>

                      <div className="mt-5">
                        <p className="text-sm text-slate-400">
                          最終資産
                        </p>

                        <p
                          className="mt-1 break-words text-3xl font-bold tracking-tight sm:text-4xl"
                          style={{
                            color:
                              simulation.color,
                          }}
                        >
                          {formatYen(
                            simulation.result
                              .finalAssets
                          )}
                        </p>
                      </div>

                      <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-100 pt-5">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 sm:text-sm">
                            元本
                          </p>

                          <p className="mt-1 break-words text-xs font-bold sm:text-sm">
                            {formatCompactYen(
                              simulation.result
                                .totalPrincipal
                            )}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 sm:text-sm">
                            運用益
                          </p>

                          <p className="mt-1 break-words text-xs font-bold sm:text-sm">
                            {formatCompactYen(
                              simulation.result
                                .totalProfit
                            )}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 sm:text-sm">
                            運用期間
                          </p>

                          <p className="mt-1 text-xs font-bold sm:text-sm">
                            {
                              simulation.state
                                .years
                            }
                            年
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </section>

          <ComparisonChart
            simulations={
              comparedSimulations
            }
            activeRange={
              activeRange
            }
            ranges={chartRanges}
            activeRangeId={
              activeRangeId
            }
            onRangeChange={
              setActiveRangeId
            }
            selectedYear={
              selectedYear
            }
            onPointer={
              handleChartPointer
            }
            chartRef={chartRef}
          />
        </>
      )}
    </div>
  );
}

type ComparisonChartProps = {
  simulations: ComparedSimulation[];
  activeRange: ChartRange;
  ranges: ChartRange[];
  activeRangeId: string;

  onRangeChange: (
    id: string
  ) => void;

  selectedYear: number | null;

  onPointer: (
    clientX: number
  ) => void;

  chartRef:
    RefObject<HTMLDivElement | null>;
};

function ComparisonChart({
  simulations,
  activeRange,
  ranges,
  activeRangeId,
  onRangeChange,
  selectedYear,
  onPointer,
  chartRef,
}: ComparisonChartProps) {
  const width = 900;
  const height = 300;
  const left = 72;
  const right = 22;
  const top = 24;
  const bottom = 42;

  const plotWidth =
    width - left - right;

  const plotHeight =
    height - top - bottom;

  const rangeLength = Math.max(
    1,
    activeRange.end -
      activeRange.start
  );

  const pointsInRange =
    simulations.flatMap(
      (simulation) =>
        simulation.result.yearlyResults.filter(
          (point) =>
            point.year >=
              activeRange.start &&
            point.year <=
              activeRange.end
        )
    );

  const maximumAssets = Math.max(
    1,
    ...pointsInRange.map(
      (point) => point.assets
    )
  );

  const chartMaximum =
    maximumAssets * 1.08;

  const xForYear = (
    year: number
  ) =>
    left +
    ((year -
      activeRange.start) /
      rangeLength) *
      plotWidth;

  const yForValue = (
    value: number
  ) =>
    top +
    plotHeight -
    (value / chartMaximum) *
      plotHeight;

  const xLabels = Array.from(
    new Set([
      activeRange.start,
      Math.round(
        activeRange.start +
          rangeLength / 2
      ),
      activeRange.end,
    ])
  );

  const selectedX =
    selectedYear === null
      ? null
      : xForYear(
          selectedYear
        );

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6 md:p-8">
      <div>
        <h2 className="text-xl font-bold">
          資産推移を比較
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          グラフをタップすると、その年の金額を確認できます
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
        {simulations.map(
          (simulation) => (
            <div
              key={
                simulation.id
              }
              className="flex min-w-0 items-center gap-2 text-xs font-bold text-slate-600 sm:text-sm"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    simulation.color,
                }}
              />

              <span className="truncate">
                {simulation.name}
              </span>
            </div>
          )
        )}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {ranges.map(
          (range) => (
            <button
              key={range.id}
              type="button"
              onClick={() =>
                onRangeChange(
                  range.id
                )
              }
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition sm:text-sm ${
                activeRangeId ===
                range.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {range.label}
            </button>
          )
        )}
      </div>

      <div
        ref={chartRef}
        className="mt-5 w-full touch-none select-none"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(
            event.pointerId
          );

          onPointer(
            event.clientX
          );
        }}
        onPointerMove={(event) => {
          if (
            event.currentTarget.hasPointerCapture(
              event.pointerId
            )
          ) {
            onPointer(
              event.clientX
            );
          }
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="保存した条件の資産推移比較グラフ"
          className="h-auto w-full overflow-visible"
        >
          {[0, 0.5, 1].map(
            (ratio) => {
              const y =
                top +
                plotHeight *
                  ratio;

              const value =
                chartMaximum *
                (1 - ratio);

              return (
                <g key={ratio}>
                  <line
                    x1={left}
                    y1={y}
                    x2={
                      width - right
                    }
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />

                  <text
                    x={left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="13"
                    fill="#94a3b8"
                  >
                    {formatCompactYen(
                      value
                    )}
                  </text>
                </g>
              );
            }
          )}

          {xLabels.map(
            (year) => (
              <text
                key={year}
                x={xForYear(year)}
                y={height - 13}
                textAnchor="middle"
                fontSize="13"
                fill="#94a3b8"
              >
                {year}年
              </text>
            )
          )}

          {simulations.map(
            (simulation) => {
              const points =
                simulation.result.yearlyResults.filter(
                  (point) =>
                    point.year >=
                      activeRange.start &&
                    point.year <=
                      activeRange.end
                );

              const polyline =
                points
                  .map(
                    (point) =>
                      `${xForYear(
                        point.year
                      )},${yForValue(
                        point.assets
                      )}`
                  )
                  .join(" ");

              return (
                <polyline
                  key={
                    simulation.id
                  }
                  points={polyline}
                  fill="none"
                  stroke={
                    simulation.color
                  }
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            }
          )}

          {selectedX !== null && (
            <line
              x1={selectedX}
              y1={top}
              x2={selectedX}
              y2={
                top + plotHeight
              }
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
          )}
        </svg>
      </div>

      {selectedYear !== null && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-700">
            {selectedYear}
            年目
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {simulations.map(
              (simulation) => {
                const point =
                  simulation.result.yearlyResults.find(
                    (item) =>
                      item.year ===
                      Math.min(
                        selectedYear,
                        simulation.state
                          .years
                      )
                  );

                const isFinished =
                  selectedYear >
                  simulation.state.years;

                return (
                  <div
                    key={
                      simulation.id
                    }
                    className="rounded-xl bg-white p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            simulation.color,
                        }}
                      />

                      <p className="truncate text-xs font-bold text-slate-500">
                        {
                          simulation.name
                        }
                      </p>
                    </div>

                    <p className="mt-1 break-words font-bold text-slate-800">
                      {point
                        ? formatYen(
                            point.assets
                          )
                        : "—"}
                    </p>

                    {isFinished && (
                      <p className="mt-1 text-xs text-slate-400">
                        運用終了時点
                      </p>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        ※ 積立途中変更を設定した条件は、その内容を反映して計算します。
      </p>
    </section>
  );
}