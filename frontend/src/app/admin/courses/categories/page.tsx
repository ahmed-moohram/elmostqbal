'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { FaLayerGroup, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([
    { id: 1, name: 'تطوير الويب', courses: 12 },
    { id: 2, name: 'تطوير التطبيقات', courses: 8 },
    { id: 3, name: 'الذكاء الاصطناعي', courses: 6 },
    { id: 4, name: 'علوم البيانات', courses: 10 },
    { id: 5, name: 'التسويق الرقمي', courses: 5 },
    { id: 6, name: 'التصميم', courses: 9 },
    { id: 7, name: 'الأعمال', courses: 4 },
    { id: 8, name: 'اللغات', courses: 7 }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const handleAdd = () => {
    if (!newCategory.trim()) {
      toast.error('يرجى إدخال اسم الفئة');
      return;
    }
    const newCat = {
      id: categories.length + 1,
      name: newCategory,
      courses: 0
    };
    setCategories([...categories, newCat]);
    setNewCategory('');
    setShowModal(false);
    toast.success('تم إضافة الفئة بنجاح');
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setNewCategory(category.name);
    setShowModal(true);
  };

  const handleUpdate = () => {
    if (!newCategory.trim()) {
      toast.error('يرجى إدخال اسم الفئة');
      return;
    }
    setCategories(categories.map(cat => 
      cat.id === editingCategory.id ? { ...cat, name: newCategory } : cat
    ));
    setNewCategory('');
    setEditingCategory(null);
    setShowModal(false);
    toast.success('تم تحديث الفئة بنجاح');
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذه الفئة؟')) {
      setCategories(categories.filter(cat => cat.id !== id));
      toast.success('تم حذف الفئة');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaLayerGroup className="text-primary" />
            الفئات
          </h1>
          <button
            onClick={() => {
              setEditingCategory(null);
              setNewCategory('');
              setShowModal(true);
            }}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark"
          >
            <FaPlus /> إضافة فئة
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FaLayerGroup className="text-primary text-xl" />
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-gray-500">{category.courses} دورة</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-800 p-2"
                    title="تعديل"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-800 p-2"
                    title="حذف"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNewCategory('');
                    setEditingCategory(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="اسم الفئة"
                className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyPress={(e) => e.key === 'Enter' && (editingCategory ? handleUpdate() : handleAdd())}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNewCategory('');
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={editingCategory ? handleUpdate : handleAdd}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  {editingCategory ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
