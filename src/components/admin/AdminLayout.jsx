import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Crown, Home, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ADMIN_CONFIG } from '../../config/admin';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearRole } = useApp();
  const dashboardPath = ADMIN_CONFIG.routePrefix;
  const isDashboard = location.pathname === dashboardPath || location.pathname === `${dashboardPath}/dashboard`;

  const handleLogout = () => {
    clearRole();
    navigate('/');
  };

  return (
    <div className="admin-layout app-style-admin">
      <header className="admin-app-header">
        <div className="admin-app-brand">
          <span className="admin-app-icon"><Crown size={22} /></span>
          <div>
            <p className="admin-app-kicker">Administrator</p>
            <h1>Admin Portal</h1>
          </div>
        </div>
        <div className="admin-app-actions">
          {!isDashboard && (
            <Link className="admin-header-btn" to={dashboardPath}>
              <Home size={17} />
              <span>Dashboard</span>
            </Link>
          )}
          <button className="admin-header-btn exit" type="button" onClick={handleLogout}>
            <LogOut size={17} />
            <span>Exit</span>
          </button>
        </div>
      </header>

      <main className="admin-main" role="main">
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
