import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { TiketButton } from './ui/tiket-ui';
import { AlertTriangle, Save, Trash2, Edit3 } from 'lucide-react';

interface NavigationBlockerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onContinueEditing: () => void;
  onSaveAsDraft: () => void;
  isSaving?: boolean;
}

export function NavigationBlockerDialog({
  isOpen,
  onClose,
  onDiscard,
  onContinueEditing,
  onSaveAsDraft,
  isSaving = false,
}: NavigationBlockerDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[480px]">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-1">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-[18px] font-bold text-[#303135] mb-2">
                You have unsaved changes
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[14px] text-[#71747d] leading-relaxed">
                The banner you created will be lost if you leave this page. Choose the action you want to take:
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
          <div className="flex gap-2 w-full">
            <TiketButton
              onClick={onContinueEditing}
              disabled={isSaving}
              className="flex-1 justify-center h-[48px]"
              variant="secondary"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Continue Editing
            </TiketButton>

            <TiketButton
              onClick={onSaveAsDraft}
              disabled={isSaving}
              className="flex-1 justify-center h-[48px]"
              variant="primary"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </>
              )}
            </TiketButton>
          </div>

          <TiketButton
            onClick={onDiscard}
            disabled={isSaving}
            className="w-full justify-center h-[48px] text-[#d4183d] hover:bg-[#FFDFDF]"
            variant="secondary"
            style={{ backgroundColor: '#FFDFDF', borderColor: '#FFDFDF' }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Discard Banner
          </TiketButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}