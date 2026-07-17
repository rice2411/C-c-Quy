import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import Spinner from "./components/ui/Spinner";
// Lazy-load từng trang → mỗi trang là 1 chunk JS riêng, chỉ tải khi vào (giảm bundle đầu).
const DashboardPage = lazy(() => import("./pages/Dashboard/index"));
const OrdersPage = lazy(() => import("./pages/Orders/index"));
const TxOverviewPage = lazy(() => import("./pages/Transactions/OverviewPage"));
const TxHistoryPage = lazy(() => import("./pages/Transactions/HistoryPage"));
const TxReconciliationPage = lazy(() => import("./pages/Transactions/ReconciliationPage"));
const PromotionsPage = lazy(() => import("./pages/Promotions/index"));
const CommissionPage = lazy(() => import("./pages/Commission/index"));
const CommissionSettingsPage = lazy(() => import("./pages/Commission/SettingsPage"));
const CommissionGuidePage = lazy(() => import("./pages/Commission/GuidePage"));
const MyCommissionPage = lazy(() => import("./pages/MyCommission/index"));
const InventoryPage = lazy(() => import("./pages/Storage/index"));
const ProductDetailPage = lazy(() => import("./pages/Storage/product/ProductDetailPage"));
const StockHubPage = lazy(() => import("./pages/StockHub/index"));
const SuppliersPage = lazy(() => import("./pages/Suppliers/index"));
const ExpensesPage = lazy(() => import("./pages/Expenses/index"));
const CustomersPage = lazy(() => import("./pages/Customers/index"));
const UsersPage = lazy(() => import("./pages/Users/index"));
const SystemTrafficPage = lazy(() => import("./pages/System/Traffic/index"));
const SystemLogsPage = lazy(() => import("./pages/System/Requests/index"));
const SystemErrorsPage = lazy(() => import("./pages/System/Errors/index"));
const SystemHealthPage = lazy(() => import("./pages/System/Health/index"));
const NotificationsPage = lazy(() => import("./pages/Notifications/index"));
const ScreenVisibilityTab = lazy(() => import("./pages/Settings/ScreenVisibilityTab"));
const ZaloSettingsTab = lazy(() => import("./pages/Settings/ZaloSettingsTab"));
const OrderSettingsTab = lazy(() => import("./pages/Settings/OrderSettingsTab"));
const SepaySettingsTab = lazy(() => import("./pages/Settings/SepaySettingsTab"));
const ProductSettings = lazy(() => import("./pages/Settings/ProductSettings"));
const LoginPage = lazy(() => import("./pages/Login/index"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallback/index"));
const SerpApiMapsTestPage = lazy(() => import("./pages/Test/SerpApiMaps/index"));
import { routes } from "./config/routes";

const PageLoader: React.FC = () => (
  <div className="flex h-full min-h-[40vh] items-center justify-center">
    <Spinner size="lg" textClassName="text-primary-500" />
  </div>
);

/**
 * Bảng route của app — tách khỏi App.tsx (App.tsx chỉ còn provider tree + HashRouter + Toaster).
 * Giữ nguyên 100% route + phân quyền RoleBasedRoute + redirect như trước (no-visual-change).
 */
const AppRoutes: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route
        index
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/")?.roles}>
            <DashboardPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="orders"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/orders")?.roles}>
            <OrdersPage />
          </RoleBasedRoute>
        }
      />
      {/* Tài chính — 3 sub-screen riêng (nhóm menu "Tài chính") */}
      <Route
        path="finance/overview"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/finance/overview")?.roles}>
            <TxOverviewPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="finance/history"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/finance/history")?.roles}>
            <TxHistoryPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="finance/reconciliation"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/finance/reconciliation")?.roles}>
            <TxReconciliationPage />
          </RoleBasedRoute>
        }
      />
      {/* Back-compat redirect các path cũ */}
      <Route path="finance" element={<Navigate to="/finance/overview" replace />} />
      <Route path="finance/transactions" element={<Navigate to="/finance/history" replace />} />
      <Route path="revenue" element={<Navigate to="/finance/overview" replace />} />
      <Route path="finance/cashflow" element={<Navigate to="/finance/history" replace />} />
      <Route path="transactions" element={<Navigate to="/finance/history" replace />} />
      <Route
        path="promotions"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/promotions")?.roles}>
            <PromotionsPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="commission"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/commission")?.roles}>
            <CommissionPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="commission-settings"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/commission-settings")?.roles}>
            <CommissionSettingsPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="my-commission"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/my-commission")?.roles}>
            <MyCommissionPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="commission-guide"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/commission-guide")?.roles}>
            <CommissionGuidePage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="storage"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/storage")?.roles}>
            <InventoryPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="storage/product/:id"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/storage")?.roles}>
            <ProductDetailPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="stock-receipts"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/stock-receipts")?.roles}>
            <StockHubPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="expenses"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/expenses")?.roles}>
            <ExpensesPage />
          </RoleBasedRoute>
        }
      />
      {/* NCC + NVL giờ là tab trong Nhập kho — giữ link cũ redirect sang tab tương ứng. */}
      <Route
        path="suppliers"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/suppliers")?.roles}>
            <SuppliersPage />
          </RoleBasedRoute>
        }
      />
      <Route path="materials" element={<Navigate to="/stock-receipts?tab=materials" replace />} />
      {/* Back-compat redirect path cũ */}
      <Route path="bill-import" element={<Navigate to="/stock-receipts" replace />} />
      <Route
        path="customers"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/customers")?.roles}>
            <CustomersPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="users"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/users")?.roles}>
            <UsersPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="system/traffic"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/system/traffic")?.roles}>
            <SystemTrafficPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="system/logs"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/system/logs")?.roles}>
            <SystemLogsPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="system/errors"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/system/errors")?.roles}>
            <SystemErrorsPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="system/health"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/system/health")?.roles}>
            <SystemHealthPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="notifications"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/notifications")?.roles}>
            <NotificationsPage />
          </RoleBasedRoute>
        }
      />
      <Route path="settings" element={<Navigate to="/settings/screens" replace />} />
      <Route
        path="settings/screens"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/settings/screens")?.roles}>
            <ScreenVisibilityTab />
          </RoleBasedRoute>
        }
      />
      <Route
        path="settings/zalo"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/settings/zalo")?.roles}>
            <ZaloSettingsTab />
          </RoleBasedRoute>
        }
      />
      <Route
        path="settings/order"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/settings/order")?.roles}>
            <OrderSettingsTab />
          </RoleBasedRoute>
        }
      />
      <Route
        path="settings/sepay"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/settings/sepay")?.roles}>
            <SepaySettingsTab />
          </RoleBasedRoute>
        }
      />
      <Route
        path="settings/product"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/settings/product")?.roles}>
            <ProductSettings />
          </RoleBasedRoute>
        }
      />
      {/* Back-compat: các path cũ đã gộp vào "Cài đặt sản phẩm" */}
      <Route path="settings/badges" element={<Navigate to="/settings/product" replace />} />
      <Route path="settings/categories" element={<Navigate to="/settings/product" replace />} />
      <Route path="settings/flavors" element={<Navigate to="/settings/product" replace />} />
      <Route path="test/serpapi-maps" element={<SerpApiMapsTestPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
  </Suspense>
);

export default AppRoutes;
