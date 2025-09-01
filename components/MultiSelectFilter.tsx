
import React, { useState, useRef, useEffect, useMemo } from 'react';

interface MultiSelectFilterProps {
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (optionId: string) => {
    if (selected.includes(optionId)) {
      onChange(selected.filter(id => id !== optionId));
    } else {
      onChange([...selected, optionId]);
    }
  };
  
  const filteredOptions = useMemo(() => 
    options.filter(opt => opt.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm]
  );

  const allFilteredSelected = useMemo(() => {
    if (filteredOptions.length === 0) return false;
    return filteredOptions.every(opt => selected.includes(opt.id));
  }, [selected, filteredOptions]);

  const handleSelectAllFiltered = () => {
    const filteredIds = new Set(filteredOptions.map(o => o.id));
    if (allFilteredSelected) {
      // deselect all visible
      onChange(selected.filter(id => !filteredIds.has(id)));
    } else {
      // select all visible
      onChange([...new Set([...selected, ...Array.from(filteredIds)])]);
    }
  };

  const selectedLabel = useMemo(() => {
    if (selected.length === 0) return `All ${label}`;
    const selectedNames = selected.map(id => options.find(opt => opt.id === id)?.name).filter(Boolean);
    if (selected.length === 1) return selectedNames[0] || `${selected.length} ${label} selected`;
    return `${selected.length} ${label} selected`;
  }, [selected, options, label]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-left text-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary py-2.5 px-3 flex items-center justify-between w-full"
      >
        <span className="truncate">{selectedLabel}</span>
        <svg className={`w-4 h-4 ml-2 transition-transform shrink-0 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 rounded-md shadow-lg border dark:border-slate-700 max-h-80 flex flex-col">
          <div className="p-2 border-b dark:border-slate-700">
             <input 
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-900 border-transparent rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
             />
          </div>
          <div className="flex-grow overflow-y-auto">
            <div className="p-2">
              <label className={`flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md cursor-pointer transition-colors ${allFilteredSelected ? 'bg-rose-100 dark:bg-rose-900/40' : ''}`}>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={handleSelectAllFiltered}
                  className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
                <span className="dark:text-gray-200 font-semibold">(Select All Visible)</span>
              </label>
            </div>
            <div className="border-t dark:border-slate-700" />
            <div className="p-2 space-y-1">
              {filteredOptions.map(option => {
                  const isSelected = selected.includes(option.id);
                  return (
                    <label key={option.id} className={`flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-rose-100 dark:bg-rose-900/40' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(option.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                      />
                      <span className="dark:text-gray-200 truncate">{option.name}</span>
                    </label>
                  )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;
