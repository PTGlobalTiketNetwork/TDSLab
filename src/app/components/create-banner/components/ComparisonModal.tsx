import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { BannerFixed } from '../BannerFixed';
import { BannerService } from '../../../../services/bannerService';
import { BannerFormData } from '../types';
import { compareMetadata, areVisualsIdentical, getChangesSummary } from '../../../../utils/metadataDiff';
import { MetadataComparisonBar, MetadataOnlyChangesBanner } from './MetadataComparisonBar';
import { calculateDiff, hasAnyDifferences, getChangedAreas } from '../../../../utils/diffUtils';
import type { DiffHighlights } from '../../../../utils/diffUtils';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFormData: BannerFormData;
  remoteBannerId: string;
  remoteUserName: string;
  onSync: (data: BannerFormData) => void;
  onOverwrite?: () => void; // New prop to allow user to proceed with their version
  requireAction?: boolean; // New prop to force user to take an action (no close button)
}

export function ComparisonModal({ 
  isOpen, 
  onClose, 
  currentFormData, 
  remoteBannerId,
  remoteUserName,
  onSync,
  onOverwrite,
  requireAction
}: ComparisonModalProps) {
  const [remoteData, setRemoteData] = useState<BannerFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightChanges, setHighlightChanges] = useState(false);

  useEffect(() => {
    if (isOpen && remoteBannerId) {
      loadRemoteBanner();
    }
  }, [isOpen, remoteBannerId]);

  // Handle Preview URL creation/revocation for current edit (same logic as LivePreview)
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (currentFormData.keyVisualFile instanceof Blob) {
        try {
            const url = URL.createObjectURL(currentFormData.keyVisualFile);
            setCurrentPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to create object URL for keyVisualFile", e);
            setCurrentPreviewUrl(null);
        }
    } else if (currentFormData.keyVisualUrl) {
        setCurrentPreviewUrl(currentFormData.keyVisualUrl);
    } else {
        setCurrentPreviewUrl(null);
    }
  }, [currentFormData.keyVisualFile, currentFormData.keyVisualUrl]);

  const loadRemoteBanner = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const banner = await BannerService.getBanner(remoteBannerId);
      
      // Robust check for form data
      const remoteFormData = banner?.form_data || (banner as any)?.formData;

      if (remoteFormData) {
        setRemoteData(remoteFormData);
      } else {
        console.error("Remote banner data missing form_data", banner);
        setError("Failed to load remote version or data is missing.");
      }
    } catch (err) {
      console.error("Failed to load remote banner for comparison", err);
      setError("Failed to load remote version.");
    } finally {
      setIsLoading(false);
    }
  };

  const metadataComparison = useMemo(() => {
    if (remoteData) {
      return compareMetadata(currentFormData, remoteData);
    }
    return null;
  }, [currentFormData, remoteData]);

  const changesSummary = useMemo(() => {
    if (metadataComparison) {
      return getChangesSummary(metadataComparison);
    }
    return null;
  }, [metadataComparison]);

  const areVisualsSame = useMemo(() => {
    if (remoteData) {
      return areVisualsIdentical(currentFormData, remoteData);
    }
    return false;
  }, [currentFormData, remoteData]);

  const diffHighlights: DiffHighlights = useMemo(() => {
    if (remoteData) {
      return calculateDiff(currentFormData, remoteData);
    }
    return {
      headlineDiff: false,
      nudgeDiff: false,
      backgroundDiff: false,
      logoDiff: false,
      layoutDiff: false,
    };
  }, [currentFormData, remoteData]);

  const hasDifferences = useMemo(() => {
    return hasAnyDifferences(diffHighlights);
  }, [diffHighlights]);

  const changedAreas = useMemo(() => {
    return getChangedAreas(diffHighlights);
  }, [diffHighlights]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[1300px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-[#e8eaee] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-[20px] font-bold text-[#303135]">
                Compare Versions
              </DialogTitle>
              <DialogDescription>
                {remoteUserName} has saved a new version. Compare your current edits with the latest saved version.
              </DialogDescription>
            </div>
            
            {/* Highlight Changes Toggle */}
            {hasDifferences && (
              <div className="flex items-center gap-3 bg-[#f8f9fd] px-4 py-2 rounded-lg border border-[#d8dce8]">
                <label htmlFor="highlight-toggle" className="text-sm font-medium text-[#303135] cursor-pointer select-none">
                  Highlight Changes
                </label>
                <button
                  id="highlight-toggle"
                  role="switch"
                  aria-checked={highlightChanges}
                  onClick={() => setHighlightChanges(!highlightChanges)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:ring-offset-2 ${
                    highlightChanges ? 'bg-[#007BFF]' : 'bg-[#d8dce8]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      highlightChanges ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
          
          {/* Changed Areas Summary */}
          {highlightChanges && hasDifferences && (
            <div className="mt-4 p-3 bg-[#fff5e6] border border-[#ffd699] rounded-lg">
              <p className="text-sm text-[#303135]">
                <span className="font-semibold">Changes detected in:</span> {changedAreas.join(', ')}
              </p>
            </div>
          )}
        </DialogHeader>

        {/* Metadata Only Changes Banner */}
        {changesSummary?.hasMetadataChanges && areVisualsSame && (
          <MetadataOnlyChangesBanner show={true} />
        )}

        <div className="flex-1 flex overflow-hidden bg-[#f8f9fd]">
          {/* Left Column: Local State */}
          <div className="flex-1 border-r border-[#d8dce8] flex flex-col overflow-y-auto">
             <div className="p-4 bg-white border-b border-[#e8eaee] sticky top-0 z-10">
                <h4 className="font-bold text-[#303135] text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Your Current Edit
                </h4>
                <p className="text-xs text-[#71747d] ml-4 mt-1">
                    Unsaved changes in your browser
                </p>
             </div>
             <div className="p-8 flex flex-col items-center gap-8 min-h-0">
                <div className="flex flex-col gap-4">
                    <h5 className="text-sm font-semibold text-[#71747d]">English Preview</h5>
                    <BannerFixed 
                        formData={currentFormData}
                        lang="en"
                        scale={currentFormData.keyVisualScale || 100}
                        position={currentFormData.keyVisualPosition || { x: 50, y: 50 }}
                        previewUrl={currentPreviewUrl}
                        hideHeader={false}
                        label="English"
                        highlights={highlightChanges ? diffHighlights : undefined}
                    />
                </div>
                <div className="flex flex-col gap-4">
                    <h5 className="text-sm font-semibold text-[#71747d]">Bahasa Indonesia Preview</h5>
                    <BannerFixed 
                        formData={currentFormData}
                        lang="id"
                        scale={currentFormData.keyVisualScale || 100}
                        position={currentFormData.keyVisualPosition || { x: 50, y: 50 }}
                        previewUrl={currentPreviewUrl}
                        hideHeader={false}
                        label="Indonesia"
                        highlights={highlightChanges ? diffHighlights : undefined}
                    />
                </div>
                {/* Metadata Comparison Bar */}
                {metadataComparison && changesSummary?.hasMetadataChanges && (
                  <div className="w-full max-w-[600px]">
                    <MetadataComparisonBar diffs={metadataComparison} side="current" />
                  </div>
                )}
             </div>
          </div>

          {/* Right Column: Remote State */}
          <div className="flex-1 flex flex-col overflow-y-auto">
             <div className="p-4 bg-white border-b border-[#e8eaee] sticky top-0 z-10">
                <h4 className="font-bold text-[#303135] text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Latest Saved Version
                </h4>
                <p className="text-xs text-[#71747d] ml-4 mt-1">
                    Saved by {remoteUserName}
                </p>
             </div>
             <div className="p-8 flex flex-col items-center gap-8 min-h-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-[200px]">
                        <div className="w-8 h-8 border-4 border-[#0064D2] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-sm p-4 bg-red-50 rounded">
                        {error}
                        <Button variant="outline" size="sm" onClick={loadRemoteBanner} className="ml-2">Retry</Button>
                    </div>
                ) : remoteData ? (
                    <>
                        <div className="flex flex-col gap-4">
                            <h5 className="text-sm font-semibold text-[#71747d]">English Preview</h5>
                            <BannerFixed 
                                formData={remoteData}
                                lang="en"
                                scale={remoteData.keyVisualScale || 100}
                                position={remoteData.keyVisualPosition || { x: 50, y: 50 }}
                                previewUrl={remoteData.keyVisualUrl || null}
                                hideHeader={false}
                                label="English"
                                highlights={highlightChanges ? diffHighlights : undefined}
                            />
                        </div>
                        <div className="flex flex-col gap-4">
                            <h5 className="text-sm font-semibold text-[#71747d]">Bahasa Indonesia Preview</h5>
                            <BannerFixed 
                                formData={remoteData}
                                lang="id"
                                scale={remoteData.keyVisualScale || 100}
                                position={remoteData.keyVisualPosition || { x: 50, y: 50 }}
                                previewUrl={remoteData.keyVisualUrl || null}
                                hideHeader={false}
                                label="Indonesia"
                                highlights={highlightChanges ? diffHighlights : undefined}
                            />
                        </div>
                        {/* Metadata Comparison Bar */}
                        {metadataComparison && changesSummary?.hasMetadataChanges && (
                          <div className="w-full max-w-[600px]">
                            <MetadataComparisonBar diffs={metadataComparison} side="remote" />
                          </div>
                        )}
                    </>
                ) : null}
             </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t border-[#e8eaee] shrink-0 bg-white flex justify-end gap-3">
          {!requireAction && <Button variant="outline" onClick={onClose}>
            Close
          </Button>}
          {onOverwrite && <Button 
            onClick={onOverwrite}
            className="bg-[#007BFF] hover:bg-[#0064D2] text-white"
          >
            Proceed with My Version
          </Button>}
          <Button 
            onClick={() => remoteData && onSync(remoteData)}
            disabled={!remoteData || isLoading}
            className="bg-[#007BFF] hover:bg-[#0064D2] text-white"
          >
            Sync to This Version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}