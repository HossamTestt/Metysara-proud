import { createBrowserRouter } from "react-router";
import { SplashScreen } from "./SplashScreen";
import { OnboardingScreen } from "./OnboardingScreen";
import { LoginScreen } from "./LoginScreen";
import { SignupScreen } from "./SignupScreen";
import { HomeScreen } from "./HomeScreen";
import { SearchResultsScreen } from "./SearchResultsScreen";
import { VenueDetailScreen } from "./VenueDetailScreen";
import { BookingFlowScreen } from "./BookingFlowScreen";
import { PaymentScreen } from "./PaymentScreen";
import { BookingConfirmationScreen } from "./BookingConfirmationScreen";
import { ProfileScreen } from "./ProfileScreen";
import { AdminDashboardScreen } from "./AdminDashboardScreen";
import { VendorDashboardScreen } from "./VendorDashboardScreen";
import { TermsScreen } from "./TermsScreen";
import { ChatScreen } from "./ChatScreen";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
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
        <PaymentScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: "/confirmation/:id",
    element: (
      <ProtectedRoute allowedRoles={["customer", "admin", "support"]}>
        <BookingConfirmationScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute allowedRoles={["customer", "vendor", "admin", "support"]}>
        <ProfileScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: "/chat",
    element: (
      <ProtectedRoute allowedRoles={["customer", "admin", "support"]}>
        <ChatScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin", "support"]}>
        <AdminDashboardScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: "/vendor",
    element: (
      <ProtectedRoute allowedRoles={["vendor"]}>
        <VendorDashboardScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: "/terms",
    Component: TermsScreen,
  },
  // /dev/seed route removed from production build for security
]);

