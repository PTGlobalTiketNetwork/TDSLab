import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "./ui/utils";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete Asset",
  description = "Are you sure you want to delete this asset? This action cannot be undone.",
  isLoading = false,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className="fixed inset-0 z-[99999] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-[99999] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg md:w-full",
            "max-w-[486px] rounded-[12px] p-[32px] shadow-[0px_8px_24px_0px_rgba(48,49,53,0.24)]"
          )}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-[16px] text-center">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <AlertDialogPrimitive.Title className="text-[18px] leading-[24px] font-bold text-[#303135]" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}>
                    {title}
                </AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description className="text-[14px] leading-[20px] text-[#71747d]" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 400 }}>
                    {description}
                </AlertDialogPrimitive.Description>
            </div>
          </div>
          <div className="flex flex-col gap-[8px] mt-[16px] sm:flex-row sm:justify-center">
            <AlertDialogPrimitive.Cancel
              className={cn(
                "w-full bg-transparent text-[#007bff] hover:bg-[#f4f7fe] font-bold rounded-[8px] border-none shadow-none h-[48px] text-[16px] leading-[24px] inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 mt-2 sm:mt-0"
              )}
              style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}
              disabled={isLoading}
            >
              Cancel
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
              className={cn(
                "w-full bg-red-600 text-white hover:bg-red-700 font-bold rounded-[8px] h-[48px] text-[16px] leading-[24px] inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              )}
              style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}
              disabled={isLoading}
            >
              {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
              ) : (
                  "Delete"
              )}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
