import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, RefreshCw, History, Users } from 'lucide-react';
import { projectId, publicAnonKey } from '../../../../../utils/supabase/info';
import { supabase } from '../../../../utils/supabase/client';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-67753e13`;

interface HistoryItem {
  id: string;
  image_url: string;
  prompt: string;
  ratio: string;
  resolution: string;
  created_at: string;
  created_by: string;
  task_type?: string;
}

interface HistorySelectorProps {
  onSelect: (imageUrl: string) => void;
}

export function HistorySelector({ onSelect }: HistorySelectorProps) {
  const [activeTab, setActiveTab] = useState<'my_history' | 'team_history'>('my_history');
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
        setUser(data.user);
    });
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
        const queryParams = new URLSearchParams({
            limit: '100', // Fetch recent 100 items
            taskType: 'all', // Include all history types (generation, resize, etc.)
        });

        if (activeTab === 'my_history' && user) {
            queryParams.append('userId', user.id);
        }

        const res = await fetch(`${SERVER_URL}/generative-resize/history?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });

        if (!res.ok) throw new Error("Failed to fetch history");

        const result = await res.json();
        
        let rawItems: HistoryItem[] = [];
        if (Array.isArray(result)) {
             rawItems = result;
        } else {
             rawItems = result.data || [];
        }

        const validItems = rawItems.filter((item: any) => {
            // Include: generation, expand, remove_background, image_generation
            // Exclude: resize, translate
            const type = item.task_type || '';
            const isExcluded = type === 'resize' || type === 'translate';
            
            return item.image_url && 
                   !isExcluded &&
                   (!item.status || item.status === 'succeeded' || item.status === 'completed');
        });
        
        // Sort by newest
        validItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setItems(validItems);
    } catch (error) {
        console.error("Failed to fetch history", error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my_history' && !user) return;
    fetchHistory();
  }, [activeTab, user]);

  return (
    <div className="flex flex-col gap-4 w-full h-[400px]">
        <div className="flex items-center justify-between">
            <div className="flex bg-[#f8f9fd] p-1 rounded-lg border border-[#eff1f6]">
                <button
                    type="button"
                    onClick={() => setActiveTab('my_history')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                        activeTab === 'my_history' 
                        ? 'bg-white text-[#007BFF] shadow-sm' 
                        : 'text-[#71747d] hover:text-[#303135]'
                    }`}
                >
                    <History className="w-3.5 h-3.5" />
                    My Gallery
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('team_history')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                        activeTab === 'team_history' 
                        ? 'bg-white text-[#007BFF] shadow-sm' 
                        : 'text-[#71747d] hover:text-[#303135]'
                    }`}
                >
                    <Users className="w-3.5 h-3.5" />
                    Team Gallery
                </button>
            </div>
            
            <Button
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={fetchHistory}
                disabled={isLoading}
                className="h-8 w-8 p-0"
            >
                <RefreshCw className={`w-4 h-4 text-[#71747d] ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
        </div>

        <div className="flex-1 bg-[#F8F9FD] rounded-lg border border-[#d8dce8] p-4 overflow-y-auto">
            {isLoading && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-[#71747d] gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#007BFF]" />
                    <span className="text-xs">Loading history...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-[#71747d]">
                    <History className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm font-medium">No history found</span>
                    <span className="text-xs opacity-70">Generated images will appear here</span>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelect(item.image_url)}
                            className="group relative aspect-square rounded-lg overflow-hidden border border-[#d8dce8] bg-white hover:border-[#007BFF] hover:ring-2 hover:ring-[#007BFF] hover:ring-offset-1 transition-all focus:outline-none"
                        >
                            <img 
                                src={item.image_url} 
                                alt={item.prompt || 'Generated Image'} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}