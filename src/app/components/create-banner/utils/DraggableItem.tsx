import { useRef } from 'react';

interface DraggableItemProps {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    children: React.ReactNode;
    isUnlocked?: boolean;
    onMove?: (key: string, x: number, y: number) => void;
    containerSize: { w: number, h: number };
    centered?: boolean; // When locked, center the element horizontally
    isSelected?: boolean;
    onClick?: (e: React.MouseEvent) => void;
}

export const DraggableItem = ({ 
    id, 
    x, 
    y, 
    width, 
    height, 
    children, 
    isUnlocked, 
    onMove, 
    containerSize,
    centered = false,
    isSelected = false,
    onClick
}: DraggableItemProps) => {
    const dragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });
    const elementRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isUnlocked || !onMove) return;
        e.stopPropagation(); // Prevent background drag
        e.preventDefault();
        
        dragging.current = true;
        offset.current = {
            x: e.clientX - x,
            y: e.clientY - y
        };
        
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current || !onMove) return;
        
        let newX = e.clientX - offset.current.x;
        let newY = e.clientY - offset.current.y;
        
        const safeArea = 24;
        
        // Use props if available, otherwise measure from DOM
        const currentWidth = width ?? elementRef.current?.offsetWidth ?? 0;
        const currentHeight = height ?? elementRef.current?.offsetHeight ?? 0;
        
        // For centered elements, adjust boundaries to account for translateX(-50%)
        if (centered) {
            // The element's visual left edge is at x - (width/2)
            // So minimum x should be safeArea + (width/2)
            const minX = safeArea + (currentWidth / 2);
            const maxX = containerSize.w - safeArea - (currentWidth / 2);
            
            if (newX < minX) newX = minX;
            if (newX > maxX) newX = maxX;
        } else {
            // Standard boundary checking
            if (newX < safeArea) newX = safeArea;
            
            const maxX = containerSize.w - currentWidth - safeArea;
            if (newX > maxX) newX = maxX;
        }
        
        // Y axis boundary (same for both centered and non-centered)
        if (newY < safeArea) newY = safeArea;
        const maxY = containerSize.h - currentHeight - safeArea;
        if (newY > maxY) newY = maxY;

        onMove(id, newX, newY);
    };

    const handleMouseUp = () => {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (!isUnlocked) return;
        e.stopPropagation();
        onClick?.(e);
    };

    return (
        <div 
            ref={elementRef}
            style={{ 
                left: x, 
                top: y, 
                position: 'absolute', 
                width: width, 
                height: height,
                cursor: isUnlocked ? 'grab' : 'default',
                outline: isSelected ? '2px dashed #007BFF' : (isUnlocked ? '1px dashed rgba(0,0,0,0.1)' : 'none'), // Subtle hint when unlocked, strong when selected
                zIndex: isSelected ? 40 : 30,
                transform: centered ? 'translateX(-50%)' : 'none' // Always apply if centered, regardless of lock state
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
        >
            {children}
        </div>
    );
};