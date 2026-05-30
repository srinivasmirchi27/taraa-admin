"use client";

import { useState } from "react";
import { categories } from "../../data/products";
import { Tag, Edit2, Plus, Trash2 } from "lucide-react";

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState(categories);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{cats.length} categories</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] hover:bg-[#b8963f] text-black text-sm font-semibold rounded-lg transition-colors">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.map((cat) => (
          <div key={cat.name} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="relative h-32 bg-gray-100">
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <h3 className="text-white text-lg font-bold">{cat.name}</h3>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag size={15} className="text-gray-400" />
                <span className="text-sm text-gray-600">{cat.count} products</span>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => setCats((prev) => prev.filter((c) => c.name !== cat.name))}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
