"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  ContributionSetting,
} from "@/components/ContributionSettings";

export type SavedSimulationState = {
  currentAge: number;

  initialAssets: number;

  monthlyContribution: number;

  annualReturn: number;

  years: number;

  useCustomContributions: boolean;

  contributionSettings:
    ContributionSetting[];
};

type SavedSimulation = {
  id: string;

  name: string;

  savedAt: string;

  state: SavedSimulationState;
};

type SavedSimulationsProps = {
  currentState:
    SavedSimulationState;

  onLoad: (
    state: SavedSimulationState
  ) => void;
};

const STORAGE_KEY =
  "asset-simulator-saved-simulations";

const createId = () => {
  if (
    typeof crypto !==
      "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

const copyState = (
  state: SavedSimulationState
): SavedSimulationState => ({
  ...state,

  contributionSettings:
    state.contributionSettings.map(
      (setting) => ({
        ...setting,
      })
    ),
});

const isValidState = (
  value: unknown
): value is SavedSimulationState => {
  if (
    typeof value !==
      "object" ||
    value === null
  ) {
    return false;
  }

  const state =
    value as Partial<SavedSimulationState>;

  return (
    typeof state.currentAge ===
      "number" &&
    typeof state.initialAssets ===
      "number" &&
    typeof state.monthlyContribution ===
      "number" &&
    typeof state.annualReturn ===
      "number" &&
    typeof state.years ===
      "number" &&
    typeof state.useCustomContributions ===
      "boolean" &&
    Array.isArray(
      state.contributionSettings
    )
  );
};

const isValidSavedSimulation = (
  value: unknown
): value is SavedSimulation => {
  if (
    typeof value !==
      "object" ||
    value === null
  ) {
    return false;
  }

  const saved =
    value as Partial<SavedSimulation>;

  return (
    typeof saved.id ===
      "string" &&
    typeof saved.name ===
      "string" &&
    typeof saved.savedAt ===
      "string" &&
    isValidState(saved.state)
  );
};

export default function SavedSimulations({
  currentState,
  onLoad,
}: SavedSimulationsProps) {
  const [
    savedSimulations,
    setSavedSimulations,
  ] = useState<
    SavedSimulation[]
  >([]);

  const [
    showNameInput,
    setShowNameInput,
  ] = useState(false);

  const [
    simulationName,
    setSimulationName,
  ] = useState("");

  const [
    storageError,
    setStorageError,
  ] = useState("");

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

      if (
        !Array.isArray(parsed)
      ) {
        return;
      }

      setSavedSimulations(
        parsed.filter(
          isValidSavedSimulation
        )
      );
    } catch {
      setStorageError(
        "保存済み条件を読み込めませんでした。"
      );
    }
  }, []);

  const saveToLocalStorage = (
    simulations:
      SavedSimulation[]
  ) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          simulations
        )
      );

      setSavedSimulations(
        simulations
      );

      setStorageError("");
    } catch {
      setStorageError(
        "このブラウザに条件を保存できませんでした。"
      );
    }
  };

  const saveSimulation =
    () => {
      const trimmedName =
        simulationName.trim();

      if (!trimmedName) {
        return;
      }

      const newSimulation:
        SavedSimulation = {
          id: createId(),

          name: trimmedName,

          savedAt:
            new Date().toISOString(),

          state: copyState(
            currentState
          ),
        };

      saveToLocalStorage([
        newSimulation,
        ...savedSimulations,
      ]);

      setSimulationName("");

      setShowNameInput(false);
    };

  const loadSimulation = (
    simulation:
      SavedSimulation
  ) => {
    onLoad(
      copyState(
        simulation.state
      )
    );
  };

  const deleteSimulation = (
    simulation:
      SavedSimulation
  ) => {
    const shouldDelete =
      window.confirm(
        `「${simulation.name}」を削除しますか？`
      );

    if (!shouldDelete) {
      return;
    }

    saveToLocalStorage(
      savedSimulations.filter(
        (item) =>
          item.id !==
          simulation.id
      )
    );
  };

  const cancelSaving =
    () => {
      setSimulationName("");

      setShowNameInput(false);
    };

  const formatYen = (
    value: number
  ) =>
    `${Math.round(
      value
    ).toLocaleString(
      "ja-JP"
    )}円`;

  const formatSavedDate = (
    value: string
  ) => {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleDateString(
      "ja-JP",
      {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }
    );
  };

  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <div>
        <h2 className="text-xl font-bold">
          お気に入り条件
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          よく使うシミュレーション条件を保存できます
        </p>
      </div>

      {!showNameInput ? (
        <button
          type="button"

          onClick={() =>
            setShowNameInput(
              true
            )
          }

          className="mt-6 w-full rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 px-4 py-4 font-bold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
        >
          ☆ この条件を保存
        </button>
      ) : (
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-700">
              お気に入り名
            </span>

            <input
              type="text"

              value={
                simulationName
              }

              onChange={(event) =>
                setSimulationName(
                  event.target.value
                )
              }

              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  saveSimulation();
                }
              }}

              maxLength={40}

              autoFocus

              placeholder="例：老後基本プラン"

              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"

              onClick={
                saveSimulation
              }

              disabled={
                !simulationName.trim()
              }

              className={`rounded-xl px-5 py-3 font-bold transition ${
                simulationName.trim()
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-200 text-slate-400"
              }`}
            >
              保存する
            </button>

            <button
              type="button"

              onClick={
                cancelSaving
              }

              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-600 transition hover:bg-slate-100"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {storageError && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {storageError}
        </p>
      )}

      {savedSimulations.length >
      0 ? (
        <div className="mt-6 space-y-4">
          {savedSimulations.map(
            (simulation) => (
              <div
                key={
                  simulation.id
                }

                className="rounded-2xl border border-slate-200 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="break-words text-lg font-bold">
                      ☆{" "}
                      {
                        simulation.name
                      }
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      保存日：
                      {formatSavedDate(
                        simulation.savedAt
                      )}
                    </p>
                  </div>

                  {simulation.state
                    .useCustomContributions && (
                    <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                      積立途中変更あり
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-slate-400">
                      現在資産
                    </p>

                    <p className="mt-1 break-words font-bold">
                      {formatYen(
                        simulation
                          .state
                          .initialAssets
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      基本積立
                    </p>

                    <p className="mt-1 break-words font-bold">
                      {formatYen(
                        simulation
                          .state
                          .monthlyContribution
                      )}
                      /月
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      想定年利
                    </p>

                    <p className="mt-1 font-bold">
                      {
                        simulation
                          .state
                          .annualReturn
                      }
                      %
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      運用期間
                    </p>

                    <p className="mt-1 font-bold">
                      {
                        simulation
                          .state
                          .years
                      }
                      年
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"

                    onClick={() =>
                      loadSimulation(
                        simulation
                      )
                    }

                    className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
                  >
                    この条件を使う
                  </button>

                  <button
                    type="button"

                    onClick={() =>
                      deleteSimulation(
                        simulation
                      )
                    }

                    className="rounded-xl border border-red-200 bg-white px-5 py-3 font-bold text-red-600 transition hover:bg-red-50"
                  >
                    削除
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <p className="mt-5 text-center text-sm text-slate-400">
          保存されている条件はまだありません
        </p>
      )}
    </section>
  );
}