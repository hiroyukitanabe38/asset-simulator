"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

type NumericInputProps = {
  value: number | null;

  onValueChange: (
    value: number
  ) => void;

  min?: number;
  max?: number;

  allowDecimal?: boolean;
  allowNegative?: boolean;

  // 空欄を許可するか
  allowEmpty?: boolean;

  // 空欄で確定した時
  onEmpty?: () => void;

  suffix?: string;

  className?: string;
};

// =========================
// 全角 → 半角
// =========================

function convertFullWidthToHalfWidth(
  value: string
) {
  return value
    // 全角数字
    .replace(
      /[０-９]/g,
      (char) =>
        String.fromCharCode(
          char.charCodeAt(0) -
            0xfee0
        )
    )

    // 全角ピリオド
    .replace(
      /．/g,
      "."
    )

    // 全角カンマ
    .replace(
      /，/g,
      ","
    )

    // 全角・類似マイナス
    .replace(
      /[－ー−]/g,
      "-"
    )

    // 全角スペース
    .replace(
      /　/g,
      " "
    );
}

// =========================
// 入力文字を整理
// =========================

function sanitizeInput(
  value: string,
  allowDecimal: boolean,
  allowNegative: boolean
) {
  let normalized =
    convertFullWidthToHalfWidth(
      value
    );

  // カンマ・空白を除去
  normalized =
    normalized.replace(
      /[, ]/g,
      ""
    );

  // 数字・小数点・マイナス以外を除去
  normalized =
    normalized.replace(
      /[^0-9.\-]/g,
      ""
    );

  // =========================
  // マイナス処理
  // =========================

  if (!allowNegative) {
    normalized =
      normalized.replace(
        /-/g,
        ""
      );
  } else {
    const isNegative =
      normalized.startsWith(
        "-"
      );

    normalized =
      normalized.replace(
        /-/g,
        ""
      );

    if (isNegative) {
      normalized =
        `-${normalized}`;
    }
  }

  // =========================
  // 小数点処理
  // =========================

  if (!allowDecimal) {
    normalized =
      normalized.replace(
        /\./g,
        ""
      );
  } else {
    const firstDot =
      normalized.indexOf(
        "."
      );

    if (
      firstDot !== -1
    ) {
      normalized =
        normalized.slice(
          0,
          firstDot + 1
        ) +
        normalized
          .slice(
            firstDot + 1
          )
          .replace(
            /\./g,
            ""
          );
    }
  }

  return normalized;
}

// =========================
// カンマ表示
// =========================

function formatNumber(
  value: number | null,
  allowDecimal: boolean
) {
  if (
    value === null ||
    !Number.isFinite(
      value
    )
  ) {
    return "";
  }

  return value.toLocaleString(
    "ja-JP",
    {
      maximumFractionDigits:
        allowDecimal
          ? 10
          : 0,
    }
  );
}

export default function NumericInput({
  value,
  onValueChange,

  min,
  max,

  allowDecimal = false,
  allowNegative = false,

  allowEmpty = false,
  onEmpty,

  suffix,

  className = "",
}: NumericInputProps) {
  const [
    displayValue,
    setDisplayValue,
  ] = useState(
    formatNumber(
      value,
      allowDecimal
    )
  );

  const [
    isEditing,
    setIsEditing,
  ] = useState(false);

  const inputRef =
    useRef<HTMLInputElement>(
      null
    );

  // =========================
  // 外部から値が変わった場合
  // =========================

  useEffect(() => {
    if (!isEditing) {
      setDisplayValue(
        formatNumber(
          value,
          allowDecimal
        )
      );
    }
  }, [
    value,
    allowDecimal,
    isEditing,
  ]);

  // =========================
  // フォーカス
  // =========================

  const handleFocus = () => {
    setIsEditing(true);

    // 編集中はカンマを外す
    setDisplayValue(
      value === null
        ? ""
        : String(value)
    );

    // 全選択
    requestAnimationFrame(
      () => {
        inputRef.current?.select();
      }
    );
  };

  // =========================
  // 入力中
  //
  // ここでは親へ値を渡さない
  // =========================

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const sanitized =
      sanitizeInput(
        event.target.value,
        allowDecimal,
        allowNegative
      );

    setDisplayValue(
      sanitized
    );
  };

  // =========================
  // 値を確定
  // =========================

  const commitValue = () => {
    let normalized =
      sanitizeInput(
        displayValue,
        allowDecimal,
        allowNegative
      );

    const isBlank =
      normalized === "" ||
      normalized === "-" ||
      normalized === "." ||
      normalized === "-.";

    // =========================
    // 空欄を許可
    // =========================

    if (
      isBlank &&
      allowEmpty
    ) {
      setDisplayValue(
        ""
      );

      setIsEditing(
        false
      );

      onEmpty?.();

      return;
    }

    // =========================
    // 空欄を許可しない
    // =========================

    if (isBlank) {
      if (
        value !== null
      ) {
        normalized =
          String(value);
      } else if (
        min !== undefined
      ) {
        normalized =
          String(min);
      } else {
        normalized =
          "0";
      }
    }

    let numericValue =
      Number(
        normalized
      );

    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      numericValue =
        value ??
        min ??
        0;
    }

    // =========================
    // 最小値
    // =========================

    if (
      min !== undefined
    ) {
      numericValue =
        Math.max(
          min,
          numericValue
        );
    }

    // =========================
    // 最大値
    // =========================

    if (
      max !== undefined
    ) {
      numericValue =
        Math.min(
          max,
          numericValue
        );
    }

    // =========================
    // 整数項目
    // =========================

    if (!allowDecimal) {
      numericValue =
        Math.round(
          numericValue
        );
    }

    // 親へ確定値を渡す
    onValueChange(
      numericValue
    );

    // カンマ表示
    setDisplayValue(
      formatNumber(
        numericValue,
        allowDecimal
      )
    );

    setIsEditing(
      false
    );
  };

  // =========================
  // フォーカスを外した時
  // =========================

  const handleBlur = () => {
    commitValue();
  };

  // =========================
  // Enter / Escape
  // =========================

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key ===
      "Enter"
    ) {
      event.preventDefault();

      inputRef.current?.blur();
    }

    if (
      event.key ===
      "Escape"
    ) {
      event.preventDefault();

      setDisplayValue(
        formatNumber(
          value,
          allowDecimal
        )
      );

      setIsEditing(
        false
      );

      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={
          inputRef
        }

        type="text"

        inputMode={
          allowDecimal
            ? "decimal"
            : "numeric"
        }

        value={
          displayValue
        }

        onFocus={
          handleFocus
        }

        onChange={
          handleChange
        }

        onBlur={
          handleBlur
        }

        onKeyDown={
          handleKeyDown
        }

        className={`
          w-full
          rounded-xl
          border
          border-slate-200
          px-4
          py-3
          text-lg
          outline-none
          transition
          focus:border-blue-500
          focus:ring-1
          focus:ring-blue-500
          ${className}
        `}
      />

      {suffix && (
        <span className="whitespace-nowrap text-slate-700">
          {suffix}
        </span>
      )}
    </div>
  );
}