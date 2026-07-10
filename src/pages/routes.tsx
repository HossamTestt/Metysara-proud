import { lazy, Suspense } from 'react';
import { createBrowserRouter } from "react-router";
import { SplashScreen } from "./SplashScreen";
import { OnboardingScreen } from "./OnboardingScreen";
import { LoginScreen } from "./LoginScreen";
import { SignupScreen } from "./SignupScreen";
import { HomeScreen } from "./HomeScreen";
import { SearchResultsScreen } from "./SearchResultsScreen";
import { VenueDetailScreen } from "./VenueDetailScreen";
import { BookingFlowScreen } from "./BookingFlowScreen";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const AdminDashboardScreen = lazy(() => import('./AdminDashboardScreen').then(m => ({ default: m.AdminDashboardScreen })));
const VendorDashboardScreen = lazy(() => import('./VendorDashboardScreen').then(m => ({ default: m.VendorDashboardScreen })));
const ProfileScreen = lazy(() => import('./ProfileScreen').then(m => ({ default: m.ProfileScreen })));
const PaymentScreen = lazy(() => import('./PaymentScreen').then(m => ({ default: m.PaymentScreen })));
const BookingConfirmationScreen = lazy(() => import('./BookingConfirmationScreen').then(m => ({ default: m.BookingConfirmationScreen })));
const ChatScreen = lazy(() => import('./ChatScreen').then(m => ({ default: m.ChatScreen })));
const TermsScreen = lazy(() => import('./TermsScreen').then(m => ({ default: m.TermsScreen })));
// DeveloperSeedScreen intentionally excluded from production build

export const router = createBrowserRouter([
  {
    path: "/",
    Component: SplashScreen,
  },
  {
    path: "/onboarding",
    Component: OnboardingScreen,
  },
  {
    path: "/login",
    Component: LoginScreen,
  },
  {
    path: "/signup",
    Component: SignupScreen,
  },
  {
    path: "/home",
    element: (
      <ProtectedRoute allowedRoles={["customer", "vendor", "admin", "support"]}>
        <HomeScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: "/search",
    Component: SearchResultsScreen,
  },
  {
    path: "/venue/:id",
    Component: VenueDetailScreen,
  },
  {
    path: "/booking/:id",
    element: (
      <ProtectedRoute allowedRoles={["customer", "admin", "support"]}>
        <BookingFlowScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: "/payment/:id",
    element: (
      <ProtectedRoute allowedRoles={["customer", "admin", "support"]}>
        <Suspense fallback={<LoadingFallback />}>
          <PaymentScreen />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/confirmation/:id",
    element: (
      <ProtectedRoute allowedRoles={["customer", "admin", "support"]}>
        <Suspense fallback={<LoadingFallback />}>
          <BookingConfirmationScreen />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute allowedRoles={["customer", "vendor", "admin", "support"]}>
        <Suspense fallback={<LoadingFallback />}>
          <ProfileScreen />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/chat",
    element: (
      <ProtectedRoute allowedRoles={["customer", "admin", "support"]}>
        <Suspense fallback={<LoadingFallback />}>
          <ChatScreen />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin", "support"]}>
        <Suspense fallback={<LoadingFallback />}>
          <AdminDashboardScreen />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/vendor",
    element: (
      <ProtectedRoute allowedRoles={["vendor"]}>
        <Suspense fallback={<LoadingFallback />}>
          <VendorDashboardScreen />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/terms",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <TermsScreen />
      </Suspense>
    ),
  },
  // /dev/seed route removed from production build for security
]);

