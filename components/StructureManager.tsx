import React, { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import { FormInput } from './FormControls';

interface StructureManagerProps {
  title: string;
  items: string[];
  onUpdateItems: (newItems: string[]) => void;
  itemNoun?: string;
}

const StructureManager: React.FC<StructureManagerProps> = ({ title, items, onUpdateItems, itemNoun = 'item' }) => {
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const handleAddItem = () => {
    if (newItem.trim() && !items.find(i => i.toLowerCase() === newItem.trim().toLowerCase())) {
      onUpdateItems([...items, newItem.trim()].sort());
      setNewItem('');
    }
  };

  const handleEdit = (index: number, value: string) => {
    setEditingIndex(index);
    setEditingValue(value);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };
  
  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    if (editingValue.trim() && !items.find((i, idx) => i.toLowerCase() === editingValue.trim().toLowerCase() && idx !== editingIndex)) {
        const updatedItems = [...items];
        updatedItems[editingIndex] = editingValue.trim();
        onUpdateItems(updatedItems.sort());
        handleCancelEdit();
    }
  };

  const handleDelete = () => {
    if (itemToDelete) {
        onUpdateItems(items.filter(i => i !== itemToDelete));
        setItemToDelete(null);
    }
  };


  return (
    <>
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm flex flex-col h-full">
            <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">{title}</h3>
            <div className="flex gap-2 mb-4">
                <FormInput 
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    placeholder={`Add new ${itemNoun}...`}
                    className="flex-grow min-w-0 !mt-0"
                />
                <button
                    onClick={handleAddItem}
                    className="bg-brand-primary text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm font-semibold hover:bg-rose-900 transition-colors disabled:bg-rose-300 disabled:cursor-not-allowed flex-shrink-0"
                    disabled={!newItem.trim()}
                >
                    <PlusIcon className="w-4 h-4" />
                    Add
                </button>
            </div>
            <div className="flex-grow flex items-center justify-center">
                {items.length === 0 ? (
                    <p className="text-sm text-brand-text-light dark:text-gray-400 text-center py-4">No {itemNoun}s added yet.</p>
                ) : (
                    <div className="w-full space-y-2 pr-2">
                        {items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                {editingIndex === index ? (
                                    <>
                                        <FormInput
                                            type="text"
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                            autoFocus
                                            className="flex-grow !mt-0"
                                        />
                                        <div className="flex items-center ml-2">
                                            <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-700"><CheckIcon className="w-5 h-5"/></button>
                                            <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-700 ml-1"><XMarkIcon className="w-5 h-5"/></button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm text-gray-800 dark:text-gray-300">{item}</span>
                                        <div className="flex items-center">
                                            <button onClick={() => handleEdit(index, item)} className="text-brand-accent hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"><PencilIcon className="w-4 h-4"/></button>
                                            <button onClick={() => setItemToDelete(item)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ml-2"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
        {itemToDelete && (
            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleDelete}
                title={`Delete ${itemNoun}`}
                message={`Are you sure you want to delete "${itemToDelete}"? This may affect other parts of the system.`}
            />
        )}
    </>
  );
};

export default StructureManager;