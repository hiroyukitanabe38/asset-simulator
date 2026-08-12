"use client";

import type {
  YearlyResult,
} from "@/types/finance";

type YearlyAssetTableProps = {
  data: YearlyResult[];

  embedded?: boolean;
};

const formatManYen = (
  value: number
) =>
  `${Math.round(
    value / 10_000
  ).toLocaleString(
    "ja-JP"
  )}万円`;

export default function YearlyAssetTable({
  data,
  embedded = false,
}: YearlyAssetTableProps) {
  const tableContent = (
    <div className="w-full">

      {/* =========================
          スマホ版
      ========================= */}

      <div className="md:hidden">
        <div className="grid grid-cols-[0.8fr_1.2fr_1.2fr] gap-2 border-b border-slate-200 px-1 pb-3 text-sm font-medium text-slate-500">
          <div>
            年
          </div>

          <div>
            総資産
          </div>

          <div>
            運用益
          </div>
        </div>

        <div>
          {data.map(
            (row) => (
              <div
                key={
                  row.year
                }
                className="grid grid-cols-[0.8fr_1.2fr_1.2fr] gap-2 border-b border-slate-100 px-1 py-4"
              >
                <div className="font-bold text-slate-900">
                  {row.year}
                  年目
                </div>

                <div className="font-bold text-slate-900">
                  {formatManYen(
                    row.assets
                  )}
                </div>

                <div
                  className={
                    row.profit >= 0
                      ? "font-medium text-emerald-600"
                      : "font-medium text-red-500"
                  }
                >
                  {row.profit >= 0
                    ? "+"
                    : ""}

                  {formatManYen(
                    row.profit
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* =========================
          PC版
      ========================= */}

      <div className="hidden md:block">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
              <th className="w-[15%] px-4 py-3">
                年
              </th>

              <th className="w-[22%] px-4 py-3">
                総資産
              </th>

              <th className="w-[22%] px-4 py-3">
                元本
              </th>

              <th className="w-[22%] px-4 py-3">
                運用益
              </th>

              <th className="w-[19%] px-4 py-3">
                運用益率
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map(
              (row) => {
                const profitRate =
                  row.principal >
                  0
                    ? (
                        row.profit /
                        row.principal
                      ) *
                      100
                    : 0;

                return (
                  <tr
                    key={
                      row.year
                    }
                    className="border-b border-slate-100"
                  >
                    <td className="px-4 py-4 font-bold">
                      {row.year}
                      年目
                    </td>

                    <td className="px-4 py-4 font-bold">
                      {formatManYen(
                        row.assets
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {formatManYen(
                        row.principal
                      )}
                    </td>

                    <td
                      className={`px-4 py-4 font-medium ${
                        row.profit >=
                        0
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {row.profit >=
                      0
                        ? "+"
                        : ""}

                      {formatManYen(
                        row.profit
                      )}
                    </td>

                    <td
                      className={`px-4 py-4 font-medium ${
                        profitRate >=
                        0
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {profitRate >=
                      0
                        ? "+"
                        : ""}

                      {profitRate.toFixed(
                        1
                      )}
                      %
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // =========================
  // 埋め込み表示
  // =========================

  if (embedded) {
    return tableContent;
  }

  // =========================
  // 単体表示
  // =========================

  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <div>
        <h2 className="text-xl font-bold">
          年ごとの資産一覧
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          各年の資産残高と運用状況を確認
        </p>
      </div>

      <div className="mt-6">
        {tableContent}
      </div>
    </section>
  );
}