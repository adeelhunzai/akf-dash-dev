"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ListItem {
  id: number;
  name: string;
}

interface ListItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: ListItem[];
}

export default function ListItemsModal({ open, onOpenChange, title, items }: ListItemsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md p-0 gap-0 overflow-hidden bg-white">
        {/* Header */}
        <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
          <DialogTitle className="text-lg font-bold text-[#1a1a1a]">{title}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </DialogClose>
        </div>

        {/* Content */}
        <div className="p-4 max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
          {items.length > 0 ? (
            <ul className="space-y-2">
              {items.map((item, idx) => (
                <li 
                  key={item.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <span className="w-6 h-6 rounded-full bg-[#00B140] text-white text-xs font-semibold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-[#1a1a1a] font-medium">{item.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">No items to display</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
