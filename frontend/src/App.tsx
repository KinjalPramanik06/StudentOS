import React, { useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAppStore } from './store/useAppStore';
import { useAcademicClock } from './hooks/useAcademicClock';
import { useDataSync } from './hooks/useDataSync';

import { ScheduleProvider } from './context/ScheduleContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { PageSkeletonLoader } from './components/common/PageSkeletonLoader';
import { markStart, markEnd } from './utils/telemetry';

// Lazy loaded page components
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const TimetablePage = lazy(() => import('./pages/TimetablePage').then((m) => ({ default: m.TimetablePage })));
const SchedulePage = lazy(() => import('./pages/SchedulePage').then((m) => ({ default: m.SchedulePage })));
const AttendancePage = lazy(() => import('./pages/AttendancePage').then((m) => ({ default: m.AttendancePage })));
const MarksPage = lazy(() => import('./pages/MarksPage').then((m) => ({ default: m.MarksPage })));
const YgpaSgpaPage = lazy(() => import('./pages/YgpaSgpaPage').then((m) => ({ default: m.YgpaSgpaPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const HolidayPage = lazy(() => import('./pages/HolidayPage').then((m) => ({ default: m.HolidayPage })));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage').then((m) => ({ default: m.SubjectsPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage').then((m) => ({ default: m.AdminPanelPage })));
const AcademicCalendarManagementPage = lazy(() =>
  import('./pages/AcademicCalendarManagementPage').then((m) => ({ default: m.AcademicCalendarManagementPage }))
);

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authReady } = useAppStore();
  if (!authReady) return <PageSkeletonLoader />;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <MainLayout>{children}</MainLayout>;
};

// Admin Route Guard (Restricts /admin strictly to admin role profiles)
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authReady } = useAppStore();
  if (!authReady) return <PageSkeletonLoader />;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <MainLayout>{children}</MainLayout>;
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    markStart(`route_${location.pathname}`);
    return () => {
      markEnd(`route_${location.pathname}`);
    };
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="w-full min-w-0"
      >
        <Suspense fallback={<PageSkeletonLoader />}>
          <Routes location={location}>
            <Route path="/login" element={<AuthPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timetable"
              element={
                <ProtectedRoute>
                  <TimetablePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <ProtectedRoute>
                  <SchedulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marks"
              element={
                <ProtectedRoute>
                  <MarksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ygpa-sgpa"
              element={
                <ProtectedRoute>
                  <YgpaSgpaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/holidays"
              element={
                <ProtectedRoute>
                  <HolidayPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subjects"
              element={
                <ProtectedRoute>
                  <SubjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanelPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/calendar"
              element={
                <AdminRoute>
                  <AcademicCalendarManagementPage />
                </AdminRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

export default function App() {
  useAcademicClock();
  useDataSync();
  const restoreSession = useAppStore((state) => state.restoreSession);

  useEffect(() => {
    markStart('studentos_hydration');
    restoreSession().then(() => {
      markEnd('studentos_hydration');
    });
  }, [restoreSession]);

  return (
    <Router>
      <ThemeProvider>
        <ScheduleProvider>
          <AnimatedRoutes />
        </ScheduleProvider>
      </ThemeProvider>
    </Router>
  );
}
