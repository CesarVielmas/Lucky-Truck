"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CardHistoryProps extends React.HTMLAttributes<HTMLDivElement> {
    time: string;
    imageUrl: string;
    description: string;
    date: string;
    onEdit?: () => void;
    onDelete?: () => void;
}

export const CardHistory = React.forwardRef<HTMLDivElement, CardHistoryProps>(
    ({
        className,
        time,
        imageUrl,
        description,
        date,
        onEdit,
        onDelete,
        ...props
    }, ref) => {
        const [isMenuOpen, setIsMenuOpen] = useState(false);
        const [imageError, setImageError] = useState(false);
        const menuRef = useRef<HTMLDivElement>(null);

        // Close menu when clicking outside or pressing Escape
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                    setIsMenuOpen(false);
                }
            };

            const handleEscape = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    setIsMenuOpen(false);
                }
            };

            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEscape);

            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
                document.removeEventListener("keydown", handleEscape);
            };
        }, []);

        const handleImageError = () => {
            setImageError(true);
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 w-full max-w-md group",
                    className
                )}
                {...props}
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Image with fallback */}
                    <div className="relative h-12 w-12 flex-shrink-0">
                        {!imageError ? (
                            <img
                                src={imageUrl}
                                alt={`Imagen de ${description}`}
                                className="rounded-full object-cover border border-gray-100"
                                onError={handleImageError}
                                sizes="48px"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-400">
                                    {description.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description & Date/Time */}
                    <div className="flex flex-col flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {description}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span className="font-medium">{date}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0"></span>
                            <span className="flex-shrink-0">{time}</span>
                        </div>
                    </div>
                </div>

                {/* Action Menu */}
                <div className="relative flex-shrink-0" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={cn(
                            "p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200",
                            isMenuOpen && "bg-gray-50 text-gray-600"
                        )}
                        aria-label="Abrir menú de opciones"
                        aria-expanded={isMenuOpen}
                        aria-haspopup="true"
                    >
                        <MoreVertical size={20} />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div
                            className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 origin-top-right"
                            role="menu"
                            aria-orientation="vertical"
                        >
                            <div className="py-1">
                                <button
                                    onClick={() => {
                                        onEdit?.();
                                        setIsMenuOpen(false);
                                    }}
                                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors gap-2 focus:outline-none focus:bg-gray-50"
                                    role="menuitem"
                                >
                                    <Edit size={16} />
                                    <span>Editar</span>
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete?.();
                                        setIsMenuOpen(false);
                                    }}
                                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors gap-2 focus:outline-none focus:bg-red-50"
                                    role="menuitem"
                                >
                                    <Trash2 size={16} />
                                    <span>Eliminar</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
);

CardHistory.displayName = "CardHistory";