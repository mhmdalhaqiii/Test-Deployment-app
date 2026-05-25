import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';

import DashboardAdmin from './pages/DashboardAdmin';
import DashboardManajer from './pages/DashboardManajer';
import DashboardPetugas from './pages/DashboardPetugas';

import DetailReviewAdmin from './pages/DetailReviewAdmin';
import DetailPekerjaanManajer from './pages/DetailPekerjaanManajer';

import AdminTiket from './pages/AdminTiket';
import AdminPelanggan from './pages/AdminPelanggan';
import AdminAset from './pages/AdminAset';
import AdminPengguna from './pages/AdminPengguna';
import AdminMonitoring from './pages/AdminMonitoring';

import FormPekerjaan from './pages/FormPekerjaan';
import FormFotoPekerjaan from './pages/FormFotoPekerjaan';

function DashboardRedirect() {
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/dashboard-admin" replace />;
  }

  if (user.role === 'manajer') {
    return <Navigate to="/dashboard-manajer" replace />;
  }

  if (user.role === 'petugas') {
    return <Navigate to="/dashboard-petugas" replace />;
  }

  return <Navigate to="/login" replace />;
}

function AdminComingSoon({ title }) {
  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-3">
      <div
        className="bg-white rounded-4 shadow-sm p-4 text-center"
        style={{ maxWidth: 420 }}
      >
        <h4 className="fw-bold mb-2">{title}</h4>

        <p className="text-muted mb-3">
          Modul ini akan kita buat setelah dashboard admin selesai.
        </p>

        <a
          href="/dashboard-admin"
          className="btn btn-primary rounded-pill fw-bold px-4"
        >
          Kembali ke Dashboard Admin
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<DashboardRedirect />} />

        <Route path="/dashboard-admin" element={<DashboardAdmin />} />
        <Route path="/dashboard-manajer" element={<DashboardManajer />} />
        <Route path="/dashboard-petugas" element={<DashboardPetugas />} />

        <Route path="/pekerjaan/:id" element={<FormPekerjaan />} />
        <Route path="/pekerjaan/:id/foto" element={<FormFotoPekerjaan />} />

        <Route path="/manajer/pekerjaan/:id" element={<DetailPekerjaanManajer />} />

        <Route path="/admin/review/:id" element={<DetailReviewAdmin />} />
        <Route path="/admin/pelanggan" element={<AdminPelanggan />} />
        <Route path="/admin/aset" element={<AdminAset />} />
        <Route path="/admin/tiket" element={<AdminTiket />} />
        <Route path="/admin/pengguna" element={<AdminPengguna />} />
        <Route path="/admin/monitoring" element={<AdminMonitoring />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;