"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface InputTextProps 
  extends React.HTMLAttributes<HTMLDivElement> {
  icon?: "user" | "password" | "view_password" | "mail" | "search_gray";
  placeholder : string;
  bgColor: string;
  typeInput:string;
  containerClass?:string;
  imageClass?:string;
  value: string;
  onChangeFunction: (e : React.ChangeEvent) => void;
  children?: React.ReactNode;
}

export const InputText = React.forwardRef<HTMLDivElement, InputTextProps>(
  ({ 
    className, 
    bgColor = "white",
    placeholder = "",
    icon = "user",
    typeInput = "text",
    onChangeFunction,
    containerClass,
    imageClass,
    value = "",
    ...props 
  }, ref) => {
    const inputClass = cn(
        "flex items-center justify-center h-full w-full",
        className
    );
    const containerClassComplete = cn(
        "relative w-full h-full",
        containerClass
    );
    const imageClassComplete = cn(
      "absolute top-3/19 right-1 h-4/12 w-1/10 object-contain",
      imageClass
    )
    const srcImage =
      icon === "user"
        ? "/icons/user.png"
        : icon === "mail"
        ? "/icons/mail.svg"
        : icon === "password"
        ? "/icons/password.png"
        : icon === "search_gray"
        ? "/icons/search_innactive.png"
        : "/icons/view_password.svg";

    return (
     <div className={containerClassComplete}>
        <input className={inputClass} type={typeInput} placeholder={placeholder} onChange={(e)=>onChangeFunction(e)} value={value} {...props} />
        <Image className={imageClassComplete} src={srcImage} alt="{icon}" width={200} height={0}  />
     </div>
    );
  }
);

InputText.displayName = "InputText";