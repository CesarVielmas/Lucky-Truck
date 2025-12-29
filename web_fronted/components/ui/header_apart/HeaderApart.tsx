"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Image, { StaticImageData } from "next/image";

export interface HeaderApartProps 
  extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  bgColorInnactive?: string;
  bgColorActive?:string;
  isActive:boolean;
  logoImageInnactive:StaticImageData;
  logoImageActive:StaticImageData;
  fontColorInnactive:string;
  fontColorActive?:string;
  fontText:string;
  imageClass?:string;
  fontClass?:string;
  onClickApart?: ()=> void;
  children?: React.ReactNode;
}

export const HeaderApart = React.forwardRef<HTMLDivElement, HeaderApartProps>(
  ({ 
    className, 
    orientation = "horizontal",
    bgColorInnactive = "bg-transparent",
    bgColorActive = "bg-gray-700",
    isActive = false,
    logoImageInnactive,
    logoImageActive,
    fontColorInnactive,
    fontColorActive,
    fontText,
    imageClass,
    fontClass,
    onClickApart,
    children,
    ...props 
  }, ref) => {
    const containerClass = cn(
        "flex flex-row w-full gap-x-1 h-5/10 p-3 overflow-hidden justify-center items-center rounded-sm transition-all duration-500 hover:shadow-md/40 hover:shadow-gray-500 hover:cursor-pointer",
        isActive ? bgColorActive : bgColorInnactive,
        className
    );
    const imageClassComplete = cn(
        "w-6/11 object-fill",
        imageClass
    )
    const fontClassComplete = cn(
        "flex-2 font-sans text-gray-500 text-start font-semibold text-lg",
        isActive ? fontColorActive : fontColorInnactive,
        fontClass
    )
    return (
        <div ref={ref} className={containerClass} onClick={onClickApart} {...props}>
                <div className="flex flex-1 h-full w-full justify-center items-center">
                    <Image className={imageClassComplete} src={isActive ? logoImageActive : logoImageInnactive} alt="logout" />
                </div>
                <p className={fontClassComplete}>{fontText}</p>
        </div> 
    );
  }
);

HeaderApart.displayName = "HeaderApart";