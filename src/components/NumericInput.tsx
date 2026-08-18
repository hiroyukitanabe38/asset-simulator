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

  allowEmpty?: boolean;
  onEmpty?: () => void;

  placeholder?: string;
  suffix?: string;

  className?: string;
};

function convertFullWidthToHalfWidth(
  value: string
) {
  return value
    .replace(
      /[０-９]/g,
      (char) =>
        String.fromCharCode(
          char.charCodeAt(0) -
            0xfee0
        )
    )
    .replace(/．/g, ".")
    .replace(/，/g, ",")
    .replace(
      /[－ー−]/g,
      "-"
    )
    .replace(/　/g, " ");
}

function sanitizeInput(
  value: string,
  allowDecimal: boolean,
  allowNegative: boolean
) {
  let normalized =
    convertFullWidthToHalfWidth(
      value
    );

  normalized =
    normalized.replace(
      /[, ]/g,
      ""
    );

  normalized =
    normalized.replace(
      /[^0-9.\-]/g,
      ""
    );

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

    if (firstDot !== -1) {
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

function formatNumber(
  value: number | null,
  allowDecimal: boolean
) {
  if (
    value === null ||
    !Number.isFinite(value)
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

  placeholder,
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

  const handleFocus = () => {
    setIsEditing(true);

    setDisplayValue(
      value === null
        ? ""
        : String(value)
    );

    requestAnimationFrame(
      () => {
        inputRef.current?.select();
      }
    );
  };

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

    if (
      isBlank &&
      allowEmpty
    ) {
      setDisplayValue("");
      setIsEditing(false);
      onEmpty?.();
      return;
    }

    if (isBlank) {
      if (value !== null) {
        normalized =
          String(value);
      } else if (
        min !== undefined
      ) {
        normalized =
          String(min);
      } else {
        normalized = "0";
      }
    }

    let numericValue =
      Number(normalized);

    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      numericValue =
        value ?? min ?? 0;
    }

    if (min !== undefined) {
      numericValue =
        Math.max(
          min,
          numericValue
        );
    }

    if (max !== undefined) {
      numericValue =
        Math.min(
          max,
          numericValue
        );
    }

    if (!allowDecimal) {
      numericValue =
        Math.round(
          numericValue
        );
    }

    onValueChange(
      numericValue
    );

    setDisplayValue(
      formatNumber(
        numericValue,
        allowDecimal
      )
    );

    setIsEditing(false);
  };

  const handleBlur = () => {
    commitValue();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();
      inputRef.current?.blur();
    }

    if (
      event.key === "Escape"
    ) {
      event.preventDefault();

      setDisplayValue(
        formatNumber(
          value,
          allowDecimal
        )
      );

      setIsEditing(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        inputMode={
          allowDecimal
            ? "decimal"
            : "numeric"
        }
        value={displayValue}
        placeholder={placeholder}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={
          handleKeyDown
        }
        className={`
          min-w-0
          w-full
          rounded-xl
          border
          border-slate-200
          px-4
          py-3
          text-lg
          outline-none
          transition
          placeholder:text-slate-300
          focus:border-blue-500
          focus:ring-1
          focus:ring-blue-500
          ${className}
        `}
      />

      {suffix && (
        <span className="shrink-0 whitespace-nowrap text-slate-700">
          {suffix}
        </span>
      )}
    </div>
  );
}