"use client";
import { useState } from 'react';
import { AreaChart } from "@/components/ui/graphics/areaChart";

const data = [
    { name: "Ene", value: 2400 },
    { name: "Feb", value: 1398 },
    { name: "Mar", value: 9800 },
    { name: "Abr", value: 3908 },
    { name: "May", value: 4800 },
    { name: "Jun", value: 3800 },
    { name: "Jul", value: 4300 },
];

export default function HistoryGraphics() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showCustomChart, setShowCustomChart] = useState(false);

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(e.target.value);
        if (e.target.value && endDate) {
            setShowCustomChart(true);
        } else {
            setShowCustomChart(false);
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(e.target.value);
        if (startDate && e.target.value) {
            setShowCustomChart(true);
        } else {
            setShowCustomChart(false);
        }
    };

    const clearDates = () => {
        setStartDate('');
        setEndDate('');
        setShowCustomChart(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="flex flex-col h-full w-full overflow-y-auto p-4 gap-4">
            <div className="flex flex-col w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl shadow-lg p-4">
                <div className="flex flex-col items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-800 mb-2">
                        Seleccionar Rango de Fechas
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-100">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-600">
                            Elija un rango para ver las facturas específicas
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 mb-4">
                    <div className="flex flex-1 flex-row items-center gap-4 w-full">
                        <div className="flex flex-10 flex-col w-full">
                            <label className="text-sm font-medium text-slate-700 mb-2 text-center">
                                Fecha de Inicio
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={handleStartDateChange}
                                    className="w-full px-4 py-2 rounded-lg border-2 border-blue-200 bg-white text-slate-800 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                                />
                                {startDate && (
                                    <button
                                        onClick={() => setStartDate('')}
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors duration-200"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 items-center justify-center text-slate-400">
                            <svg className="w-5 h-5 mt-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>

                        <div className="flex flex-10 flex-col w-full md:w-1/3">
                            <label className="text-sm font-medium text-slate-700 mb-2 text-center ">
                                Fecha de Fin
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={handleEndDateChange}
                                    min={startDate}
                                    className="w-full px-3 py-2 rounded-lg border-2 border-blue-200 bg-white text-slate-800 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                                />
                                {endDate && (
                                    <button
                                        onClick={() => setEndDate('')}
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors duration-200"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        {(startDate || endDate) && (
                            <button
                                onClick={clearDates}
                                className="flex-1 md:flex-none px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 font-medium transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Limpiar</span>
                            </button>
                        )}
                        <button
                            onClick={() => setShowCustomChart(false)}
                            className="flex-1 md:flex-none px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-medium transition-all duration-200"
                        >
                            Ver Todos
                        </button>
                    </div>
                </div>

                {(startDate && endDate) && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600 bg-white/50 rounded-lg py-2 px-4">
                        <span className="font-medium">Rango seleccionado:</span>
                        <span className="text-blue-600 font-semibold">
                            {formatDate(startDate)} - {formatDate(endDate)}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col gap-4">
                {showCustomChart && startDate && endDate ? (
                    <AreaChart
                        data={data}
                        xKey="name"
                        yKey="value"
                        showGrid={true}
                        showXAxis={true}
                        showYAxis={true}
                        showTooltip={true}
                        colorItemsX="#8b5cf6"
                        colorItemsY="#8b5cf6"
                        title={`Facturas Emitidas En Rango`}
                        subtitle={`Facturas emitidas en el rango de fechas ${formatDate(startDate)} - ${formatDate(endDate)}`}
                        color="#8b5cf6"
                        className="w-full h-full rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl bg-gradient-to-br from-white to-purple-50/50 border border-purple-100/50"
                        tittleClassName="text-slate-800 text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-center text-transparent"
                        subtitleClassName="text-slate-500 text-sm font-medium text-center"
                    />
                ) : (
                    <div className="flex flex-col gap-4 h-full">
                        <AreaChart
                            data={data}
                            xKey="name"
                            yKey="value"
                            showGrid={true}
                            showXAxis={true}
                            showYAxis={true}
                            showTooltip={true}
                            colorItemsX="#4b89cfff"
                            colorItemsY="#4b89cfff"
                            title="Facturas De Hoy"
                            subtitle="Facturas emitidas en el dia actual"
                            color="#1e6bc2ff"
                            className="w-full h-1/3 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl bg-gradient-to-br from-white to-blue-50/50 border border-blue-100/50"
                            tittleClassName="text-slate-800 text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
                            subtitleClassName="text-slate-500 text-sm font-medium"
                        />
                        <AreaChart
                            data={data}
                            xKey="name"
                            yKey="value"
                            showGrid={true}
                            showXAxis={true}
                            showYAxis={true}
                            showTooltip={true}
                            colorItemsX="#178633ff"
                            colorItemsY="#178633ff"
                            title="Facturas De Esta Semana"
                            subtitle="Facturas emitidas en la semana actual"
                            color="#1ec247ff"
                            className="w-full h-1/3 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl bg-gradient-to-br from-white to-emerald-50/50 border border-emerald-100/50"
                            tittleClassName="text-slate-800 text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"
                            subtitleClassName="text-slate-500 text-sm font-medium"
                        />
                        <AreaChart
                            data={data}
                            xKey="name"
                            yKey="value"
                            showGrid={true}
                            showXAxis={true}
                            showYAxis={true}
                            showTooltip={true}
                            colorItemsX="#1e9187ff"
                            colorItemsY="#1e9187ff"
                            title="Facturas De Este Mes"
                            subtitle="Facturas emitidas en el mes actual"
                            color="#1ec2b4ff"
                            className="w-full h-1/3 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl bg-gradient-to-br from-white to-teal-50/50 border border-teal-100/50"
                            tittleClassName="text-slate-800 text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent"
                            subtitleClassName="text-slate-500 text-sm font-medium"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}