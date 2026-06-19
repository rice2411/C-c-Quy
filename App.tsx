import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { OrderProvider } from "./contexts/OrderContext";
import { CustomerProvider } from "./contexts/CustomerContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ScreenConfigProvider } from "./contexts/ScreenConfigContext";
import { ShippingConfigProvider } from "./contexts/ShippingConfigContext";
import { useOfflineDetector } from "./hooks/useOfflineDetector";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import DashboardPage from "./pages/Dashboard/index";
import OrdersPage from "./pages/Orders/index";
import TransactionsPage from "./pages/Transactions/index";
import PromotionsPage from "./pages/Promotions/index";
import CommissionPage from "./pages/Commission/index";
import CommissionSettingsPage from "./pages/Commission/SettingsPage";
import CommissionGuidePage from "./pages/Commission/GuidePage";
import MyCommissionPage from "./pages/MyCommission/index";
import InventoryPage from "./pages/Storage/index";
import ProductDetailPage from "./pages/Storage/product/ProductDetailPage";
import BillImportPage from "./pages/BillImport/index";
import CustomersPage from "./pages/Customers/index";
import UsersPage from "./pages/Users/index";
import RequestLogsPage from "./pages/Admin/RequestLogs/index";
import NotificationsPage from "./pages/Notifications/index";
import ScreenVisibilityTab from "./pages/Settings/ScreenVisibilityTab";
import ZaloSettingsTab from "./pages/Settings/ZaloSettingsTab";
import OrderSettingsTab from "./pages/Settings/OrderSettingsTab";
import BadgesTab from "./pages/Settings/BadgesTab";
import CategoriesTab from "./pages/Settings/CategoriesTab";
import LoginPage from "./pages/Login/index";
import SerpApiMapsTestPage from "./pages/Test/SerpApiMaps/index";
import { routes } from "./config/routes";
import { Toaster } from "react-hot-toast";

const App: React.FC = () => {
  const isOffline = useOfflineDetector();
  if (isOffline) return null;

  return (
    <HashRouter>
      <AuthProvider>
        <ScreenConfigProvider>
          <ShippingConfigProvider>
            <LanguageProvider>
              <OrderProvider>
                <CustomerProvider>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }>
                      <Route index element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/')?.roles}>
                          <DashboardPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="orders" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/orders')?.roles}>
                          <OrdersPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="transactions" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/transactions')?.roles}>
                          <TransactionsPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="promotions" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/promotions')?.roles}>
                          <PromotionsPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="commission" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/commission')?.roles}>
                          <CommissionPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="commission-settings" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/commission-settings')?.roles}>
                          <CommissionSettingsPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="my-commission" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/my-commission')?.roles}>
                          <MyCommissionPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="commission-guide" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/commission-guide')?.roles}>
                          <CommissionGuidePage />
                        </RoleBasedRoute>
                      } />
                      <Route path="storage" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/storage')?.roles}>
                          <InventoryPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="storage/product/:id" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/storage')?.roles}>
                          <ProductDetailPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="bill-import" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/bill-import')?.roles}>
                          <BillImportPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="customers" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/customers')?.roles}>
                          <CustomersPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="users" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/users')?.roles}>
                          <UsersPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="admin/request-logs" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/admin/request-logs')?.roles}>
                          <RequestLogsPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="notifications" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/notifications')?.roles}>
                          <NotificationsPage />
                        </RoleBasedRoute>
                      } />
                      <Route path="settings" element={<Navigate to="/settings/screens" replace />} />
                      <Route path="settings/screens" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/settings/screens')?.roles}>
                          <ScreenVisibilityTab />
                        </RoleBasedRoute>
                      } />
                      <Route path="settings/zalo" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/settings/zalo')?.roles}>
                          <ZaloSettingsTab />
                        </RoleBasedRoute>
                      } />
                      <Route path="settings/order" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/settings/order')?.roles}>
                          <OrderSettingsTab />
                        </RoleBasedRoute>
                      } />
                      <Route path="settings/badges" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/settings/badges')?.roles}>
                          <BadgesTab />
                        </RoleBasedRoute>
                      } />
                      <Route path="settings/categories" element={
                        <RoleBasedRoute requiredRole={routes.find(r => r.path === '/settings/categories')?.roles}>
                          <CategoriesTab />
                        </RoleBasedRoute>
                      } />
                      <Route path="test/serpapi-maps" element={<SerpApiMapsTestPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </CustomerProvider>
              </OrderProvider>
            </LanguageProvider>
          </ShippingConfigProvider>
        </ScreenConfigProvider>
      </AuthProvider>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          className: "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl text-sm px-4 py-3",
          iconTheme: { primary: "#4abab9", secondary: "#ffffff" },
          success: { iconTheme: { primary: "#16a34a", secondary: "#ffffff" } },
          error: { iconTheme: { primary: "#dc2626", secondary: "#ffffff" } },
        }}
      />
    </HashRouter>
  );
};

export default App;
