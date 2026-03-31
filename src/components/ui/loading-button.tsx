"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger";
  icon?: ReactNode;
};

const variantClasses: Record<NonNullable<LoadingButtonProps["variant"]>, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger"
};

export function LoadingButton({
  children,
  className = "",
  disabled,
  icon,
  loading = false,
  loadingText,
  type = "button",
  variant = "primary",
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      className={`${variantClasses[variant]} ${className}`.trim()}
      disabled={disabled || loading}
      type={type}
    >
      {loading ? <Spinner className="mr-2" size="sm" /> : icon ? <span className="mr-2 inline-flex">{icon}</span> : null}
      <span>{loading ? loadingText || children : children}</span>
    </button>
  );
}
