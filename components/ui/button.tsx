import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = ({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg hover:shadow-xl",
    outline: "border border-card-border bg-transparent hover:bg-card-hover",
    ghost: "hover:bg-card-hover hover:text-primary",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-6 text-base",
    icon: "h-9 w-9",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  );
};

export { Button };
