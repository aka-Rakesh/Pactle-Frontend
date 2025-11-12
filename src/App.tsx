import React, { useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import PublicRoute from "./pages/auth/PublicRoute";
import ProtectedRoute from "./pages/auth/ProtectedRoute";
import PermissionRoute from "./pages/auth/PermissionRoute";
import { useAuthStore } from "./stores";
import { Loading } from "./components/ui/Loading";
import { useClientConfig } from "./hooks/useClientConfig";
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const SignUpPage = lazy(() => import("./pages/auth/SignUpPage"));
const SetupPasswordPage = lazy(() => import("./pages/auth/SetupPasswordPage"));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const DashboardLayout = lazy(
  () => import("./components/layout/DashboardLayout")
);
const OverviewPage = lazy(() => import("./pages/dashboard/OverviewPage"));
const SkuListPage = lazy(() => import("./pages/dashboard/SkuListPage"));
const RawMaterialsPage = lazy(() => import("./pages/dashboard/RawMaterialsPage"));
// const QuotationsPage = lazy(() => import("./pages/quotation/QuotationsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const QuotationDetailsPage = lazy(
  () => import("./pages/quotation/QuotationDetailsPage")
);
const QuotePreviewPage = lazy(
  () => import("./pages/quotation/QuotePreviewPage")
);
const HealthPage = lazy(() => import("./pages/HealthPage"));
const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const MembersPage = lazy(() => import("./pages/member/MembersPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const HelpSupportPage = lazy(() => import("./pages/help/HelpSupportPage"));

const App: React.FC = () => {
  const { initializeAuth } = useAuthStore();
  const { features } = useClientConfig();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Router>
      <Suspense
        fallback={
          <Loading
            fullscreen
            size="lg"
            message="Loading application..."
            subMessage="Please wait while we prepare your workspace."
          />
        }
      >
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignUpPage />
              </PublicRoute>
            }
          />
          <Route
            path="/setup-password"
            element={
              <PublicRoute>
                <SetupPasswordPage />
              </PublicRoute>
            }
          />
          <Route path="/verify-email" element={
            <PublicRoute>
              <VerifyEmailPage />
            </PublicRoute>
          } />
          <Route path="/reset-password" element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          } />

          {/* Protected Welcome Route */}
          <Route
            path="/welcome"
            element={
              <ProtectedRoute>
                <WelcomePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="quotations" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="quotations/:rfqId"
              element={<QuotationDetailsPage />}
            />
            <Route
              path="quotations/:rfqId/preview"
              element={<QuotePreviewPage />}
            />

            {/* Profile route within dashboard layout */}
            {features.showProfile && (
              <Route path="profile" element={<ProfilePage />} />
            )}

            {/* Members route within dashboard layout */}
            {features.showMembers && (
              <Route
                path="members"
                element={
                  <PermissionRoute pageKey="members">
                    <MembersPage />
                  </PermissionRoute>
                }
              />
            )}

            {/* SKU List (Admin only) */}
            {features.showSkuList && (
              <Route
                path="sku-list"
                element={
                  <PermissionRoute pageKey="sku_list">
                    <SkuListPage />
                  </PermissionRoute>
                }
              />
            )}

            {/* Raw Material Sheet */}
            {features.showRawMaterials && (
              <Route
                path="raw-material-sheet"
                element={
                  <PermissionRoute pageKey="raw_material_sheet">
                    <RawMaterialsPage />
                  </PermissionRoute>
                }
              />
            )}

            {/* Help & Support */}
            {features.showHelpSupport && (
              <Route
                path="help"
                element={
                  <PermissionRoute pageKey="help_support">
                    <HelpSupportPage />
                  </PermissionRoute>
                }
              />
            )}
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />

          {/* Health Page */}
          <Route path="/health" element={<HealthPage />} />

          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
