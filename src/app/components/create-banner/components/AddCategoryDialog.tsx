import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface AddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (category: string) => void;
}

export function AddCategoryDialog({ isOpen, onClose, onAdd }: AddCategoryDialogProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        onClose();
        setValue('');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new vertical category for your banner.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="grid gap-2">
            <Label htmlFor="category" className="text-[14px] font-bold text-[#303135]" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}>Category Name</Label>
            <Input
              id="category"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. Flight, Train, etc."
              autoFocus
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              onClick={onClose}
              className="w-full bg-transparent text-[#007bff] hover:bg-[#f4f7fe] font-bold rounded-[8px] border-none shadow-none h-[48px] text-[16px] leading-[24px]"
              style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!value.trim()}
              className="w-full bg-[#007BFF] text-white hover:bg-[#0064D2] font-bold rounded-[8px] h-[48px] text-[16px] leading-[24px]"
              style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}
            >
              Add Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}