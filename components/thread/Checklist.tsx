'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Trash2, Loader2 } from 'lucide-react';
import {
  getChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '@/lib/firebase/firestore';
import type { ChecklistItem } from '@/lib/types';

interface ChecklistProps {
  threadId: string;
  currentUserId: string;
}

/**
 * Checklist - Coordination checklist for concert planning
 */
export function Checklist({ threadId, currentUserId }: ChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load checklist items
  useEffect(() => {
    async function loadItems() {
      setLoading(true);
      try {
        const checklistItems = await getChecklistItems(threadId);
        setItems(checklistItems);
      } catch (err) {
        console.error('Failed to load checklist:', err);
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, [threadId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || adding) return;

    setAdding(true);
    try {
      const id = await createChecklistItem(threadId, newItemTitle.trim(), currentUserId);
      setItems((prev) => [
        ...prev,
        {
          id,
          title: newItemTitle.trim(),
          isCompleted: false,
          assignedTo: null,
          createdBy: currentUserId,
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any,
        },
      ]);
      setNewItemTitle('');
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleToggleItem = async (item: ChecklistItem) => {
    setUpdatingId(item.id);
    try {
      await updateChecklistItem(threadId, item.id, { isCompleted: !item.isCompleted });
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isCompleted: !i.isCompleted } : i
        )
      );
    } catch (err) {
      console.error('Failed to update item:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingId(itemId);
    try {
      await deleteChecklistItem(threadId, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const completedCount = items.filter((i) => i.isCompleted).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Coordination Checklist</h2>
        {items.length > 0 && (
          <span className="text-xs text-gray-500">
            {completedCount}/{items.length} done
          </span>
        )}
      </div>

      {/* Items list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          No items yet. Add tasks to coordinate!
        </p>
      ) : (
        <div className="space-y-2 mb-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group"
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggleItem(item)}
                disabled={updatingId === item.id}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  item.isCompleted
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 hover:border-primary-500'
                } disabled:opacity-50`}
              >
                {updatingId === item.id ? (
                  <Loader2 size={12} className="animate-spin text-gray-400" />
                ) : item.isCompleted ? (
                  <Check size={12} className="text-white" />
                ) : null}
              </button>

              {/* Title */}
              <span
                className={`flex-1 text-sm ${
                  item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'
                }`}
              >
                {item.title}
              </span>

              {/* Delete button */}
              <button
                onClick={() => handleDeleteItem(item.id)}
                disabled={deletingId === item.id}
                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {deletingId === item.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add item form */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          type="text"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          placeholder="Add task..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!newItemTitle.trim() || adding}
          className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {adding ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Plus size={18} />
          )}
        </button>
      </form>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Shared checklist for concert planning
      </p>
    </div>
  );
}
