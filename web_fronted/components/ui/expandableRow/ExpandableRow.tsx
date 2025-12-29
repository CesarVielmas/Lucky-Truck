"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Image, { StaticImageData } from "next/image";
import { Separation } from "../separation";

export interface ExpandableRowProps
    extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: "left" | "right";
    tittleContentHidden?: string;
    tittleContentVisible?: string;
    stylesContainer1?: string;
    stylesContainer2?: string;
    iconActiveDesplegable: StaticImageData;
    iconHoverDesplegable: StaticImageData;
    iconInnactiveDesplegable: StaticImageData;
    childrenPart1?: React.ReactNode;
    childrenPart2?: React.ReactNode;
}

export const ExpandableRow = React.forwardRef<HTMLDivElement, ExpandableRowProps>(
    ({
        className,
        orientation = "left",
        tittleContentHidden,
        tittleContentVisible,
        stylesContainer1,
        stylesContainer2,
        iconActiveDesplegable,
        iconHoverDesplegable,
        iconInnactiveDesplegable,
        childrenPart1,
        childrenPart2,
        ...props
    }, ref) => {
        const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
        const [isHovered, setIsHovered] = React.useState<boolean>(false);

        const containerClass1 = cn(
            "w-full h-full transition-all duration-500 ease-out gap-x-1",
            isExpanded ? "flex-3" : "flex-12",
            stylesContainer1
        );
        const containerClass2 = cn(
            "relative flex-1 w-full h-full rounded-md overflow-hidden transition-all duration-500 ease-out shadow-lg shadow-gray-300 gap-x-5",
            stylesContainer2
        );
        const containerButtonExpandableClass = cn(
            "flex absolute justify-center items-center rounded-sm h-1/19 w-4/10 transition-all duration-500 ease-out top-1/2 hover:cursor-pointer",
            isExpanded ? "bg-blue-500 w-2/16" : "bg-white shadow-sm shadow-gray-400 hover:bg-blue-500",
            orientation === "left" && !isExpanded ? "left-1/3" : orientation === "right" && !isExpanded ? "right-1/3" : "",
            orientation === "left" && isExpanded ? "left-3" : orientation === "right" && isExpanded ? "right-3" : ""
        );
        const buttonExpandableClass = cn(
            "h-8/10 w-8/10 object-contain"
        );
        const tittleContentClass = cn(
            "flex-1 text-center font-semibold text-gray-500 transition-all duration-500 ease-out pt-5",
            isExpanded ? "text-2xl" : "text-lg"
        );
        return (
            <div className="flex flex-row w-full h-full gap-x-5 p-2">
                <div className={orientation === "left" ? containerClass1 : containerClass2}>
                    {orientation === "right" && (
                        <div className={containerButtonExpandableClass} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                            <Image
                                src={isExpanded ? iconActiveDesplegable : isHovered ? iconHoverDesplegable : iconInnactiveDesplegable}
                                alt="Icon"
                                className={buttonExpandableClass}
                                onClick={() => setIsExpanded(!isExpanded)} />

                        </div>
                    )}
                    <div className="flex flex-col w-full h-full justify-center items-center">
                        {orientation === "right" && (
                            <>
                                <h1 className={tittleContentClass}>{!isExpanded ? tittleContentHidden : tittleContentVisible}</h1>
                                {isExpanded && (
                                    <div className="flex-1 flex justify-center items-center w-9/10 h-full">
                                        <Separation orientation="horizontal" lineSize="sm" borderOption="sm" circleSize="sm" bgColor="bg-gray-300" />
                                    </div>
                                )}
                            </>
                        )}
                        <div className="flex-17 flex justify-center items-center w-full h-full">
                            {orientation === "left" ? childrenPart1 : (isExpanded ? childrenPart2 : null)}
                        </div>
                    </div>
                </div>
                <div className={orientation === "left" ? containerClass2 : containerClass1}>
                    {orientation === "left" && (
                        <div className={containerButtonExpandableClass} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                            <Image
                                src={isExpanded ? iconActiveDesplegable : isHovered ? iconHoverDesplegable : iconInnactiveDesplegable}
                                alt="Icon"
                                className={buttonExpandableClass}
                                onClick={() => setIsExpanded(!isExpanded)} />

                        </div>
                    )}
                    <div className="flex flex-col w-full h-full justify-center items-center">
                        {orientation === "left" && (
                            <>
                                <h1 className={tittleContentClass}>{!isExpanded ? tittleContentHidden : tittleContentVisible}</h1>
                                {isExpanded && (
                                    <div className="flex-1 flex justify-center items-center w-9/10 h-full">
                                        <Separation orientation="horizontal" lineSize="sm" borderOption="sm" circleSize="sm" bgColor="bg-gray-300" />
                                    </div>
                                )}
                            </>
                        )}
                        <div className="flex-17 flex justify-center items-center w-full h-full overflow-hidden">
                            {orientation === "left" ? (isExpanded ? childrenPart2 : null) : childrenPart1}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

ExpandableRow.displayName = "ExpandableRow";