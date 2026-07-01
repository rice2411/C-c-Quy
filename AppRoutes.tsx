import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import DashboardPage from "./pages/Dashboard/index";
import OrdersPage from "./pages/Orders/index";
import FinanceOverviewPage from "./pages/Finance/Overview";
import FinanceTransactionsPage from "./pages/Finance/Transactions";
import PromotionsPage from "./pages/Promotions/index";
import CommissionPage from "./pages/Commission/index";
import CommissionSettingsPage from "./pages/Commission/SettingsPage";
import CommissionGuidePage from "./pages/Commission/GuidePage";
import MyCommissionPage from "./pages/MyCommission/index";
import InventoryPage from "./pages/Storage/index";
import ProductDetailPage from "./pages/Storage/product/ProductDetailPage";
import StockReceiptsPage from "./pages/StockReceipts/index";
import SuppliersPage from "./pages/Suppliers/index";
import MaterialsPage from "./pages/Materials/index";
import CustomersPage from "./pages/Customers/index";
import UsersPage from "./pages/Users/index";
import RequestLogsPage from "./pages/Admin/RequestLogs/index";
import NotificationsPage from "./pages/Notifications/index";
import ScreenVisibilityTab from "./pages/Settings/ScreenVisibilityTab";
import ZaloSettingsTab from "./pages/Settings/ZaloSettingsTab";
import OrderSettingsTab from "./pages/Settings/OrderSettingsTab";
import SepaySettingsTab from "./pages/Settings/SepaySettingsTab";
import BadgesTab from "./pages/Settings/BadgesTab";
import CategoriesTab from "./pages/Settings/CategoriesTab";
import LoginPage from "./pages/Login/index";
import SerpApiMapsTestPage from "./pages/Test/SerpApiMaps/index";
import { routes } from "./config/routes";

/**
 * Bảng route của app — tách khỏi App.tsx (App.tsx chỉ còn provider tree + HashRouter + Toaster).
 * Giữ nguyên 100% route + phân quyền RoleBasedRoute + redirect như trước (no-visual-change).
 */
const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
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
            <FinanceOverviewPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="finance/transactions"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/finance/transactions")?.roles}>
            <FinanceTransactionsPage />
          </RoleBasedRoute>
        }
      />
      {/* Back-compat redirect các path cũ */}
      <Route path="finance" element={<Navigate to="/finance/overview" replace />} />
      <Route path="revenue" element={<Navigate to="/finance/overview" replace />} />
      <Route path="finance/cashflow" element={<Navigate to="/finance/transactions" replace />} />
      <Route path="finance/reconciliation" element={<Navigate to="/finance/transactions" replace />} />
      <Route path="transactions" element={<Navigate to="/finance/transactions" replace />} />
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
            <StockReceiptsPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="suppliers"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/suppliers")?.roles}>
            <SuppliersPage />
          </RoleBasedRoute>
        }
      />
      <Route
        path="materials"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/materials")?.roles}>
            <MaterialsPage />
          </RoleBasedRoute>
        }
      />
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
        path="admin/request-logs"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/admin/request-logs")?.roles}>
            <RequestLogsPage />
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
        path="settings/badges"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/settings/badges")?.roles}>
            <BadgesTab />
          </RoleBasedRoute>
        }
      />
      <Route
        path="settings/categories"
        element={
          <RoleBasedRoute requiredRole={routes.find((r) => r.path === "/settings/categories")?.roles}>
            <CategoriesTab />
          </RoleBasedRoute>
        }
      />
      <Route path="test/serpapi-maps" element={<SerpApiMapsTestPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
