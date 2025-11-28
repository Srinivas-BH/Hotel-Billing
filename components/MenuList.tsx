'use client';

import React, { useState } from 'react';
import { Trash2, Edit } from 'lucide-react';
import { MenuItem } from '@/types';

interface MenuListProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

export function MenuList({ items, onEdit, onDelete }: MenuListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleConfirmDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirm(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No menu items yet. Add your first item to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex-1 pr-2">{item.dishName}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(item)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={`Edit ${item.dishName}`}
              >
                <Edit size={20} />
              </button>
              <button
                onClick={() => handleDeleteClick(item.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={`Delete ${item.dishName}`}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
          <p className="text-xl font-bold text-gray-700">${item.price.toFixed(2)}</p>

          {deleteConfirm === item.id && (
            <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
              <p className="text-sm text-red-800 mb-3">Delete this item?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirmDelete(item.id)}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 min-h-[44px] font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 min-h-[44px] font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
