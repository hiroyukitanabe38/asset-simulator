import {
  ContributionPeriod,
  SimulationInput,
  SimulationResult,
} from "@/types/finance";

// =========================
// 実効年率 → 月利
// =========================

export function annualRateToMonthlyRate(
  annualReturn: number
): number {
  if (annualReturn <= -1) {
    throw new Error(
      "年利は-100%を超える値にしてください"
    );
  }

  return (
    Math.pow(
      1 + annualReturn,
      1 / 12
    ) - 1
  );
}

// =========================
// 指定月の積立額を取得
// =========================

export function getMonthlyContribution(
  month: number,
  baseContribution: number,
  contributionPeriods: ContributionPeriod[] = []
): number {
  const matchedPeriod =
    contributionPeriods.find(
      (period) =>
        month >= period.startMonth &&
        month <= period.endMonth
    );

  return matchedPeriod
    ? matchedPeriod.monthlyAmount
    : baseContribution;
}

// =========================
// 全積立設定に同額を上乗せ
// =========================

function addAmountToContributionPeriods(
  contributionPeriods: ContributionPeriod[],
  additionalAmount: number
): ContributionPeriod[] {
  return contributionPeriods.map(
    (period) => ({
      ...period,
      monthlyAmount:
        period.monthlyAmount +
        additionalAmount,
    })
  );
}

// =========================
// 将来資産シミュレーション
// =========================

export function calculateFutureAssets(
  input: SimulationInput
): SimulationResult {
  const {
    annualReturn,
    years,
    contributionPeriods = [],
    investmentStyle =
      "lump_and_monthly",
  } = input;

  if (
    years < 1 ||
    years > 99
  ) {
    throw new Error(
      "運用期間は1年以上99年以下にしてください"
    );
  }

  if (
    annualReturn < -0.2 ||
    annualReturn > 0.3
  ) {
    throw new Error(
      "想定年利は-20%〜30%の範囲で設定してください"
    );
  }

  if (
    input.initialAssets < 0 ||
    input.monthlyContribution < 0
  ) {
    throw new Error(
      "資産額・積立額には0以上の金額を入力してください"
    );
  }

  let initialAssets =
    input.initialAssets;

  let baseContribution =
    input.monthlyContribution;

  if (
    investmentStyle ===
    "monthly_only"
  ) {
    initialAssets = 0;
  }

  if (
    investmentStyle ===
    "lump_only"
  ) {
    baseContribution = 0;
  }

  const totalMonths =
    years * 12;

  const monthlyRate =
    annualRateToMonthlyRate(
      annualReturn
    );

  let assets =
    initialAssets;

  let principal =
    initialAssets;

  const monthlyResults = [];
  const yearlyResults = [];

  for (
    let month = 1;
    month <= totalMonths;
    month++
  ) {
    let contribution =
      getMonthlyContribution(
        month,
        baseContribution,
        contributionPeriods
      );

    if (
      investmentStyle ===
      "lump_only"
    ) {
      contribution = 0;
    }

    // 月初積立
    assets +=
      contribution;

    principal +=
      contribution;

    // 1か月分運用
    assets *=
      1 + monthlyRate;

    monthlyResults.push({
      month,
      assets,
      principal,
    });

    if (
      month % 12 === 0
    ) {
      yearlyResults.push({
        year:
          month / 12,

        assets,

        principal,

        profit:
          assets -
          principal,
      });
    }
  }

  return {
    finalAssets:
      assets,

    totalPrincipal:
      principal,

    totalProfit:
      assets -
      principal,

    monthlyResults,

    yearlyResults,
  };
}

// =========================
// 必要な毎月積立額を逆算
// =========================

export function calculateRequiredMonthlyContribution(
  targetAssets: number,
  initialAssets: number,
  annualReturn: number,
  years: number,
  currentMonthlyContribution: number = 0,
  contributionPeriods: ContributionPeriod[] = []
): number | null {
  if (
    targetAssets <= 0
  ) {
    return null;
  }

  const currentResult =
    calculateFutureAssets({
      initialAssets,

      monthlyContribution:
        currentMonthlyContribution,

      annualReturn,

      years,

      contributionPeriods,
    });

  if (
    currentResult.finalAssets >=
    targetAssets
  ) {
    return currentMonthlyContribution;
  }

  let lowAdditional = 0;

  let highAdditional =
    10_000_000;

  const highPeriods =
    addAmountToContributionPeriods(
      contributionPeriods,
      highAdditional
    );

  const maxResult =
    calculateFutureAssets({
      initialAssets,

      monthlyContribution:
        currentMonthlyContribution +
        highAdditional,

      annualReturn,

      years,

      contributionPeriods:
        highPeriods,
    });

  if (
    maxResult.finalAssets <
    targetAssets
  ) {
    return null;
  }

  for (
    let i = 0;
    i < 100;
    i++
  ) {
    const additional =
      (
        lowAdditional +
        highAdditional
      ) / 2;

    const adjustedPeriods =
      addAmountToContributionPeriods(
        contributionPeriods,
        additional
      );

    const result =
      calculateFutureAssets({
        initialAssets,

        monthlyContribution:
          currentMonthlyContribution +
          additional,

        annualReturn,

        years,

        contributionPeriods:
          adjustedPeriods,
      });

    if (
      result.finalAssets >=
      targetAssets
    ) {
      highAdditional =
        additional;
    } else {
      lowAdditional =
        additional;
    }
  }

  const roundedAdditional =
    Math.ceil(
      highAdditional /
      1000
    ) * 1000;

  return (
    currentMonthlyContribution +
    roundedAdditional
  );
}

// =========================
// 必要利回りを逆算
// =========================

export function calculateRequiredReturn(
  targetAssets: number,
  initialAssets: number,
  monthlyContribution: number,
  years: number,
  contributionPeriods: ContributionPeriod[] = []
): number | null {
  if (
    targetAssets <= 0
  ) {
    return null;
  }

  let low = -0.2;
  let high = 0.3;

  const maxResult =
    calculateFutureAssets({
      initialAssets,

      monthlyContribution,

      annualReturn:
        high,

      years,

      contributionPeriods,
    });

  if (
    maxResult.finalAssets <
    targetAssets
  ) {
    return null;
  }

  const minResult =
    calculateFutureAssets({
      initialAssets,

      monthlyContribution,

      annualReturn:
        low,

      years,

      contributionPeriods,
    });

  if (
    minResult.finalAssets >=
    targetAssets
  ) {
    return low;
  }

  for (
    let i = 0;
    i < 100;
    i++
  ) {
    const mid =
      (low + high) / 2;

    const result =
      calculateFutureAssets({
        initialAssets,

        monthlyContribution,

        annualReturn:
          mid,

        years,

        contributionPeriods,
      });

    if (
      result.finalAssets >=
      targetAssets
    ) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return (
    Math.ceil(
      high * 1000
    ) / 1000
  );
}

// =========================
// 目標達成までの必要期間
// =========================

export function calculateRequiredDuration(
  targetAssets: number,
  initialAssets: number,
  monthlyContribution: number,
  annualReturn: number,
  currentYears: number,
  contributionPeriods: ContributionPeriod[] = []
): {
  months: number;
  years: number;
  remainingMonths: number;
} | null {
  if (
    targetAssets <= 0
  ) {
    return null;
  }

  if (
    initialAssets >=
    targetAssets
  ) {
    return {
      months: 0,
      years: 0,
      remainingMonths: 0,
    };
  }

  const monthlyRate =
    annualRateToMonthlyRate(
      annualReturn
    );

  let assets =
    initialAssets;

  const currentPlanMonths =
    currentYears * 12;

  const extensionContribution =
    getMonthlyContribution(
      currentPlanMonths,
      monthlyContribution,
      contributionPeriods
    );

  const maxMonths =
    99 * 12;

  for (
    let month = 1;
    month <= maxMonths;
    month++
  ) {
    let contribution: number;

    if (
      month <=
      currentPlanMonths
    ) {
      contribution =
        getMonthlyContribution(
          month,
          monthlyContribution,
          contributionPeriods
        );
    } else {
      contribution =
        extensionContribution;
    }

    assets +=
      contribution;

    assets *=
      1 + monthlyRate;

    if (
      assets >=
      targetAssets
    ) {
      return {
        months:
          month,

        years:
          Math.floor(
            month / 12
          ),

        remainingMonths:
          month % 12,
      };
    }
  }

  return null;
}

// =====================================================
// ここから取り崩しシミュレーション
// =====================================================

// =========================
// 取り崩し方法
// =========================

export type WithdrawalMethod =
  | "fixed"
  | "percentage";

// =========================
// 取り崩し入力
// =========================

export type WithdrawalInput = {
  initialAssets: number;

  annualReturn: number;

  years: number;

  method: WithdrawalMethod;

  monthlyWithdrawal?: number;

  annualWithdrawalRate?: number;
};

// =========================
// 月次取り崩し結果
// =========================

export type WithdrawalMonthlyResult = {
  month: number;

  assets: number;

  withdrawal: number;

  totalWithdrawn: number;
};

// =========================
// 年次取り崩し結果
// =========================

export type WithdrawalYearlyResult = {
  year: number;

  startAssets: number;

  endAssets: number;

  monthlyWithdrawal: number;

  yearlyWithdrawal: number;

  // その年の運用益
  investmentProfit: number;

  totalWithdrawn: number;
};

// =========================
// 取り崩し結果
// =========================

export type WithdrawalResult = {
  initialAssets: number;

  finalAssets: number;

  totalWithdrawn: number;

  initialMonthlyWithdrawal: number;

  finalMonthlyWithdrawal: number;

  depleted: boolean;

  depletionMonth: number | null;

  depletionYears: number | null;

  depletionRemainingMonths: number | null;

  monthlyResults: WithdrawalMonthlyResult[];

  yearlyResults: WithdrawalYearlyResult[];
};

// =========================
// 取り崩しシミュレーション
//
// 共通ルール
// ① 月初取り崩し
// ② 残った資産を1か月運用
//
// 定額
// 毎月同額
//
// 定率
// 年初残高 × 年率
// → 12分割
// =========================

export function calculateWithdrawalSimulation(
  input: WithdrawalInput
): WithdrawalResult {
  const {
    initialAssets,
    annualReturn,
    years,
    method,
  } = input;

  if (
    initialAssets < 0
  ) {
    throw new Error(
      "開始資産は0円以上にしてください"
    );
  }

  if (
    years < 1 ||
    years > 99
  ) {
    throw new Error(
      "取り崩し期間は1年以上99年以下にしてください"
    );
  }

  if (
    annualReturn < -0.2 ||
    annualReturn > 0.3
  ) {
    throw new Error(
      "取り崩し中の想定年利は-20%〜30%の範囲で設定してください"
    );
  }

  if (
    method === "fixed"
  ) {
    if (
      input.monthlyWithdrawal ===
        undefined ||
      input.monthlyWithdrawal < 0
    ) {
      throw new Error(
        "毎月の取り崩し額は0円以上にしてください"
      );
    }
  }

  if (
    method === "percentage"
  ) {
    if (
      input.annualWithdrawalRate ===
        undefined ||
      input.annualWithdrawalRate < 0 ||
      input.annualWithdrawalRate > 1
    ) {
      throw new Error(
        "年間取り崩し率は0%〜100%の範囲で設定してください"
      );
    }
  }

  const monthlyRate =
    annualRateToMonthlyRate(
      annualReturn
    );

  const totalMonths =
    years * 12;

  let assets =
    initialAssets;

  let totalWithdrawn =
    0;

  let currentMonthlyWithdrawal =
    method === "fixed"
      ? input.monthlyWithdrawal ?? 0
      : 0;

  let initialMonthlyWithdrawal =
    0;

  let finalMonthlyWithdrawal =
    0;

  let depleted =
    false;

  let depletionMonth:
    | number
    | null = null;

  const monthlyResults:
    WithdrawalMonthlyResult[] =
      [];

  const yearlyResults:
    WithdrawalYearlyResult[] =
      [];

  let yearStartAssets =
    initialAssets;

  let yearWithdrawn =
    0;

  for (
    let month = 1;
    month <= totalMonths;
    month++
  ) {
    const monthInYear =
      (month - 1) % 12 + 1;

    const year =
      Math.ceil(
        month / 12
      );

    // =========================
    // 年初処理
    // =========================

    if (
      monthInYear === 1
    ) {
      yearStartAssets =
        assets;

      yearWithdrawn =
        0;

      if (
        method ===
        "percentage"
      ) {
        const annualWithdrawal =
          yearStartAssets *
          (
            input.annualWithdrawalRate ??
            0
          );

        currentMonthlyWithdrawal =
          annualWithdrawal /
          12;
      }

      if (
        year === 1
      ) {
        initialMonthlyWithdrawal =
          currentMonthlyWithdrawal;
      }
    }

    // =========================
    // すでに資産ゼロ
    // =========================

    if (
      assets <= 0
    ) {
      assets = 0;

      currentMonthlyWithdrawal =
        0;

      monthlyResults.push({
        month,

        assets: 0,

        withdrawal: 0,

        totalWithdrawn,
      });

      if (
        monthInYear === 12
      ) {
        yearlyResults.push({
          year,

          startAssets:
            yearStartAssets,

          endAssets:
            0,

          monthlyWithdrawal:
            0,

          yearlyWithdrawal:
            yearWithdrawn,

          investmentProfit:
            0,

          totalWithdrawn,
        });
      }

      continue;
    }

    // =========================
    // 月初取り崩し
    // =========================

    const actualWithdrawal =
      Math.min(
        currentMonthlyWithdrawal,
        assets
      );

    assets -=
      actualWithdrawal;

    totalWithdrawn +=
      actualWithdrawal;

    yearWithdrawn +=
      actualWithdrawal;

    finalMonthlyWithdrawal =
      actualWithdrawal;

    // =========================
    // 資産が尽きた場合
    // =========================

    if (
      assets <= 0
    ) {
      assets = 0;

      if (
        !depleted
      ) {
        depleted =
          true;

        depletionMonth =
          month;
      }
    } else {
      // =========================
      // 運用
      // =========================

      assets *=
        1 +
        monthlyRate;
    }

    monthlyResults.push({
      month,

      assets,

      withdrawal:
        actualWithdrawal,

      totalWithdrawn,
    });

    // =========================
    // 年末
    // =========================

    if (
      monthInYear ===
      12
    ) {
      // 年末残高 =
      // 年初残高
      // - 年間取り崩し額
      // + 年間運用益
      //
      // よって
      // 年間運用益 =
      // 年末残高
      // - 年初残高
      // + 年間取り崩し額

      const investmentProfit =
        assets -
        yearStartAssets +
        yearWithdrawn;

      yearlyResults.push({
        year,

        startAssets:
          yearStartAssets,

        endAssets:
          assets,

        monthlyWithdrawal:
          currentMonthlyWithdrawal,

        yearlyWithdrawal:
          yearWithdrawn,

        investmentProfit,

        totalWithdrawn,
      });
    }
  }

  const depletionYears =
    depletionMonth !== null
      ? Math.floor(
          depletionMonth /
          12
        )
      : null;

  const depletionRemainingMonths =
    depletionMonth !== null
      ? depletionMonth %
        12
      : null;

  return {
    initialAssets,

    finalAssets:
      assets,

    totalWithdrawn,

    initialMonthlyWithdrawal,

    finalMonthlyWithdrawal,

    depleted,

    depletionMonth,

    depletionYears,

    depletionRemainingMonths,

    monthlyResults,

    yearlyResults,
  };
}