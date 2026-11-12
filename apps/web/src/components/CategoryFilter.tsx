// apps/web/src/components/CategoryFilter.tsx
'use client';

import React from 'react';
import { CategoryFilterOption } from '../types/product';

interface CategoryFilterProps {
  selectedCategory: CategoryFilterOption;
  onSelectCategory: (category: CategoryFilterOption) => void;
}

interface CategoryTab {
  id: CategoryFilterOption;
  label: string;
}

/**
 * Danh sách 6 tab danh mục đồ uống chuẩn xác 100% theo bản thiết kế Figma BrewLite 2 mới
 */
const CATEGORY_TABS: CategoryTab[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'ESPRESSO', label: 'Cà phê pha máy' },
  { id: 'COLD_BREW', label: 'Cà phê ủ lạnh' },
  { id: 'TEA', label: 'Trà thảo mộc & trái cây' },
  { id: 'FREEZE', label: 'Đá xay' },
  { id: 'PASTRY', label: 'Bánh nướng trong ngày' },
];

/**
 * Component thanh lọc danh mục sản phẩm (CategoryFilter).
 * Phong cách Botanical & Scandinavian Minimalist (chuẩn Figma 01 · Máy tính).
 */
export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <nav
      aria-label="Bộ lọc danh mục đồ uống"
      className="w-full overflow-x-auto py-1 scrollbar-none"
    >
      <div className="flex items-center gap-2.5 min-w-max">
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectCategory(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 select-none cursor-pointer ${
                isActive
                  ? 'bg-[#183B2B] text-white shadow-2xs font-semibold'
                  : 'bg-white text-[#59665F] hover:bg-[#F0EDE6] border border-[#E5E8E1]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
