"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Image, { StaticImageData } from "next/image";
import OptionIcon from "@/public/icons/option_innactive.png";
export interface CardToolProps 
  extends React.HTMLAttributes<HTMLDivElement> {
  toolImage : StaticImageData; 
  tittleTool : string;
  shortDescription ?: string;
  classOptionImage ?: string;
  classToolImage?: string;
  classTittle?: string;
  classDescription?:string;
  listOptions?: Record<string, () => void>;
  classListOptions?:string;
  classOptions?:string;
  children?: React.ReactNode;
}

export const CardTool = React.forwardRef<HTMLDivElement, CardToolProps>(
  ({ 
    className, 
    toolImage,
    tittleTool,
    shortDescription = "Haga click para guardar o tomar una factura",
    classOptionImage,
    classDescription,
    classToolImage,
    classTittle,
    listOptions = {},
    classListOptions,
    classOptions,
    children,
    ...props 
  }, ref) => {
    const [options,setOptions] = React.useState(false);
    
    const toggleOptions = (e: React.MouseEvent) => {
      e.stopPropagation(); 
      setOptions((prev) => !prev);
    };

    const containerClass = cn(
        "relative flex flex-col w-3/12 h-5/11 rounded-lg transition-all duration-400 ease-in-out shadow-[0px_3px_30px_rgba(200,204,210,0.5)] hover:shadow-[0px_3px_30px_rgba(200,204,210,1)] hover:cursor-pointer",
        className
    )
    const imageToolClass = cn(
        "w-3/10 h-6/10 object-fill",
        classToolImage
    )
    const imageOptionClass = cn(
        "w-1/10 object-fill transition-all duration-400 ease-in-out mr-2 hover:w-2/15",
        classOptionImage
    )
    const tittleClass = cn(
        "text-3xl font-sans mb-3 text-gray-500 font-bold",
        classTittle
    )
    const descriptionClass = cn(
        "text-md font-sans text-gray-400 font-light text-center",
        classDescription
    )
    const listOptionsClass = cn(
        "absolute z-2 top-15 -right-18 z-50 flex flex-col bg-white  border border-gray-200 rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.15)]",
        classListOptions
    )
    const optionsClass = cn(
        "px-4 py-2 text-sm font-sans font-light transition-all duration-400 ease-in-out rounded-lg text-gray-500 hover:bg-gray-300 hover:text-white hover:cursor-pointer text-left",
        classOptions
    )
    return (
        <div className={containerClass} {...props}>
            <div className="flex flex-1 w-full h-full justify-end items-center">
                {listOptions && Object.keys(listOptions).length > 0 && (
                    <>
                        <Image
                        className={imageOptionClass}
                        src={OptionIcon}
                        alt="logo-option"
                        onClick={toggleOptions}
                        />
                        {options && (
                        <div className={listOptionsClass} onClick={(e) => e.stopPropagation()}>
                            {Object.entries(listOptions).map(([label, action]) => (
                            <button
                                key={label}
                                className={optionsClass}
                                onClick={() => {
                                setOptions(false);
                                action();
                                }}
                            >
                                {label}
                            </button>
                            ))}
                        </div>
                        )}
                    </>
                )}
            </div>
            <div className="flex flex-col flex-4">
                <div className="flex flex-2 flex-col w-full h-full overflow-hidden justify-center items-center">
                    <h2 className={tittleClass}>{tittleTool}</h2>
                    <Image className={imageToolClass} src={toolImage} alt="logo-tool"  />
                </div>
                <div className="flex flex-1 pl-6 pr-6 justify-center items-center">
                    <p className={descriptionClass}>{shortDescription}</p>
                </div>
            </div>
        </div> 
    );
  }
);

CardTool.displayName = "CardTool";