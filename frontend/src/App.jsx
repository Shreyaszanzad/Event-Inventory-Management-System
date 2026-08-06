import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Layout, theme as antdTheme } from 'antd';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import HeaderNavbar from './components/HeaderNavbar';
import FooterSection from './components/FooterSection';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
import EventsListingPage from './pages/EventsListingPage';
import EventDetailsPage from './pages/EventDetailsPage';
import ShowSelectionPage from './pages/ShowSelectionPage';
import TicketSelectionPage from './pages/TicketSelectionPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import MyBookingsPage from './pages/MyBookingsPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import ProfilePage from './pages/ProfilePage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import AdminShowsPage from './pages/admin/AdminShowsPage';
import AdminTicketTypesPage from './pages/admin/AdminTicketTypesPage';

const { Content } = Layout;

function AppContent() {
  const { isDarkMode } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 10,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          colorLink: '#6366f1',
        },
        components: {
          Button: {
            colorPrimary: '#6366f1',
            borderRadius: 12,
          },
          Card: {
            borderRadiusLG: 16,
          }
        }
      }}
    >
      <Router>
        <Routes>
          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboardPage />} />
                  <Route path="/events" element={<AdminEventsPage />} />
                  <Route path="/shows" element={<AdminShowsPage />} />
                  <Route path="/ticket-types" element={<AdminTicketTypesPage />} />
                </Routes>
              </AdminLayout>
            }
          />

          {/* Public Routes */}
          <Route
            path="/*"
            element={
              <Layout style={{ minHeight: '100vh' }}>
                <HeaderNavbar />
                <Content>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/events" element={<EventsListingPage />} />
                    <Route path="/events/:id" element={<EventDetailsPage />} />
                    <Route path="/booking/:eventId/shows" element={<ShowSelectionPage />} />
                    <Route path="/booking/:eventId/tickets" element={<TicketSelectionPage />} />
                    <Route path="/booking/success" element={<BookingSuccessPage />} />
                    <Route path="/my-bookings" element={<MyBookingsPage />} />
                    <Route path="/my-bookings/:bookingId" element={<BookingDetailsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/otp-verify" element={<OtpPage />} />
                  </Routes>
                </Content>
                <FooterSection />
              </Layout>
            }
          />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
