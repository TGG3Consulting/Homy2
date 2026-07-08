"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputOTPContextValue {
  value: string;
  slots: { char: string; hasFakeCaret: boolean; isActive: boolean }[];
}

const InputOTPContext = React.createContext<InputOTPContextValue>({
  value: "",
  slots: [],
});

interface InputOTPProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  maxLength: number;
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
}

const InputOTP = React.forwardRef<HTMLInputElement, InputOTPProps>(
  ({ className, containerClassName, maxLength, value, onChange, children, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [activeIndex, setActiveIndex] = React.useState(0);

    React.useImperativeHandle(ref, () => inputRef.current!);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.replace(/\D/g, "").slice(0, maxLength);
      onChange(newValue);
      setActiveIndex(Math.min(newValue.length, maxLength - 1));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !value) {
        setActiveIndex(0);
      }
    };

    const handleFocus = () => {
      setActiveIndex(Math.min(value.length, maxLength - 1));
    };

    const slots = Array.from({ length: maxLength }).map((_, i) => ({
      char: value[i] || "",
      hasFakeCaret: i === value.length && i < maxLength,
      isActive: i === value.length,
    }));

    const contextValue = React.useMemo(
      () => ({ value, slots }),
      [value, slots]
    );

    return (
      <InputOTPContext.Provider value={contextValue}>
        <div
          className={cn(
            "flex items-center gap-2 has-[:disabled]:opacity-50",
            containerClassName
          )}
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            className={cn(
              "sr-only absolute inset-0 opacity-0 pointer-events-none",
              className
            )}
            {...props}
          />
          {children}
        </div>
      </InputOTPContext.Provider>
    );
  }
);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));
InputOTPGroup.displayName = "InputOTPGroup";

interface InputOTPSlotProps extends React.HTMLAttributes<HTMLDivElement> {
  index: number;
}

const InputOTPSlot = React.forwardRef<HTMLDivElement, InputOTPSlotProps>(
  ({ index, className, ...props }, ref) => {
    const { slots } = React.useContext(InputOTPContext);
    const { char, hasFakeCaret, isActive } = slots[index] || {
      char: "",
      hasFakeCaret: false,
      isActive: false,
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-12 w-12 items-center justify-center border-y border-r border-input text-lg font-semibold shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
          isActive && "z-10 ring-2 ring-ring",
          className
        )}
        {...props}
      >
        {char}
        {hasFakeCaret && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-5 w-px animate-pulse bg-foreground" />
          </div>
        )}
      </div>
    );
  }
);
InputOTPSlot.displayName = "InputOTPSlot";

export { InputOTP, InputOTPGroup, InputOTPSlot };
