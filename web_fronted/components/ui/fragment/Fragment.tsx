"use client";

import * as React from "react"
import {cva,VariantProps} from "class-variance-authority";
import { cn } from "@/lib/utils";

const fragmentVariants = cva(
  "relative z-2",
  {
    variants: {
      variant: {
        default: "bg-white text-black",
        invisibly : "bg-transparent",
        cristal: "bg-white/20 backdrop-blur-sm border-white border-2"
      },
      bordered:{
        default: "rounded-none",
        small: "rounded-sm",
        medium: "rounded-md",
        hight : "rounded-xl"
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
);


export interface FragmentProps extends React.HTMLAttributes<HTMLDivElement>,VariantProps<typeof fragmentVariants> {
    //props
}

export const Fragment = React.forwardRef<HTMLDivElement, FragmentProps>(({ className, variant,bordered, children, ...props }, ref) => {
    return (
        <div ref={ref} className={cn(fragmentVariants({className,variant,bordered}))} {...props}>
            {children}
        </div>
    );
  }
);

Fragment.displayName = "Fragment";