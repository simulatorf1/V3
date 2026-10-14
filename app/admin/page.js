import { tokenValido } from '../../lib/admin';
import AdminLogin from '../../components/AdminLogin';
import AdminDashboard from '../../components/AdminDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Panel de administración — V3',
  robots: { index: false, follow: false }
};

export default function PaginaAdmin() {
  if (!tokenValido()) {
    return <AdminLogin />;
  }
  return <AdminDashboard />;
}
