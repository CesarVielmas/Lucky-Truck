"use client";

import * as React from "react"
import {cva,VariantProps} from "class-variance-authority";
import { cn } from "@/lib/utils";

const tittlesVariants = cva(
  "text-white tracking-wide mt-8",
  {
    variants: {
      variant: {
        default: "text-lg",
        small : "text-xl",
        medium: "text-2xl",
        hight: "text-3xl",
        moreHight: "text-4xl"
      },
      weight:{
        default: "font-normal",
        light: "font-light",
        thin: "font-thin",
        medium : "font-medium",
        semibold: "font-semibold",
        bold: "font-bold"
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
);


export interface TittleProps extends React.HTMLAttributes<HTMLHeadingElement>,VariantProps<typeof tittlesVariants> {
    //props
}

export const Tittle = React.forwardRef<HTMLHeadingElement, TittleProps>(({ className, variant,weight, children, ...props }, ref) => {
    return (
        <h1 ref={ref} className={cn(tittlesVariants({variant,weight,className}))} {...props}>{children}</h1>
    );
  }
);

Tittle.displayName = "Tittle";