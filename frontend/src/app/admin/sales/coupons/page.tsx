'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { FaTicketAlt, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '' });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const mockCoupons = [
      { id: 1, code: 'WELCOME2024', discount: 20, uses: 15, maxUses: 100, status: 'active' },
      { id: 2, code: 'SUMMER50', discount: 50, uses: 8, maxUses: 50, status: 'active' },
      { id: 3, code: 'NEWYEAR30', discount: 30, uses: 30, maxUses: 30, status: 'expired' },
      { id: 4, code: 'STUDENT15', discount: 15, uses: 42, maxUses: 200, status: 'active' },
    ];
    setTimeout(() => {
      setCoupons(mockCoupons);
      setLoading(false);
    }, 300);
  };

  const handleAddCoupon = () => {
    if (!newCoupon.code || !newCoupon.discount) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    const coupon = {
      id: coupons.length + 1,
      code: newCoupon.code,
      discount: parseInt(newCoupon.discount),
      uses: 0,
      maxUses: 100,
      status: 'active'
    };
    setCoupons([...coupons, coupon]);
    setNewCoupon({ code: '', discount: '' });
    toast.success('تم إضافة الكوبون بنجاح');
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الكوبون؟')) {
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success('تم حذف الكوبون');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaTicketAlt className="text-primary" />
            الكوبونات
          </h1>
          <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark">
            <FaPlus /> إضافة كوبون
          </button>
        </div>

        {/* نموذج إضافة كوبون */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-bold mb-4">إنشاء كوبون جديد</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">كود الكوبون</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="مثال: SUMMER2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نسبة الخصم (%)</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="10"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* قائمة الكوبونات */}
        <div className="bg-white rounded-lg shadow p-6">
          {coupons.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              لا توجد كوبونات حالياً
            </p>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{coupon.code}</p>
                    <p className="text-sm text-gray-600">{coupon.discount}% خصم</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <FaEdit />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
