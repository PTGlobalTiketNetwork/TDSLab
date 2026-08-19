import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { projectId } from '../../utils/supabase/info';

const LOADING_LOTTIE_URL = `https://${projectId}.supabase.co/storage/v1/object/public/Lottie/tman_checkout.lottie`;

interface AssetPreloaderContextType {
    lottieData: any | null;
}

const AssetPreloaderContext = createContext<AssetPreloaderContextType>({ lottieData: null });

export const AssetPreloaderProvider = ({ children }: { children: ReactNode }) => {
    const [lottieData, setLottieData] = useState<any | null>(null);

    useEffect(() => {
        const fetchLottie = async () => {
            try {
                // Check if already loaded (unlikely on mount, but good practice)
                if (lottieData) return;

                const response = await fetch(LOADING_LOTTIE_URL);
                if (!response.ok) throw new Error('Failed to fetch Lottie');

                // Check for JSON vs Binary (.lottie)
                // The prompt requested await response.json(), so we try that for compatibility with JSON lotties.
                // However, .lottie files are zip files, so we fallback to blob URL for them.
                const contentType = response.headers.get('content-type');
                
                // Supabase might return application/octet-stream for .lottie
                if (contentType && (contentType.includes('application/json') || LOADING_LOTTIE_URL.endsWith('.json'))) {
                     const json = await response.json();
                     setLottieData(json);
                } else {
                     // Handle .lottie (zip) or other formats as Blob URL
                     const blob = await response.blob();
                     const objectUrl = URL.createObjectURL(blob);
                     setLottieData(objectUrl);
                }
            } catch (error) {
                console.error('Lottie preload failed:', error);
            }
        };

        fetchLottie();
    }, []);

    return (
        <AssetPreloaderContext.Provider value={{ lottieData }}>
            {children}
        </AssetPreloaderContext.Provider>
    );
};

export const useAssetPreloader = () => useContext(AssetPreloaderContext);
