'use client';

import AdminLayout from '@/components/AdminLayout';
import AdvancedDashboard from "@/components/admin/AdvancedDashboard";

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <div className="p-6">
        <AdvancedDashboard />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;