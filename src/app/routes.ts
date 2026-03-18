import { createBrowserRouter } from "react-router";
import { SplashScreen } from "./screens/SplashScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SignupScreen } from "./screens/SignupScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { SearchResultsScreen } from "./screens/SearchResultsScreen";
import { VenueDetailScreen } from "./screens/VenueDetailScreen";
import { BookingFlowScreen } from "./screens/BookingFlowScreen";
import { PaymentScreen } from "./screens/PaymentScreen";
import { BookingConfirmationScreen } from "./screens/BookingConfirmationScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { AdminDashboardScreen } from "./screens/AdminDashboardScreen";
import { VendorDashboardScreen } from "./screens/VendorDashboardScreen";
import { TermsScreen } from "./screens/TermsScreen";
import { DeveloperSeedScreen } from "./screens/DeveloperSeedScreen";

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
    Component: HomeScreen,
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
    Component: BookingFlowScreen,
  },
  {
    path: "/payment/:id",
    Component: PaymentScreen,
  },
  {
    path: "/confirmation/:id",
    Component: BookingConfirmationScreen,
  },
  {
    path: "/profile",
    Component: ProfileScreen,
  },
  {
    path: "/admin",
    Component: AdminDashboardScreen,
  },
  {
    path: "/vendor",
    Component: VendorDashboardScreen,
  },
  {
    path: "/terms",
    Component: TermsScreen,
  },
  {
    path: "/dev/seed",
    Component: DeveloperSeedScreen,
  },
]);
