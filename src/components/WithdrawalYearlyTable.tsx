"use client";

import { useState } from "react";

import type {
  WithdrawalYearlyResult,
} from "@/lib/finance/calculator";

type DisplayMode =
  | "age"
  | "year";

type WithdrawalYearlyTableProps = {
  data: WithdrawalYearlyResult[];

  displayMode: DisplayMode;

  withdrawalStartAge: number;
};

const formatManYen = (
  value: number
) =>
  `${Math.round(
    value / 10_000
  ).toLocaleString(
    "ja-JP"
  )}万円`;

const formatYen = (
  value: number
) =>
  `${Math.round(
    value
  ).toLocaleString(
    "ja-JP"
  )}円`;

export default function WithdrawalYearlyTable({
  data,
  displayMode,
  withdrawalStartAge,
}: WithdrawalYearlyTableProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  return (
    <div className="mt-8">

      {/* =========================
          タイトル・折りたたみ
      ========================= */}

      <button
        type="button"
        onClick={() =>
          setIsOpen(
            (prev) => !prev
          )
        }
        className="flex w-full items-start justify-between gap-4 text-left"
        aria-expanded={
          isOpen
        }
      >
        <div>
          <h3 className="text-lg font-bold">
            年ごとの取り崩し一覧
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            各年の資産残高と取り崩し状況を確認
          </p>
        </div>

        <span
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            text-xl
            font-bold
            leading-none
            text-slate-400
          "
          aria-hidden="true"
        >
          {isOpen
            ? "−"
            : "+"}
        </span>
      </button>

      {/* =========================
          折りたたみ内容
      ========================= */}

      {isOpen && (
        <>

          {/* =========================
              スマホ版
          ========================= */}

          <div
            className="
              mt-5
              max-h-[70vh]
              overflow-y-auto
              md:hidden
            "
          >

            {/* ヘッダー固定 */}

            <div
              className="
                sticky
                top-0
                z-20
                grid
                grid-cols-[0.8fr_1.15fr_1.3fr]
                gap-2
                border-b
                border-slate-200
                bg-white
                px-1
                py-3
                text-sm
                font-medium
                text-slate-500
              "
            >
              <div>
                {displayMode ===
                "age"
                  ? "年齢"
                  : "年"}
              </div>

              <div>
                年末残高
              </div>

              <div>
                月額取り崩し
              </div>
            </div>

            {/* 本文 */}

            <div>
              {data.map(
                (row) => {
                  const depleted =
                    row.endAssets <=
                    0;

                  const age =
                    withdrawalStartAge +
                    row.year -
                    1;

                  return (
                    <div
                      key={
                        row.year
                      }
                      className={`
                        grid
                        grid-cols-[0.8fr_1.15fr_1.3fr]
                        gap-2
                        border-b
                        border-slate-100
                        px-1
                        py-4
                        ${
                          depleted
                            ? "bg-red-50/40"
                            : ""
                        }
                      `}
                    >
                      <div className="font-bold">
                        {displayMode ===
                        "age"
                          ? `${age}歳`
                          : `${row.year}年目`}
                      </div>

                      <div
                        className={`font-bold ${
                          depleted
                            ? "text-red-500"
                            : "text-slate-900"
                        }`}
                      >
                        {formatManYen(
                          row.endAssets
                        )}
                      </div>

                      <div className="text-slate-700">
                        {formatYen(
                          row.monthlyWithdrawal
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* =========================
              PC版
          ========================= */}

          <div
            className="
              mt-5
              hidden
              max-h-[70vh]
              w-full
              overflow-auto
              md:block
            "
          >
            <table className="w-full min-w-[760px] table-fixed border-collapse">

              {/* ヘッダー固定 */}

              <thead>
                <tr className="text-left text-sm text-slate-500">

                  <th
                    className="
                      sticky
                      top-0
                      z-20
                      w-[10%]
                      border-b
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                    "
                  >
                    {displayMode ===
                    "age"
                      ? "年齢"
                      : "年"}
                  </th>

                  <th
                    className="
                      sticky
                      top-0
                      z-20
                      w-[18%]
                      border-b
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                    "
                  >
                    年初残高
                  </th>

                  <th
                    className="
                      sticky
                      top-0
                      z-20
                      w-[18%]
                      border-b
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                    "
                  >
                    月額取り崩し
                  </th>

                  <th
                    className="
                      sticky
                      top-0
                      z-20
                      w-[18%]
                      border-b
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                    "
                  >
                    年間取り崩し額
                  </th>

                  <th
                    className="
                      sticky
                      top-0
                      z-20
                      w-[18%]
                      border-b
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                    "
                  >
                    年間運用益
                  </th>

                  <th
                    className="
                      sticky
                      top-0
                      z-20
                      w-[18%]
                      border-b
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                    "
                  >
                    年末残高
                  </th>

                </tr>
              </thead>

              <tbody>
                {data.map(
                  (row) => {
                    const depleted =
                      row.endAssets <=
                      0;

                    const age =
                      withdrawalStartAge +
                      row.year -
                      1;

                    return (
                      <tr
                        key={
                          row.year
                        }
                        className={`
                          border-b
                          border-slate-100
                          ${
                            depleted
                              ? "bg-red-50/40"
                              : ""
                          }
                        `}
                      >

                        <td className="px-3 py-4 font-bold">
                          {displayMode ===
                          "age"
                            ? `${age}歳`
                            : `${row.year}年目`}
                        </td>

                        <td className="whitespace-nowrap px-3 py-4">
                          {formatManYen(
                            row.startAssets
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-4">
                          {formatYen(
                            row.monthlyWithdrawal
                          )}
                        </td>

                        <td className="whitespace-nowrap px-3 py-4 font-medium text-amber-600">
                          -
                          {formatManYen(
                            row.yearlyWithdrawal
                          )}
                        </td>

                        <td
                          className={`
                            whitespace-nowrap
                            px-3
                            py-4
                            font-medium
                            ${
                              row.investmentProfit >=
                              0
                                ? "text-emerald-600"
                                : "text-red-500"
                            }
                          `}
                        >
                          {row.investmentProfit >=
                          0
                            ? "+"
                            : ""}

                          {formatManYen(
                            row.investmentProfit
                          )}
                        </td>

                        <td
                          className={`
                            whitespace-nowrap
                            px-3
                            py-4
                            font-bold
                            ${
                              depleted
                                ? "text-red-500"
                                : "text-slate-900"
                            }
                          `}
                        >
                          {formatManYen(
                            row.endAssets
                          )}
                        </td>

                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {/* =========================
              補足
          ========================= */}

          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            年間運用益は、
            「年末残高 − 年初残高 ＋ 年間取り崩し額」
            で算出しています。
            取り崩しを行いながら、
            その年の運用によって資産がどれだけ増減したかを表します。
          </div>

        </>
      )}
    </div>
  );
}