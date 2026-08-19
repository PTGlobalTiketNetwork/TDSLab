import React, { useRef, useEffect, useState } from 'react';

interface GradientSliderProps {
    stops: { id: string; color: string; position: number; opacity?: number }[];
    onChange: (newStops: { id: string; color: string; position: number; opacity?: number }[]) => void;
    onSelectStop: (id: string) => void;
    selectedStopId: string | null;
    gradientType: 'linear' | 'radial';
    angle: number;
}

export function GradientSlider({ stops, onChange, onSelectStop, selectedStopId, gradientType, angle }: GradientSliderProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    // Sort stops for the gradient preview logic only (to render correctly), 
    // but we pass back the original array order usually or just sorted array?
    // Usually sorted by position is best for linear gradients.
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);

    const getGradientString = () => {
        const stopString = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
        return `linear-gradient(90deg, ${stopString})`;
    };

    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDraggingId(id);
        onSelectStop(id);
    };

    useEffect(() => {
        if (draggingId) {
            const handleMouseMove = (e: MouseEvent) => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                let newPos = (offsetX / rect.width) * 100;
                newPos = Math.max(0, Math.min(100, newPos));
                
                // Update the specific stop
                const newStops = stops.map(s => s.id === draggingId ? { ...s, position: Math.round(newPos) } : s);
                onChange(newStops);
            };

            const handleMouseUp = () => {
                setDraggingId(null);
            };

            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [draggingId, stops, onChange]);

    return (
        <div className="flex flex-col gap-2 select-none">
             <div 
                ref={containerRef}
                className="h-[32px] w-full rounded-[4px] relative cursor-pointer border border-[#d8dce8] shadow-sm"
                style={{
                    background: getGradientString(),
                    backgroundImage: `
                        ${getGradientString()},
                        linear-gradient(45deg, #ccc 25%, transparent 25%), 
                        linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #ccc 75%), 
                        linear-gradient(-45deg, transparent 75%, #ccc 75%)
                    `,
                    backgroundSize: '100% 100%, 8px 8px, 8px 8px, 8px 8px, 8px 8px',
                    backgroundPosition: '0 0, 0 0, 0 4px, 4px -4px, -4px 0px' 
                }}
                onClick={(e) => {
                    // Optional: Click empty area to add stop?
                }}
             >
                 {stops.map(stop => (
                     <div
                        key={stop.id}
                        onMouseDown={(e) => handleMouseDown(e, stop.id)}
                        onClick={(e) => { e.stopPropagation(); onSelectStop(stop.id); }}
                        style={{ left: `${stop.position}%` }}
                        className={`absolute top-0 bottom-0 w-[12px] -ml-[6px] cursor-ew-resize z-10 group`}
                     >
                         {/* Handle Visual */}
                         <div className={`
                             w-[12px] h-full bg-white border-2 shadow-sm rounded-[2px]
                             ${selectedStopId === stop.id ? 'border-[#007BFF] z-20' : 'border-gray-400 group-hover:border-gray-600'}
                         `} />
                         
                         {/* Color Indicator inside handle */}
                         <div 
                            className="absolute top-[4px] bottom-[4px] left-[4px] right-[4px] rounded-[1px]" 
                            style={{ backgroundColor: stop.color }}
                         />

                         {/* Tooltip on Hover/Drag */}
                         {(selectedStopId === stop.id || draggingId === stop.id) && (
                             <div className="absolute -top-[30px] left-1/2 -translate-x-1/2 bg-[#303135] text-white text-[10px] px-2 py-1 rounded-[4px] whitespace-nowrap">
                                 {Math.round(stop.position)}%
                             </div>
                         )}
                     </div>
                 ))}
             </div>
        </div>
    );
}
