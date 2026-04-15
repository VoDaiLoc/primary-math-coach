"use client";

import { useState } from "react";
import { AnswerChoice } from "@/types";
import { cn } from "@/lib/utils";

// ── MCQ ───────────────────────────────────────────────────────────────────────

interface AnswerOptionsMCQProps {
  choices: AnswerChoice[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  /** When true, shows right/wrong colours and disables interaction. */
  showResult?: boolean;
  disabled?: boolean;
}

export function AnswerOptionsMCQ({
  choices,
  onSelect,
  selectedId,
  showResult = false,
  disabled = false,
}: AnswerOptionsMCQProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {choices.map((choice) => {
        const isSelected = selectedId === choice.id;
        const isCorrect  = choice.isCorrect;

        let stateClass = "border-neutral-200 bg-white hover:border-primary hover:bg-primary-light";
        if (showResult && isSelected && isCorrect)   stateClass = "border-success bg-success-light text-success font-semibold";
        else if (showResult && isSelected && !isCorrect) stateClass = "border-danger bg-danger-light text-danger font-semibold";
        else if (showResult && !isSelected && isCorrect) stateClass = "border-success/60 bg-success-light/40";
        else if (isSelected) stateClass = "border-primary bg-primary-light font-semibold text-primary";

        return (
          <button
            key={choice.id}
            onClick={() => !showResult && !disabled && onSelect(choice.id)}
            disabled={showResult || disabled}
            className={cn(
              "border-2 rounded-[10px] px-4 py-3 text-left text-sm transition-all cursor-pointer",
              (showResult || disabled) && "cursor-default",
              stateClass,
            )}
          >
            {choice.text}
          </button>
        );
      })}
    </div>
  );
}

// ── Fill-in ───────────────────────────────────────────────────────────────────

interface AnswerOptionsFillinProps {
  /** Controlled value from parent. When provided, parent owns the state. */
  value?: string;
  /** Called on every keystroke when in controlled mode. */
  onChange?: (value: string) => void;
  /** Called when user explicitly submits (Enter key or OK button). */
  onSubmit?: (value: string) => void;
  /** When true, locks input and shows correct answer. */
  showResult?: boolean;
  correctAnswer?: string;
  disabled?: boolean;
}

export function AnswerOptionsFillin({
  value: controlledValue,
  onChange,
  onSubmit,
  showResult = false,
  correctAnswer,
  disabled = false,
}: AnswerOptionsFillinProps) {
  // Internal state used only when no controlled value is provided (legacy usage).
  const [internalValue, setInternalValue] = useState("");

  const isControlled = controlledValue !== undefined;
  const value        = isControlled ? controlledValue : internalValue;

  function handleChange(v: string) {
    if (!isControlled) setInternalValue(v);
    onChange?.(v);
  }

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
  }

  const isLocked = showResult || disabled;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => !isLocked && handleChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLocked && handleSubmit()}
          disabled={isLocked}
          placeholder="Nhập câu trả lời..."
          className="flex-1 border-2 border-neutral-200 rounded-[8px] px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors disabled:bg-neutral-50"
        />
        {/* Show OK button only in legacy / non-controlled mode */}
        {!isControlled && !showResult && onSubmit && (
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-[8px] bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            OK
          </button>
        )}
      </div>
      {showResult && correctAnswer && (
        <p className="text-xs text-success font-medium">Đáp án đúng: {correctAnswer}</p>
      )}
    </div>
  );
}

