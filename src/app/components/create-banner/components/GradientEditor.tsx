import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight, RotateCw, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ColorPicker } from '../ColorPicker';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';

interface GradientStop {
  id: string;
  color: string;
  position: number;
  opacity?: number;
}

interface GradientEditorProps {
  stops: GradientStop[];
  onChange: (stops: GradientStop[]) => void;
  type: 'linear' | 'radial';
  onTypeChange: (type: 'linear' | 'radial') => void;
  angle: number;
  onAngleChange: (angle: number) => void;
}

export function GradientEditor({ 
  stops, 
  onChange, 
  type, 
  onTypeChange, 
  angle, 
  onAngleChange 
}: GradientEditorProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sort stops by position for rendering (but keep original order for logic if needed? usually sorted is best)
  // We'll keep them sorted in parent or here? Let's sort here for display but update parent.
  // Actually, standard is to sort by position.
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);

  const getGradientString = () => {
    const stopsStr = sortedStops.map(s => {
        // Handle opacity if we want to show it in preview. Hex colors usually imply opacity if alpha channel used.
        // If opacity is separate, we might need to convert hex to rgba. 
        // For now, let's assume color is the main driver and opacity is just a value user sets that *should* affect color.
        // But ColorPicker usually handles hex. Let's strictly use the color string.
        return `${s.color} ${s.position}%`;
    }).join(', ');

    return `linear-gradient(90deg, ${stopsStr})`;
  };

  const handleBarMouseDown = (e: React.MouseEvent) => {
    if (e.target !== barRef.current) return;
    // Add new stop
    const rect = barRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    
    // Find two nearest stops to interpolate color? Or just default white?
    // Let's default to white or last color.
    const newStop: GradientStop = {
        id: Math.random().toString(36).substr(2, 9),
        color: '#FFFFFF',
        position: percent,
        opacity: 100
    };
    
    onChange([...stops, newStop].sort((a, b) => a.position - b.position));
    setActiveStopId(newStop.id);
  };

  const handleStopMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveStopId(id);
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !activeStopId || !barRef.current) return;
        
        const rect = barRef.current.getBoundingClientRect();
        let percent = ((e.clientX - rect.left) / rect.width) * 100;
        percent = Math.max(0, Math.min(100, Math.round(percent)));
        
        const newStops = stops.map(s => s.id === activeStopId ? { ...s, position: percent } : s);
        onChange(newStops.sort((a, b) => a.position - b.position));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, activeStopId, stops, onChange]);

  const handleRotate = () => {
    onAngleChange((angle + 45) % 360);
  };

  const handleFlip = () => {
    // Reverse positions: 100 - position
    const newStops = stops.map(s => ({
        ...s,
        position: 100 - s.position
    }));
    onChange(newStops.sort((a, b) => a.position - b.position));
  };

  const updateStop = (id: string, updates: Partial<GradientStop>) => {
    const newStops = stops.map(s => s.id === id ? { ...s, ...updates } : s);
    onChange(newStops.sort((a, b) => a.position - b.position));
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) return;
    onChange(stops.filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col gap-4 w-full">
        {/* Top Controls */}
        <div className="flex items-center justify-between gap-4">
            <Select value={type} onValueChange={(val: 'linear' | 'radial') => onTypeChange(val)}>
                <SelectTrigger className="w-[140px] h-[36px] bg-white border-[#d8dce8]">
                    <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="radial">Radial</SelectItem>
                </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-[36px] w-[36px] border-[#d8dce8]"
                    onClick={handleFlip}
                    title="Flip Gradient"
                >
                    <ArrowLeftRight className="w-4 h-4 text-[#71747d]" />
                </Button>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-[36px] w-[36px] border-[#d8dce8]"
                    onClick={handleRotate}
                    title="Rotate 45°"
                >
                    <RotateCw className="w-4 h-4 text-[#71747d]" />
                </Button>
            </div>
        </div>

        {/* Gradient Bar */}
        <div className="w-full pt-6 pb-2 px-2"> {/* Padding for handles */}
            <div 
                ref={barRef}
                className="relative h-[24px] w-full rounded-md border border-[#d8dce8] shadow-sm cursor-crosshair"
                style={{ background: getGradientString() }}
                onMouseDown={handleBarMouseDown}
            >
                {sortedStops.map((stop) => (
                    <div
                        key={stop.id}
                        className={`absolute top-0 bottom-0 w-0 flex flex-col items-center justify-center group z-10`}
                        style={{ left: `${stop.position}%` }}
                        onMouseDown={(e) => handleStopMouseDown(e, stop.id)}
                    >
                        {/* Handle Top */}
                        <div 
                            className={`absolute -top-[10px] w-[14px] h-[14px] border-2 bg-white transform -translate-y-1/2 rotate-45 cursor-grab active:cursor-grabbing shadow-sm transition-transform hover:scale-125 ${
                                activeStopId === stop.id ? 'border-[#007BFF] z-20 scale-125' : 'border-[#71747d]'
                            }`} 
                            style={{ backgroundColor: stop.color }}
                        />
                        {/* Guide Line (Optional) */}
                        {/* <div className="h-full w-[1px] bg-white/50 backdrop-invert" /> */}
                    </div>
                ))}
            </div>
        </div>

        {/* Stops List */}
        <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#303135]">Stops</span>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-[#007BFF] hover:text-[#0064D2] p-0 hover:bg-transparent"
                    onClick={() => {
                        const newStop = {
                            id: Math.random().toString(36).substr(2, 9),
                            color: '#FFFFFF',
                            position: 50,
                            opacity: 100
                        };
                        onChange([...stops, newStop].sort((a, b) => a.position - b.position));
                    }}
                >
                    <Plus className="w-4 h-4 mr-1" />
                </Button>
            </div>

            <div className="flex flex-col gap-2">
                {sortedStops.map((stop) => (
                    <div 
                        key={stop.id} 
                        className={`grid grid-cols-[60px_1fr_auto] gap-3 items-center p-2 rounded-lg border transition-colors ${
                            activeStopId === stop.id ? 'bg-[#F0F7FF] border-[#007BFF]' : 'bg-[#F8F9FD] border-[#d8dce8]'
                        }`}
                        onClick={() => setActiveStopId(stop.id)}
                    >
                        {/* Position Input */}
                        <div className="relative">
                            <input 
                                type="number" 
                                className="w-full bg-transparent text-sm font-medium text-[#303135] focus:outline-none text-right pr-4"
                                value={stop.position}
                                onChange={(e) => updateStop(stop.id, { position: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                            />
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-[#71747d] pointer-events-none">%</span>
                        </div>

                        {/* Color Picker & Hex */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <ColorPicker 
                                value={stop.color} 
                                onChange={(c) => updateStop(stop.id, { color: c })} 
                            />
                            <input 
                                type="text" 
                                className="w-full min-w-0 bg-transparent text-xs font-mono text-[#71747d] uppercase focus:outline-none"
                                value={stop.color}
                                onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                            />
                        </div>

                        {/* Delete */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                removeStop(stop.id);
                            }}
                            disabled={stops.length <= 2}
                            className={`p-1 rounded-md transition-colors ${
                                stops.length <= 2 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-white'
                            }`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
