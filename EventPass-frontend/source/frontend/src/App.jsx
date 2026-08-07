import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, App as AntApp, theme as antdTheme } from 'antd';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/RouteGuards';
import HeaderNavbar from './components/HeaderNavbar';
import FooterSection from './components/FooterSection';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
import AdminLoginPage from './pages/AdminLoginPage';
import EventsListingPage from './pages/EventsListingPage';
import EventDetailsPage from './pages/EventDetailsPage';
import ShowSelectionPage from './pages/ShowSelectionPage';
import TicketSelectionPage from './pages/TicketSelectionPage';
import BookingConfirmPage from './pages/BookingConfirmPage';
import BookingLookupPage from './pages/BookingLookupPage';
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

/**
 * Routing and guards.
 *
 * Anything that calls a JWT-only endpoint sits behind `<ProtectedRoute>`, and the
 * whole `/admin` subtree behind `<AdminRoute>` — previously it was reachable by
 * anyone who typed the URL (integration plan YG-3).
 *
 * `/admin/login` deliberately sits outside the guard: it is how you get in.
 */
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
          Button: { colorPrimary: '#6366f1', borderRadius: 12 },
          Card: { borderRadiusLG: 16 },
        },
      }}
    >
      <AntApp>
        <Router>
          <Routes>

            {/* Admin sign-in lives outside the guarded subtree. */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<AdminDashboardPage />} />
                      <Route path="/events" element={<AdminEventsPage />} />
                      <Route path="/shows" element={<AdminShowsPage />} />
                      <Route path="/ticket-types" element={<AdminTicketTypesPage />} />
                      <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                  </AdminLayout>
                </AdminRoute>
              }
            />

            <Route
              path="/*"
              element={
                <Layout style={{ minHeight: '100vh' }}>
                  <HeaderNavbar />
                  <Content>
                    <Routes>
                      {/* Public */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/events" element={<EventsListingPage />} />
                      <Route path="/events/:id" element={<EventDetailsPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/otp-verify" element={<OtpPage />} />

                      {/* Browsing shows and tiers is public; only the booking call needs a token. */}
                      <Route path="/booking/:eventId/shows" element={<ShowSelectionPage />} />
                      <Route path="/booking/:eventId/tickets" element={<TicketSelectionPage />} />

                      {/* Signed-in only */}
                      <Route
                        path="/booking/:bookingId/confirm"
                        element={
                          <ProtectedRoute>
                            <BookingConfirmPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/booking/lookup"
                        element={
                          <ProtectedRoute>
                            <BookingLookupPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/booking/success"
                        element={
                          <ProtectedRoute>
                            <BookingSuccessPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my-bookings"
                        element={
                          <ProtectedRoute>
                            <MyBookingsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my-bookings/:bookingId"
                        element={
                          <ProtectedRoute>
                            <BookingDetailsPage />
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

                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Content>
                  <FooterSection />
                </Layout>
              }
            />

          </Routes>
        </Router>
      </AntApp>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      {/* AuthProvider wraps the router so guards and the API client share one session. */}
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
