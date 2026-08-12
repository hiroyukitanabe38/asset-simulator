"use client";

import {
  useEffect,
} from "react";

import NumericInput from "@/components/NumericInput";

export type ContributionSetting = {
  startYear: number;

  // null = 運用期間の最後まで
  endYear: number | null;

  monthlyAmount: number;
};

type ContributionSettingsProps = {
  years: number;

  monthlyContribution: number;

  settings: ContributionSetting[];

  onChange: (
    settings: ContributionSetting[]
  ) => void;

  onValidationChange: (
    hasError: boolean
  ) => void;
};

export default function ContributionSettings({
  years,
  monthlyContribution,
  settings,
  onChange,
  onValidationChange,
}: ContributionSettingsProps) {
  // =========================
  // 積立設定を追加
  // =========================

  const addSetting = () => {
    // 1個目
    if (
      settings.length ===
      0
    ) {
      onChange([
        {
          startYear: 1,

          endYear: null,

          monthlyAmount:
            monthlyContribution,
        },
      ]);

      return;
    }

    const lastSetting =
      settings[
        settings.length -
        1
      ];

    // 前の終了年が未入力なら
    // 次の開始年を決められない
    if (
      lastSetting.endYear ===
      null
    ) {
      return;
    }

    const nextStartYear =
      lastSetting.endYear +
      1;

    // 運用期間を超えていたら追加しない
    if (
      nextStartYear >
      years
    ) {
      return;
    }

    onChange([
      ...settings,

      {
        startYear:
          nextStartYear,

        // 終了年は空白
        endYear: null,

        // 前の積立額を引き継ぐ
        monthlyAmount:
          lastSetting.monthlyAmount,
      },
    ]);
  };

  // =========================
  // 積立額更新
  // =========================

  const updateMonthlyAmount = (
    index: number,
    value: number
  ) => {
    onChange(
      settings.map(
        (
          setting,
          settingIndex
        ) =>
          settingIndex ===
          index
            ? {
                ...setting,

                monthlyAmount:
                  value,
              }
            : setting
      )
    );
  };

  // =========================
  // 終了年更新
  //
  // 次の設定がある場合、
  // 開始年も自動的に
  // 「終了年＋1」に更新
  // =========================

  const updateEndYear = (
    index: number,
    value: number | null
  ) => {
    const updatedSettings =
      settings.map(
        (setting) => ({
          ...setting,
        })
      );

    updatedSettings[
      index
    ].endYear =
      value;

    if (
      value !== null &&
      updatedSettings[
        index + 1
      ]
    ) {
      updatedSettings[
        index + 1
      ].startYear =
        value + 1;
    }

    onChange(
      updatedSettings
    );
  };

  // =========================
  // 削除
  // =========================

  const removeSetting = (
    index: number
  ) => {
    const updated =
      settings.filter(
        (
          _,
          settingIndex
        ) =>
          settingIndex !==
          index
      );

    // =========================
    // 削除後も、
    // 後続の開始年を
    // 直前終了年＋1に整える
    // =========================

    for (
      let i = 1;
      i < updated.length;
      i++
    ) {
      const previous =
        updated[
          i - 1
        ];

      if (
        previous.endYear !==
        null
      ) {
        updated[
          i
        ] = {
          ...updated[
            i
          ],

          startYear:
            previous.endYear +
            1,
        };
      }
    }

    // 最初の設定が残っている場合
    // 開始年は1年目
    if (
      updated.length >
      0
    ) {
      updated[
        0
      ] = {
        ...updated[
          0
        ],

        startYear: 1,
      };
    }

    onChange(
      updated
    );
  };

  // =========================
  // エラー
  // =========================

  const getErrors = () => {
    const errors: string[] =
      [];

    settings.forEach(
      (
        setting,
        index
      ) => {
        if (
          setting.startYear <
            1 ||
          setting.startYear >
            years
        ) {
          errors.push(
            `${index + 1}つ目の開始年は1〜${years}年の範囲で設定してください`
          );
        }

        // 終了年が入力されている場合のみ判定
        if (
          setting.endYear !==
          null
        ) {
          if (
            setting.endYear <
              1 ||
            setting.endYear >
              years
          ) {
            errors.push(
              `${index + 1}つ目の終了年は1〜${years}年の範囲で設定してください`
            );
          }

          if (
            setting.startYear >
            setting.endYear
          ) {
            errors.push(
              `${index + 1}つ目の期間は、開始年を終了年以下にしてください`
            );
          }
        }

        // =========================
        // 後ろに設定があるのに
        // 終了年が空欄
        // =========================

        if (
          index <
            settings.length -
              1 &&
          setting.endYear ===
            null
        ) {
          errors.push(
            `${index + 1}つ目の終了年を入力してください`
          );
        }

        if (
          setting.monthlyAmount <
          0
        ) {
          errors.push(
            `${index + 1}つ目の積立額は0円以上にしてください`
          );
        }
      }
    );

    // =========================
    // 重複確認
    // =========================

    for (
      let i = 0;
      i < settings.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < settings.length;
        j++
      ) {
        const a =
          settings[i];

        const b =
          settings[j];

        const aEnd =
          a.endYear ??
          years;

        const bEnd =
          b.endYear ??
          years;

        const isOverlapping =
          a.startYear <=
            bEnd &&
          b.startYear <=
            aEnd;

        if (
          isOverlapping
        ) {
          errors.push(
            `${i + 1}つ目と${j + 1}つ目の積立期間が重複しています`
          );
        }
      }
    }

    return [
      ...new Set(
        errors
      ),
    ];
  };

  const errors =
    getErrors();

  const hasError =
    errors.length >
    0;

  // =========================
  // 親へエラー通知
  // =========================

  useEffect(() => {
    onValidationChange(
      hasError
    );
  }, [
    hasError,
    onValidationChange,
  ]);

  // =========================
  // 次を追加できるか
  // =========================

  const lastSetting =
    settings.length >
    0
      ? settings[
          settings.length -
            1
        ]
      : null;

  const canAddSetting =
    settings.length ===
      0 ||
    (
      lastSetting !==
        null &&
      lastSetting.endYear !==
        null &&
      lastSetting.endYear <
        years
    );

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm leading-6 text-slate-500">
        終了年を空欄にすると、
        その積立額を運用期間の最後まで適用します。
        新しい積立期間を追加する場合は、
        直前の設定に終了年を入力してください。
      </p>

      {settings.map(
        (
          setting,
          index
        ) => (
          <div
            key={
              index
            }
            className="rounded-2xl border border-slate-200 p-4"
          >
            <div className="mb-3 font-bold">
              積立設定{" "}
              {index + 1}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* =========================
                  開始年
                  自動入力・編集不可
              ========================= */}

              <label>
                <span className="mb-1 block text-sm text-slate-500">
                  開始年
                </span>

                <div className="flex items-center gap-2">
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg text-slate-700">
                    {setting.startYear.toLocaleString(
                      "ja-JP"
                    )}
                  </div>

                  <span className="whitespace-nowrap text-slate-700">
                    年目
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  自動入力
                </p>
              </label>

              {/* =========================
                  終了年
              ========================= */}

              <label>
                <span className="mb-1 block text-sm text-slate-500">
                  終了年
                </span>

                <NumericInput
                  value={
                    setting.endYear
                  }

                  onValueChange={(
                    value
                  ) =>
                    updateEndYear(
                      index,
                      value
                    )
                  }

                  allowEmpty

                  onEmpty={() =>
                    updateEndYear(
                      index,
                      null
                    )
                  }

                  min={
                    setting.startYear
                  }

                  max={
                    years
                  }

                  suffix="年目"
                />

                {setting.endYear ===
                  null && (
                  <p className="mt-1 text-xs text-slate-400">
                    空欄の場合は
                    {years}
                    年目まで継続
                  </p>
                )}
              </label>

              {/* =========================
                  積立額
              ========================= */}

              <label>
                <span className="mb-1 block text-sm text-slate-500">
                  毎月の積立額
                </span>

                <NumericInput
                  value={
                    setting.monthlyAmount
                  }

                  onValueChange={(
                    value
                  ) =>
                    updateMonthlyAmount(
                      index,
                      value
                    )
                  }

                  min={0}

                  suffix="円"
                />
              </label>
            </div>

            <button
              type="button"

              onClick={() =>
                removeSetting(
                  index
                )
              }

              className="mt-4 text-sm font-medium text-red-500"
            >
              この期間を削除
            </button>
          </div>
        )
      )}

      {/* =========================
          エラー
      ========================= */}

      {hasError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="font-bold text-red-700">
            入力内容を確認してください
          </p>

          <ul className="mt-2 space-y-1 text-sm text-red-600">
            {errors.map(
              (error) => (
                <li
                  key={
                    error
                  }
                >
                  ・
                  {error}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* =========================
          追加
      ========================= */}

      <button
        type="button"

        onClick={
          addSetting
        }

        disabled={
          !canAddSetting
        }

        className={`
          rounded-xl
          border
          px-4
          py-3
          font-bold
          transition
          ${
            canAddSetting
              ? "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          }
        `}
      >
        ＋ 積立期間を追加
      </button>

      {settings.length >
        0 &&
        !canAddSetting &&
        lastSetting?.endYear ===
          null && (
          <p className="text-xs text-slate-400">
            次の積立期間を追加する場合は、
            現在の設定に終了年を入力してください。
          </p>
        )}
    </div>
  );
}