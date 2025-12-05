'use client';

import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaCheckCircle, FaMobileAlt, FaSync } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
  icon: string;
  instructions: string;
  processingTime: string;
  isDefault: boolean;
  fees: string;
}

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const PaymentMethods: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [newMethod, setNewMethod] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tempMethod, setTempMethod] = useState<PaymentMethod>({
    id: '',
    name: '',
    isActive: true,
    icon: '',
    instructions: '',
    processingTime: '',
    isDefault: false,
    fees: ''
  });
  
  // Cargar métodos de pago desde la API
  useEffect(() => {
    fetchPaymentMethods();
  }, []);
  
  const fetchPaymentMethods = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtener token de autenticación
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('لم يتم العثور على توكن التفويض. الرجاء تسجيل الدخول مرة أخرى.');
      }
      
      if (!API_URL) {
        throw new Error('لم يتم تعريف متغير البيئة NEXT_PUBLIC_API_URL');
      }
      
      const response = await fetch(`${API_URL}/api/admin/payment-methods`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`فشل في تحميل طرق الدفع: ${response.status}`);
      }
      
      const data = await response.json();
      setPaymentMethods(data);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل طرق الدفع');
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل طرق الدفع');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (method: PaymentMethod) => {
    setEditingMethod(method);
    setTempMethod({...method});
    setNewMethod(false);
  };

  const startAddingNew = () => {
    setNewMethod(true);
    setEditingMethod(null);
    setTempMethod({
      id: Date.now().toString(),
      name: '',
      isActive: true,
      icon: '💰',
      instructions: '',
      processingTime: '24 ساعة',
      isDefault: false,
      fees: ''
    });
  };

  const cancelEditing = () => {
    setEditingMethod(null);
    setNewMethod(false);
  };

  const saveMethod = async () => {
    if (!tempMethod.name || !tempMethod.instructions) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('لم يتم العثور على توكن التفويض. الرجاء تسجيل الدخول مرة أخرى.');
      return;
    }
    
    try {
      // Actualización UI optimista
      if (newMethod) {
        // Add new method optimistically
        setPaymentMethods(prev => [...prev, tempMethod]);
      } else {
        // Update existing method optimistically
        setPaymentMethods(prev => prev.map(method => 
          method.id === tempMethod.id ? tempMethod : method
        ));
      }
      
      // Enviar a la API
      const url = newMethod 
        ? `${API_URL}/api/admin/payment-methods` 
        : `${API_URL}/api/admin/payment-methods/${tempMethod.id}`;
      
      const method = newMethod ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tempMethod)
      });
      
      if (!response.ok) {
        throw new Error(`فشل في ${newMethod ? 'إضافة' : 'تحديث'} طريقة الدفع: ${response.status}`);
      }
      
      // Obtener datos actualizados
      const updatedData = await response.json();
      
      // Actualizar el estado con los datos del servidor
      await fetchPaymentMethods();
      
      toast.success(newMethod 
        ? 'تمت إضافة طريقة الدفع بنجاح' 
        : 'تم تحديث طريقة الدفع بنجاح'
      );
    } catch (err) {
      // Revertir los cambios optimistas
      fetchPaymentMethods();
      console.error('Error saving payment method:', err);
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ طريقة الدفع');
    } finally {
      cancelEditing();
    }
  };

  const deleteMethod = async (id: string) => {
    // Check if it's the only active method
    const activeMethodsCount = paymentMethods.filter(m => m.isActive).length;
    const methodToDelete = paymentMethods.find(m => m.id === id);
    
    if (activeMethodsCount <= 1 && methodToDelete?.isActive) {
      toast.error('لا يمكن حذف طريقة الدفع الوحيدة النشطة');
      return;
    }

    // Check if it's the default method
    if (methodToDelete?.isDefault) {
      toast.error('لا يمكن حذف طريقة الدفع الافتراضية، يرجى تعيين طريقة أخرى كافتراضية أولاً');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('لم يتم العثور على توكن التفويض. الرجاء تسجيل الدخول مرة أخرى.');
      return;
    }

    try {
      // Actualización optimista de UI
      setPaymentMethods(prev => prev.filter(method => method.id !== id));
      
      // Enviar a la API
      const response = await fetch(`${API_URL}/api/admin/payment-methods/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`فشل في حذف طريقة الدفع: ${response.status}`);
      }
      
      toast.success('تم حذف طريقة الدفع بنجاح');
    } catch (err) {
      // Revertir los cambios optimistas
      fetchPaymentMethods();
      console.error('Error deleting payment method:', err);
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء حذف طريقة الدفع');
    }
  };

  const toggleActive = async (id: string) => {
    const method = paymentMethods.find(m => m.id === id);
    
    // Check if trying to deactivate the only active method
    if (method?.isActive) {
      const activeMethodsCount = paymentMethods.filter(m => m.isActive).length;
      if (activeMethodsCount <= 1) {
        toast.error('يجب أن تكون هناك طريقة دفع نشطة واحدة على الأقل');
        return;
      }
    }
    
    if (!method) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('لم يتم العثور على توكن التفويض. الرجاء تسجيل الدخول مرة أخرى.');
      return;
    }
    
    try {
      // Actualización optimista de UI
      const updatedMethod = {...method, isActive: !method.isActive};
      setPaymentMethods(prev => prev.map(m => 
        m.id === id ? updatedMethod : m
      ));
      
      // Enviar a la API
      const response = await fetch(`${API_URL}/api/admin/payment-methods/${id}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`فشل في تغيير حالة النشاط: ${response.status}`);
      }
      
      toast.success(method.isActive 
        ? 'تم تعطيل طريقة الدفع بنجاح' 
        : 'تم تفعيل طريقة الدفع بنجاح'
      );
    } catch (err) {
      // Revertir los cambios optimistas
      fetchPaymentMethods();
      console.error('Error toggling payment method active state:', err);
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء تغيير حالة النشاط');
    }
  };

  const setAsDefault = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('لم يتم العثور على توكن التفويض. الرجاء تسجيل الدخول مرة أخرى.');
      return;
    }
    
    try {
      // Actualización optimista de UI
      setPaymentMethods(prev => prev.map(method => 
        ({...method, isDefault: method.id === id})
      ));
      
      // Enviar a la API
      const response = await fetch(`${API_URL}/api/admin/payment-methods/${id}/set-default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`فشل في تعيين طريقة الدفع الافتراضية: ${response.status}`);
      }
      
      toast.success('تم تعيين طريقة الدفع الافتراضية بنجاح');
    } catch (err) {
      // Revertir los cambios optimistas
      fetchPaymentMethods();
      console.error('Error setting default payment method:', err);
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء تعيين طريقة الدفع الافتراضية');
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaMobileAlt className="text-primary" />
          طرق الدفع
        </h2>
        {!loading && !error && (
          <button 
            onClick={startAddingNew}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <FaPlus /> إضافة طريقة جديدة
          </button>
        )}
        {error && (
          <button 
            onClick={fetchPaymentMethods}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <FaSync className="animate-spin" /> إعادة المحاولة
          </button>
        )}
      </div>

      {/* Highlighting Vodafone Cash */}
      <div className="bg-gradient-to-r from-red-50 to-red-100 border-r-4 border-red-500 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 text-white p-3 rounded-full">
            <FaMobileAlt size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">فودافون كاش - طريقة الدفع المفضلة</h3>
            <p className="text-gray-600">أسرع وأسهل طريقة للدفع! معالجة فورية وبدون رسوم إضافية.</p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <FaSync className="text-primary text-3xl animate-spin" />
            <p className="text-gray-600">جاري تحميل طرق الدفع...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-red-100 p-3 rounded-full">
              <FaTimes className="text-red-500 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-red-800">حدث خطأ أثناء تحميل طرق الدفع</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && paymentMethods.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <FaMobileAlt className="text-blue-500 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-blue-800">لا توجد طرق دفع حالياً</h3>
            <p className="text-blue-600">قم بإضافة طريقة دفع جديدة للبدء</p>
            <button 
              onClick={startAddingNew}
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <FaPlus /> إضافة طريقة دفع
            </button>
          </div>
        </div>
      )}

      {/* Payment Methods List */}
      {!loading && !error && paymentMethods.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-right py-3 px-4 border-b">طريقة الدفع</th>
                <th className="text-right py-3 px-4 border-b">الحالة</th>
                <th className="text-right py-3 px-4 border-b">وقت المعالجة</th>
                <th className="text-right py-3 px-4 border-b">الرسوم</th>
                <th className="text-right py-3 px-4 border-b">افتراضي</th>
                <th className="text-right py-3 px-4 border-b">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {paymentMethods.map(method => (
                <tr key={method.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{method.icon}</span>
                      <span className="font-medium">{method.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${method.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {method.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="py-3 px-4">{method.processingTime}</td>
                  <td className="py-3 px-4">{method.fees}</td>
                  <td className="py-3 px-4">
                    {method.isDefault ? (
                      <span className="text-green-500 flex items-center gap-1">
                        <FaCheckCircle />
                        <span>افتراضي</span>
                      </span>
                    ) : (
                      <button 
                        onClick={() => setAsDefault(method.id)}
                        className="text-blue-500 hover:text-blue-700 underline text-sm"
                      >
                        تعيين كافتراضي
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleActive(method.id)}
                        className={`p-1.5 rounded-full ${method.isActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                        title={method.isActive ? 'إلغاء تنشيط' : 'تنشيط'}
                      >
                        {method.isActive ? <FaTimes size={14} /> : <FaCheckCircle size={14} />}
                      </button>
                      <button 
                        onClick={() => startEditing(method)}
                        className="p-1.5 rounded-full bg-blue-100 text-blue-600"
                        title="تعديل"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button 
                        onClick={() => deleteMethod(method.id)}
                        className="p-1.5 rounded-full bg-red-100 text-red-600"
                        title="حذف"
                        disabled={method.isDefault}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {(editingMethod || newMethod) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  {newMethod ? 
                    <><FaPlus className="text-primary" /> إضافة طريقة دفع جديدة</> : 
                    <><FaEdit className="text-primary" /> تعديل طريقة الدفع</>
                  }
                </h3>
                <button 
                  onClick={cancelEditing}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1 text-sm font-medium">الاسم</label>
                    <input
                      type="text"
                      value={tempMethod.name}
                      onChange={(e) => setTempMethod({...tempMethod, name: e.target.value})}
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="فودافون كاش"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 text-sm font-medium">الأيقونة</label>
                    <input
                      type="text"
                      value={tempMethod.icon}
                      onChange={(e) => setTempMethod({...tempMethod, icon: e.target.value})}
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="📱"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-medium">التعليمات</label>
                  <textarea
                    value={tempMethod.instructions}
                    onChange={(e) => setTempMethod({...tempMethod, instructions: e.target.value})}
                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    rows={3}
                    placeholder="أرسل المبلغ إلى الرقم..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1 text-sm font-medium">وقت المعالجة</label>
                    <input
                      type="text"
                      value={tempMethod.processingTime}
                      onChange={(e) => setTempMethod({...tempMethod, processingTime: e.target.value})}
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="فوري"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1 text-sm font-medium">الرسوم</label>
                    <input
                      type="text"
                      value={tempMethod.fees}
                      onChange={(e) => setTempMethod({...tempMethod, fees: e.target.value})}
                      className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="لا توجد"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-start mt-2 space-x-6 rtl:space-x-reverse">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempMethod.isActive}
                      onChange={() => setTempMethod({...tempMethod, isActive: !tempMethod.isActive})}
                      className="form-checkbox h-5 w-5 text-primary rounded-sm border-gray-300 focus:ring-primary"
                    />
                    <span className="mr-2 text-gray-700">نشط</span>
                  </label>

                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempMethod.isDefault}
                      onChange={() => setTempMethod({...tempMethod, isDefault: !tempMethod.isDefault})}
                      className="form-checkbox h-5 w-5 text-primary rounded-sm border-gray-300 focus:ring-primary"
                    />
                    <span className="mr-2 text-gray-700">افتراضي</span>
                  </label>
                </div>

                <div className="flex justify-end mt-6 space-x-3 rtl:space-x-reverse">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={saveMethod}
                    className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                  >
                    <FaSave />
                    حفظ
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentMethods;
