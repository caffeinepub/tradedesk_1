import { AppLayout } from "@/components/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import { Charts } from "@/pages/Charts";
import { Dashboard } from "@/pages/Dashboard";
import { History } from "@/pages/History";
import { KYC } from "@/pages/KYC";
import { KYCAdmin } from "@/pages/KYCAdmin";
import { Login } from "@/pages/Login";
import { Markets } from "@/pages/Markets";
import { Payments } from "@/pages/Payments";
import { Portfolio } from "@/pages/Portfolio";
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
  component: () => (
    <>
      <Outlet />
      <Toaster theme="dark" />
    </>
  ),
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
  return <RouterProvider router={router} />;
}
