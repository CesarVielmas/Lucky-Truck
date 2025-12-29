"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SimpleSeparationProps
  extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  circleSize?: "sm" | "md" | "lg";
  borderOption?: "sm" | "md" | "lg";
  lineSize?: "sm" | "md" | "lg";
  bgColor?: string;
  children?: React.ReactNode;
}

export const Separation = React.forwardRef<HTMLDivElement, SimpleSeparationProps>(
  ({
    className,
    orientation = "horizontal",
    circleSize = "md",
    bgColor = "white",
    borderOption = "sm",
    lineSize = "sm",
    children,
    ...props
  }, ref) => {

    const containerClasses = cn(
      "flex items-center justify-center h-full w-full",
      orientation === "horizontal" ? "flex-row" : "flex-col",
      className
    );

    const lineClasses = cn(
      "flex-1 bg-current",
      bgColor,
      lineSize === "sm" ? "h-1 w-full" : lineSize === "md" ? "h-2 w-full" : "h-4 w-full",
      borderOption === "sm" ? "rounded-sm" : borderOption === "md" ? "rounded-md" : "rounded-lg"
    );

    const circleSizeClasses = {
      sm: "w-6 h-6 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-14 h-14 text-base"
    }[circleSize];

    return (
      <div ref={ref} className={containerClasses} {...props}>
        <div className={lineClasses} />
        <div
          className={cn(
            "circle-container flex items-center justify-center rounded-full border border-gray-300 bg-white mx-4",
            bgColor,
            circleSizeClasses
          )}
        >
          {children}
        </div>
        <div className={lineClasses} />
      </div>
    );
  }
);

Separation.displayName = "Separation";