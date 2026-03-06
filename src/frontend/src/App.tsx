import { AppLayout } from "@/components/AppLayout";
import { ThemeProvider } from "@/context/ThemeContext";
import { Charts } from "@/pages/Charts";
import { Dashboard } from "@/pages/Dashboard";
import { History } from "@/pages/History";
import { KYC } from "@/pages/KYC";
import { KYCAdmin } from "@/pages/KYCAdmin";
import { Login } from "@/pages/Login";
import { Markets } from "@/pages/Markets";
import { Payments } from "@/pages/Payments";
import { Portfolio } from "@/pages/Portfolio";
import { PriceAlerts } from "@/pages/PriceAlerts";
import { Profile } from "@/pages/Profile";
import { Watchlist } from "@/pages/Watchlist";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";

// Root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Auth layout route (sidebar + content)
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: AppLayout,
});

// Individual page routes
const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: Dashboard,
});

const marketsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/markets",
  component: Markets,
});

const portfolioRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/portfolio",
  component: Portfolio,
});

const historyRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/history",
  component: History,
});

const watchlistRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/watchlist",
  component: Watchlist,
});

const paymentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/payments",
  component: Payments,
});

const chartsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/charts",
  component: Charts,
});

const kycRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/kyc",
  component: KYC,
});

const kycAdminRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/kyc-admin",
  component: KYCAdmin,
});

const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/profile",
  component: Profile,
});

const alertsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/alerts",
  component: PriceAlerts,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

const routeTree = rootRoute.addChildren([
  appRoute.addChildren([
    dashboardRoute,
    marketsRoute,
    chartsRoute,
    portfolioRoute,
    historyRoute,
    watchlistRoute,
    alertsRoute,
    kycRoute,
    kycAdminRoute,
    paymentsRoute,
    profileRoute,
  ]),
  loginRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
