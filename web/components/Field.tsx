"use client";

import { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Field({ label, id, className = "", ...rest }: FieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-sm text-text-secondary">{label}</span>
      <input
        id={id}
        className={`w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-text-primary placeholder:text-text-secondary/60 focus:border-teal focus:outline-none ${className}`}
        {...rest}
      />
    </label>
  );
}
