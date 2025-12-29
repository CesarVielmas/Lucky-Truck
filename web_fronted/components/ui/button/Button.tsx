"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  textButton : string;
  isActive : boolean;
  isActiveClass?: string;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    textButton,
    isActive,
    isActiveClass = "",
    onClick,
    ...props 
  }, ref) => {
    const classButton = cn(
      className,
      !isActive && isActiveClass
    )
    return (
        <button className={classButton} ref={ref} onClick={onClick} {...props}>{textButton}</button>
    );
  }
);

Button.displayName = "Button";