"use client";

import { useState } from "react";

import {
  calculateRequiredDuration,
  calculateRequiredMonthlyContribution,
  calculateRequiredReturn,
} from "@/lib/finance/calculator";

import type { ContributionPeriod } from "@/types/finance";

type GoalSettingProps = {
  initialAssets: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
  contributionPeriods: ContributionPeriod[];
  finalAssets: number;
};

type ReverseMode = "requiredMonthly" | "requiredDuration" | "requiredReturn";

type CalculationResult =
  | { mode: "requiredMonthly"; value: number | null }
  | { mode: "requiredDuration"; value: number | null }
  | { mode: "requiredReturn"; value: number | null };

type GoalInputs = {
  initialAssets: string;
  monthlyContribution: string;
  annualReturnPercent: string;
  years: string;
  targetAssets: string;
};

type InputsByMode = Record<ReverseMode, GoalInputs>;

type LoadedByMode = Record<ReverseMode, boolean>;

type FixedFieldProps = {
  label: string;
  value: string;
  suffix: string;
  placeholder: string;
  isAnswer: boolean;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  onChange: (value: string) => void;
};

const NO_CONTRIBUTION_PERIODS: ContributionPeriod[] = [];

const createEmptyInputs = (): GoalInputs => ({
  initialAssets: "",
  monthlyContribution: "",
  annualReturnPercent: "",
  years: "",
  targetAssets: "",
});

const MODE_OPTIONS: {
  id: ReverseMode;
  label: string;
  description: string;
}[] = [
  {
    id: "requiredMonthly",
    label: "毎月いくら？",
    description:
      "現在の運用資産・想定年利・運用期間・目標金額から、毎月必要な積立額を逆算します。",
  },
  {
    id: "requiredDuration",
    label: "何年かかる？",
    description:
      "現在の運用資産・毎月の積立額・想定年利・目標金額から、到達までの期間を逆算します。",
  },
  {
    id: "requiredReturn",
    label: "年利何％？",
    description:
      "現在の運用資産・毎月の積立額・運用期間・目標金額から、必要な年利を逆算します。",
  },
];

const formatYen = (value: number) =>
  `${Math.round(value).toLocaleString("ja-JP")}円`;

const formatPercent = (value: number, digits = 1) =>
  `${value.toLocaleString("ja-JP", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })}%`;

const formatDuration = (months: number) => {
  const safeMonths = Math.max(0, Math.round(months));
  const yearPart = Math.floor(safeMonths / 12);
  const monthPart = safeMonths % 12;

  if (safeMonths === 0) {
    return "すでに到達";
  }

  if (yearPart === 0) {
    return `${monthPart}か月`;
  }

  if (monthPart === 0) {
    return `${yearPart}年`;
  }

  return `${yearPart}年${monthPart}か月`;
};

const sanitizeNumber = (
  value: string,
  allowDecimal: boolean,
  allowNegative: boolean,
) => {
  const normalizedValue = value.normalize("NFKC").replace(/[−–—ー]/g, "-");
  const withoutSeparators = normalizedValue.replace(/[,，\s]/g, "");
  let sanitized = withoutSeparators.replace(/[^0-9.\-]/g, "");

  if (!allowNegative) {
    sanitized = sanitized.replace(/-/g, "");
  } else {
    const isNegative = sanitized.startsWith("-");
    sanitized = sanitized.replace(/-/g, "");
    sanitized = isNegative ? `-${sanitized}` : sanitized;
  }

  if (!allowDecimal) {
    return sanitized.replace(/\./g, "");
  }

  const [integerPart, ...decimalParts] = sanitized.split(".");

  if (decimalParts.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${decimalParts.join("")}`;
};

const formatInputValue = (value: string) => {
  if (value === "" || value === "-" || value === "." || value === "-.") {
    return value;
  }

  const isNegative = value.startsWith("-");
  const unsignedValue = isNegative ? value.slice(1) : value;
  const [integerPart, decimalPart] = unsignedValue.split(".");

  const formattedInteger = integerPart
    ? Number(integerPart).toLocaleString("ja-JP")
    : "0";

  const sign = isNegative ? "-" : "";

  if (value.includes(".")) {
    return `${sign}${formattedInteger}.${decimalPart ?? ""}`;
  }

  return `${sign}${formattedInteger}`;
};

const parseInputValue = (value: string) => {
  if (value === "" || value === "-" || value === "." || value === "-.") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

function FixedField({
  label,
  value,
  suffix,
  placeholder,
  isAnswer,
  allowDecimal = false,
  allowNegative = false,
  onChange,
}: FixedFieldProps) {
  const handleInput = (nextValue: string) => {
    onChange(sanitizeNumber(nextValue, allowDecimal, allowNegative));
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-600">
        {label}
      </p>

      {isAnswer ? (
        <div className="flex min-h-[68px] items-center justify-center rounded-xl border-2 border-amber-300 bg-amber-50 text-3xl font-bold text-amber-500 shadow-sm">
          ?
        </div>
      ) : (
        <div className="flex min-h-[68px] items-center rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <input
            type="text"
            inputMode={allowDecimal ? "decimal" : "numeric"}
            value={formatInputValue(value)}
            onChange={(event: { target: { value: string } }) =>
              handleInput(event.target.value)
            }
            onInput={(event: { currentTarget: { value: string } }) =>
              handleInput(event.currentTarget.value)
            }
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-lg font-medium text-slate-900 outline-none placeholder:text-slate-300"
          />

          <span className="ml-3 shrink-0 text-slate-500">
            {suffix}
          </span>
        </div>
      )}
    </div>
  );
}

export default function GoalSetting({
  initialAssets,
  monthlyContribution,
  annualReturn,
  years,
  contributionPeriods,
}: GoalSettingProps) {
  const [mode, setMode] = useState<ReverseMode>("requiredMonthly");

  const [inputsByMode, setInputsByMode] = useState<InputsByMode>(() => ({
    requiredMonthly: createEmptyInputs(),
    requiredDuration: createEmptyInputs(),
    requiredReturn: createEmptyInputs(),
  }));

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const [loadedByMode, setLoadedByMode] = useState<LoadedByMode>({
    requiredMonthly: false,
    requiredDuration: false,
    requiredReturn: false,
  });

  const currentInputs = inputsByMode[mode];
  const loadedFromSimulation = loadedByMode[mode];

  const activeMode =
    MODE_OPTIONS.find((option) => option.id === mode) ?? MODE_OPTIONS[0];

  const clearResult = () => {
    setResult(null);
    setErrorMessages([]);
  };

  const changeMode = (nextMode: ReverseMode) => {
    setMode(nextMode);
    clearResult();
  };

  const updateInput = (field: keyof GoalInputs, value: string) => {
    setInputsByMode((previousInputs) => ({
      ...previousInputs,
      [mode]: {
        ...previousInputs[mode],
        [field]: value,
      },
    }));

    clearResult();
  };

  const loadSimulationConditions = () => {
    setInputsByMode((previousInputs) => ({
      ...previousInputs,
      [mode]: {
        ...previousInputs[mode],
        initialAssets: String(initialAssets),
        monthlyContribution: String(monthlyContribution),
        annualReturnPercent: String(annualReturn * 100),
        years: String(years),
      },
    }));

    setLoadedByMode((previousLoadedModes) => ({
      ...previousLoadedModes,
      [mode]: true,
    }));

    clearResult();
  };

  const clearCurrentModeInputs = () => {
    setInputsByMode((previousInputs) => ({
      ...previousInputs,
      [mode]: createEmptyInputs(),
    }));

    setLoadedByMode((previousLoadedModes) => ({
      ...previousLoadedModes,
      [mode]: false,
    }));

    clearResult();
  };

  const calculate = () => {
    const parsedInitialAssets = parseInputValue(
      currentInputs.initialAssets,
    );

    const parsedMonthlyContribution = parseInputValue(
      currentInputs.monthlyContribution,
    );

    const parsedAnnualReturnPercent = parseInputValue(
      currentInputs.annualReturnPercent,
    );

    const parsedYears = parseInputValue(currentInputs.years);

    const parsedTargetAssets = parseInputValue(
      currentInputs.targetAssets,
    );

    const validationErrors: string[] = [];

    if (parsedInitialAssets === null) {
      validationErrors.push(
        "現在の運用資産を入力してください。",
      );
    } else if (parsedInitialAssets < 0) {
      validationErrors.push(
        "現在の運用資産は0円以上で入力してください。",
      );
    }

    if (mode !== "requiredMonthly") {
      if (parsedMonthlyContribution === null) {
        validationErrors.push(
          "毎月の積立額を入力してください。",
        );
      } else if (parsedMonthlyContribution < 0) {
        validationErrors.push(
          "毎月の積立額は0円以上で入力してください。",
        );
      }
    }

    if (mode !== "requiredReturn") {
      if (parsedAnnualReturnPercent === null) {
        validationErrors.push(
          "想定年利を入力してください。",
        );
      } else if (
        parsedAnnualReturnPercent < -20 ||
        parsedAnnualReturnPercent > 30
      ) {
        validationErrors.push(
          "想定年利を−20%〜30%の範囲で入力してください。",
        );
      }
    }

    if (mode !== "requiredDuration") {
      if (parsedYears === null) {
        validationErrors.push(
          "運用期間を入力してください。",
        );
      } else if (
        !Number.isInteger(parsedYears) ||
        parsedYears < 1 ||
        parsedYears > 99
      ) {
        validationErrors.push(
          "運用期間を1〜99年の整数で入力してください。",
        );
      }
    }

    if (parsedTargetAssets === null) {
      validationErrors.push(
        "目標金額を入力してください。",
      );
    } else if (parsedTargetAssets <= 0) {
      validationErrors.push(
        "目標金額は1円以上で入力してください。",
      );
    }

    if (validationErrors.length > 0) {
      setErrorMessages(validationErrors);
      setResult(null);
      return;
    }

    if (mode === "requiredMonthly") {
      const calculatedMonthly =
        calculateRequiredMonthlyContribution(
          parsedTargetAssets as number,
          parsedInitialAssets as number,
          (parsedAnnualReturnPercent as number) / 100,
          parsedYears as number,
          0,
          NO_CONTRIBUTION_PERIODS,
        );

      setResult({
        mode,
        value:
          calculatedMonthly !== null
            ? Math.max(0, Math.round(calculatedMonthly))
            : null,
      });

      setErrorMessages([]);
      return;
    }

    if (mode === "requiredDuration") {
      const calculatedDuration = calculateRequiredDuration(
        parsedTargetAssets as number,
        parsedInitialAssets as number,
        parsedMonthlyContribution as number,
        (parsedAnnualReturnPercent as number) / 100,
        99,
        NO_CONTRIBUTION_PERIODS,
      );

      setResult({
        mode,
        value: calculatedDuration?.months ?? null,
      });

      setErrorMessages([]);
      return;
    }

    const calculatedReturn = calculateRequiredReturn(
      parsedTargetAssets as number,
      parsedInitialAssets as number,
      parsedMonthlyContribution as number,
      parsedYears as number,
      NO_CONTRIBUTION_PERIODS,
    );

    setResult({
      mode,
      value:
        calculatedReturn !== null
          ? calculatedReturn * 100
          : null,
    });

    setErrorMessages([]);
  };

  const renderResult = () => {
    if (!result) {
      return null;
    }

    if (result.mode === "requiredMonthly") {
      return result.value !== null ? (
        <>
          <p className="text-sm font-medium text-blue-100">
            毎月の必要積立額
          </p>

          <p className="mt-2 break-words text-3xl font-bold sm:text-4xl">
            {formatYen(result.value)}

            <span className="ml-1 text-lg font-medium text-blue-100">
              /月
            </span>
          </p>
        </>
      ) : (
        <p className="font-bold">
          月1,000万円以内では算出できません
        </p>
      );
    }

    if (result.mode === "requiredDuration") {
      return result.value !== null ? (
        <>
          <p className="text-sm font-medium text-blue-100">
            目標到達までの期間
          </p>

          <p className="mt-2 text-3xl font-bold sm:text-4xl">
            {formatDuration(result.value)}
          </p>
        </>
      ) : (
        <p className="font-bold">
          99年以内では到達しません
        </p>
      );
    }

    return result.value !== null ? (
      <>
        <p className="text-sm font-medium text-blue-100">
          計算上の必要年利
        </p>

        <p className="mt-2 text-3xl font-bold sm:text-4xl">
          {formatPercent(result.value)}
        </p>
      </>
    ) : (
      <p className="font-bold">
        年利30%以内では到達しません
      </p>
    );
  };

  return (
    <section className="mt-6 space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-bold">
          知りたい数値を逆算
        </h2>

        <p className="mt-1 whitespace-nowrap text-sm text-slate-500">
          3つのモードから知りたい数値を選んでください
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => changeMode(option.id)}
              className={`rounded-2xl border px-3 py-4 text-sm font-bold transition sm:text-base ${
                mode === option.id
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          {activeMode.description}
        </p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-bold">
              計算条件
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              黄色の「？」が今回求める数値です
            </p>
          </div>

          <button
            type="button"
            onClick={loadSimulationConditions}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            シミュレーション条件を読み込む
          </button>
        </div>

        {loadedFromSimulation && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
            基本条件を読み込みました。目標金額は入力してください。
          </p>
        )}

        <div
          className={`mt-4 rounded-xl border p-4 text-sm ${
            contributionPeriods.length > 0
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          「積立額を途中で変更する」の設定は反映されません。毎月の基本積立額が、全期間継続する前提で計算します。
        </div>

        <div className="mt-6 grid gap-x-6 gap-y-5 md:grid-cols-2">
          <FixedField
            label="現在の運用資産"
            value={currentInputs.initialAssets}
            suffix="円"
            placeholder="入力してください"
            isAnswer={false}
            onChange={(value) =>
              updateInput("initialAssets", value)
            }
          />

          <FixedField
            label="毎月の積立額"
            value={currentInputs.monthlyContribution}
            suffix="円"
            placeholder="入力してください"
            isAnswer={mode === "requiredMonthly"}
            onChange={(value) =>
              updateInput("monthlyContribution", value)
            }
          />

          <FixedField
            label="想定年利"
            value={currentInputs.annualReturnPercent}
            suffix="%"
            placeholder="入力してください"
            isAnswer={mode === "requiredReturn"}
            allowDecimal
            allowNegative
            onChange={(value) =>
              updateInput("annualReturnPercent", value)
            }
          />

          <FixedField
            label="運用期間"
            value={currentInputs.years}
            suffix="年"
            placeholder="入力してください"
            isAnswer={mode === "requiredDuration"}
            onChange={(value) =>
              updateInput("years", value)
            }
          />

          <div className="md:col-span-2">
            <FixedField
              label="目標金額"
              value={currentInputs.targetAssets}
              suffix="円"
              placeholder="入力してください"
              isAnswer={false}
              onChange={(value) =>
                updateInput("targetAssets", value)
              }
            />
          </div>
        </div>

        {errorMessages.length > 0 && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            <p className="font-bold">
              入力内容を確認してください
            </p>

            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errorMessages.map((message) => (
                <li key={message}>
                  {message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={clearCurrentModeInputs}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
          >
            ↻ このモードの入力をクリア
          </button>

          <button
            type="button"
            onClick={calculate}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:from-blue-600 hover:to-blue-800"
          >
            計算する
          </button>
        </div>
      </div>

      {result && (
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-sm md:p-8">
          {renderResult()}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs text-slate-500 shadow-sm">
        <p>
          ※ 毎月初に積み立て、その後1か月分を運用する前提で計算しています。
        </p>

        {mode === "requiredReturn" && (
          <p className="mt-2 text-amber-700">
            ※
            必要な年利は計算上の目安であり、表示された利回りでの運用成果を保証するものではありません。
          </p>
        )}
      </div>
    </section>
  );
}