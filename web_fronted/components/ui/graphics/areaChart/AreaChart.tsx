"use client";

import { Area, AreaChart as RechartsAreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

interface AreaChartProps {
    data: any[];
    xKey: string;
    yKey: string;
    color?: string;
    height?: number | string;
    showGrid?: boolean;
    showXAxis?: boolean;
    showYAxis?: boolean;
    showTooltip?: boolean;
    className?: string;
    title?: string;
    tittleClassName?: string;
    subtitleClassName?: string;
    colorItemsX?: string;
    colorItemsY?: string;
    subtitle?: string;
}

export function AreaChart({
    data,
    xKey,
    yKey,
    color = "#6366f1",
    height = "100%",
    showGrid = true,
    showXAxis = true,
    showYAxis = true,
    showTooltip = true,
    className,
    title,
    tittleClassName,
    subtitle,
    subtitleClassName,
    colorItemsX,
    colorItemsY
}: AreaChartProps) {
    const gradientId = `color-${xKey}-${yKey}-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={cn("w-full h-full p-6 flex flex-col", className)}>
            {(title || subtitle) && (
                <div className="mb-8">
                    {title && <h2 className={cn("text-xl font-bold", tittleClassName)}>{title}</h2>}
                    {subtitle && <p className={cn("text-sm mt-1", subtitleClassName)}>{subtitle}</p>}
                </div>
            )}

            <div className="flex-1 w-full min-h-[300px]" style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        {showGrid && <CartesianGrid vertical={false} stroke="#e4e4e7" strokeOpacity={0.4} strokeDasharray="3 3" />}
                        {showXAxis && (
                            <XAxis
                                dataKey={xKey}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: colorItemsX, fontSize: 12 }}
                                dy={10}
                            />
                        )}
                        {showYAxis && (
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: colorItemsY, fontSize: 12 }}
                            />
                        )}
                        {showTooltip && (
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(228, 228, 231, 0.5)',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    padding: '12px'
                                }}
                                itemStyle={{ color: '#71717a', fontWeight: 600 }}
                                cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                        )}
                        <Area
                            type="monotone"
                            dataKey={yKey}
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#${gradientId})`}
                            activeDot={{ r: 6, strokeWidth: 0, fill: color }}
                        />
                    </RechartsAreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
