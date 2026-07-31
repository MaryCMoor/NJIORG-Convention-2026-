import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { AdminProvider } from './context/AdminContext'
import { ADMIN_CONFIG } from './config/admin'
import ErrorBoundary from './components/ErrorBoundary'
import RoleGate from './components/RoleGate'
import Layout from './components/layout/Layout'
import AdminLayout from './components/admin/AdminLayout'
import Home from './pages/Home'
import Schedule from './pages/Schedule'
import Registration from './pages/Registration'
import MyConvention from './pages/MyConvention'
import Announcements from './pages/Announcements'
import Maps from './pages/Maps'
import EventInfo from './pages/EventInfo'
import ProgramBook from './pages/ProgramBook'
import Committees from './pages/Committees'
import Meals from './pages/Meals'
import Housing from './pages/Housing'
import Directory from './pages/Directory'
import NJRainbow from './pages/NJRainbow'
import Speakers from './pages/Speakers'
import NJAssemblies from './pages/NJAssemblies'
import SocialWall from './pages/SocialWall'
import Gallery from './pages/Gallery'
import Awards from './pages/Awards'
import Documents from './pages/Documents'
import Surveys from './pages/Surveys'
import Reports from './pages/Reports'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageAttendees from './pages/admin/ManageAttendees'
import ManageSchedule from './pages/admin/ManageSchedule'
import ManageAnnouncements from './pages/admin/ManageAnnouncements'
import ManageMembers from './pages/admin/ManageMembers'
import ManageSpeakers from './pages/admin/ManageSpeakers'
import ManageAssemblies from './pages/admin/ManageAssemblies'
import ManageSocialFeed from './pages/admin/ManageSocialFeed'
import ManageMeals from './pages/admin/ManageMeals'
import ManageAwards from './pages/admin/ManageAwards'
import ManageDocuments from './pages/admin/ManageDocuments'
import ManageGallery from './pages/admin/ManageGallery'
import ManageSurveys from './pages/admin/ManageSurveys'
import AdminSettings from './pages/admin/AdminSettings'
import './styles/global.css'

const AdminRoute = () => {
  const { selectedRole, adminUnlocked } = useApp()
  if (selectedRole !== 'administrator' || !adminUnlocked) {
    return <Navigate to="/" replace />
  }
  return <AdminLayout />
}

const AppRoutes = () => {
  const adminPath = ADMIN_CONFIG.secretRoute; // e.g., '/admin/IORG-2026-ADMIN'
  const adminParentPath = adminPath.replace(/^\/+/, ''); // Remove leading slash for HashRouter
  const { selectedRole, adminUnlocked } = useApp()

  if (!selectedRole) {
    return <RoleGate />
  }

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={selectedRole === 'administrator' && adminUnlocked ? <Navigate to={ADMIN_CONFIG.secretRoute} replace /> : <Home />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="schedule/:eventId" element={<Schedule />} />
            <Route path="registration" element={<Registration />} />
            <Route path="my-convention" element={<MyConvention />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="event-info" element={<EventInfo />} />
            <Route path="maps" element={<Maps />} />
            <Route path="program-book" element={<ProgramBook />} />
            <Route path="committees" element={<Committees />} />
            <Route path="meals" element={<Meals />} />
            <Route path="housing" element={<Housing />} />
            <Route path="directory" element={<Directory />} />
            <Route path="nj-rainbow" element={<NJRainbow />} />
            <Route path="nj-rainbow/:personId" element={<NJRainbow />} />
            <Route path="speakers" element={<Speakers />} />
            <Route path="assemblies" element={<NJAssemblies />} />
            <Route path="social-wall" element={<SocialWall />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="awards" element={<Awards />} />
            <Route path="documents" element={<Documents />} />
            <Route path="surveys" element={<Surveys />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* Hidden Admin Portal - only accessible via secret URL */}
          <Route path={adminParentPath} element={<AdminRoute />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="attendees" element={<ManageAttendees />} />
            <Route path="schedule" element={<ManageSchedule />} />
            <Route path="schedule/new" element={<ManageSchedule />} />
            <Route path="announcements" element={<ManageAnnouncements />} />
            <Route path="members" element={<ManageMembers />} />
            <Route path="speakers" element={<ManageSpeakers />} />
            <Route path="assemblies" element={<ManageAssemblies />} />
            <Route path="social" element={<ManageSocialFeed />} />
            <Route path="meals" element={<ManageMeals />} />
            <Route path="awards" element={<ManageAwards />} />
            <Route path="documents" element={<ManageDocuments />} />
            <Route path="gallery" element={<ManageGallery />} />
            <Route path="surveys" element={<ManageSurveys />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </HashRouter>
  )
}

function App() {
  return (
    <AppProvider>
      <AdminProvider>
        <AppRoutes />
      </AdminProvider>
    </AppProvider>
  )
}

export default App