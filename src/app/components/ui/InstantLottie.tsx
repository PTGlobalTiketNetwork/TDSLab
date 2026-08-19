import React from 'react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import { useAssetPreloader } from '../../../context/AssetPreloader';

interface InstantLottieProps {
    className?: string;
    style?: React.CSSProperties;
}

export const InstantLottie: React.FC<InstantLottieProps> = ({ className, style }) => {
    const { lottieData } = useAssetPreloader();

    if (!lottieData) {
        // Fallback / Loading State
        return (
            <div 
                className={`bg-gray-100/50 animate-pulse rounded-lg flex items-center justify-center ${className}`} 
                style={style}
            >
                <div className="w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className={className} style={style}>
             <DotLottiePlayer
                src={lottieData}
                loop
                autoplay
                style={{ width: '100%', height: '100%' }}
             />
        </div>
    );
};
