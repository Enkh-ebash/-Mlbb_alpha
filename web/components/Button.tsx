"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outline";
  loading?: boolean;
}

export function Button({
  variant = "filled",
  loading = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    "w-full rounded-xl px-5 py-3 font-body font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "filled"
      ? "bg-primary text-white hover:bg-primary/90"
      : "border border-white/15 text-text-primary hover:border-teal hover:text-teal";

  return (
    <button className={`${base} ${styles} ${className}`} disabled={disabled || loading} {...rest}>
      {loading ? "Уншиж байна…" : children}
    </button>
  );
}
