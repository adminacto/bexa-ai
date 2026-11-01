import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, ReactNode } from "react";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ElementType;
}

export interface DropdownProps {
  trigger: ReactNode;
  options: DropdownOption[];
  onChange: (value: string) => void;
  value?: string;
  align?: "left" | "right";
}

const Dropdown = ({ trigger, options, onChange, value, align = "right" }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <>
          <div
            className={cn(
              "absolute z-50 mt-1 min-w-[160px] rounded-lg border border-card-border bg-card py-1 shadow-lg",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-card-hover transition-colors",
                  value === opt.value && "bg-primary/10 text-primary"
                )}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.icon && <opt.icon className="h-4 w-4" />}
                {opt.label}
                {value === opt.value && <Check className="h-4 w-4 ml-auto" />}
              </div>
            ))}
          </div>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export { Dropdown };
