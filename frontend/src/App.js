import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import { useSeasonalTheme } from './utils/seasonalTheme';
import SeasonalThemeBanner from './components/SeasonalThemeBanner';

// Pages
import Discover from './pages/Discover';
import Explore from './pages/Explore';
import EventDetail from './pages/EventDetail';
import DJMarketplace from './pages/DJMarketplace';
import DJProfile from './pages/DJProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MyTickets from './pages/MyTickets';
import TicketDetail from './pages/TicketDetail';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import DJProfileEditor from './pages/DJProfileEditor';
import BookingsList from './pages/BookingsList';
import NotFound from './pages/NotFound';
import CheckoutPage from './pages/CheckoutPage';
import AdminExternalEvents from './pages/AdminExternalEvents';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: 100 }} />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  // Apply seasonal/holiday color palette to CSS variables on every render
  useSeasonalTheme();

  return (
    <>
      <SeasonalThemeBanner />
      <Layout>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Discover />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/events/:slug" element={<EventDetail />} />
        <Route path="/djs" element={<DJMarketplace />} />
        <Route path="/djs/:slug" element={<DJProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
        <Route path="/tickets/:ticketNumber" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
        <Route path="/checkout/:eventId/:tierId" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

        {/* Organizer */}
        <Route path="/dashboard" element={<ProtectedRoute roles={['organizer', 'admin']}><Dashboard /></ProtectedRoute>} />
        <Route path="/events/create" element={<ProtectedRoute roles={['organizer', 'admin']}><CreateEvent /></ProtectedRoute>} />
        <Route path="/events/:id/edit" element={<ProtectedRoute roles={['organizer', 'admin']}><CreateEvent /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute roles={['organizer', 'dj', 'admin']}><BookingsList /></ProtectedRoute>} />

        {/* DJ */}
        <Route path="/dj/profile-editor" element={<ProtectedRoute roles={['dj', 'admin']}><DJProfileEditor /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/external-events" element={<ProtectedRoute roles={['admin']}><AdminExternalEvents /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Layout>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
