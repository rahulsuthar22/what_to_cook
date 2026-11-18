import React from 'react';
import { AdminPageLoader } from '@/components/admin/AdminLoader';

export default function AdminLoading() {
  return (
    <AdminPageLoader
      title="Control Center"
      subtitle="Loading admin workspace & records..."
    />
  );
}

