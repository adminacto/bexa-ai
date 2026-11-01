import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

const Select = ({ className, placeholder, children, ...props }: SelectProps) => {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
};

export { Select };
