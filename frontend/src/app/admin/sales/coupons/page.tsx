'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { FaTicketAlt, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import supabase from '@/lib/supabase-client';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '' });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب الكوبونات:', error);
        setCoupons([]);
        return;
      }

      const transformed = (data || []).map((row: any) => ({
        id: row.id,
        code: row.code,
        discount: row.discount || 0,
        uses: row.uses || 0,
        maxUses: row.max_uses || 0,
        status: row.status || 'active',
      }));

      setCoupons(transformed);
    } catch (error) {
      console.error('خطأ غير متوقع في جلب الكوبونات:', error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    const discountValue = parseInt(newCoupon.discount, 10);
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      toast.error('نسبة الخصم يجب أن تكون بين 0 و 100');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          code: newCoupon.code,
          discount: discountValue,
          uses: 0,
          max_uses: 100,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('خطأ في إضافة الكوبون:', error);
        toast.error('فشل إضافة الكوبون');
        return;
      }

      const coupon = {
        id: data.id,
        code: data.code,
        discount: data.discount || discountValue,
        uses: data.uses || 0,
        maxUses: data.max_uses || 100,
        status: data.status || 'active',
      };

      setCoupons([...coupons, coupon]);
      setNewCoupon({ code: '', discount: '' });
      toast.success('تم إضافة الكوبون بنجاح');
    } catch (error) {
      console.error('خطأ غير متوقع في إضافة الكوبون:', error);
      toast.error('فشل إضافة الكوبون');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('خطأ في حذف الكوبون:', error);
        toast.error('فشل حذف الكوبون');
        return;
      }

      setCoupons(coupons.filter(c => c.id !== id));
      toast.success('تم حذف الكوبون');
    } catch (error) {
      console.error('خطأ غير متوقع في حذف الكوبون:', error);
      toast.error('فشل حذف الكوبون');
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
          <button
            onClick={handleAddCoupon}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark"
          >
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
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="مثال: SUMMER2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نسبة الخصم (%)</label>
              <input
                type="number"
                value={newCoupon.discount}
                onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
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
