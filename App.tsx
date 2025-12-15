import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { OrderProvider } from "./contexts/OrderContext";
import { CustomerProvider } from "./contexts/CustomerContext";
import { AuthProvider } from "./contexts/AuthContext";
import OfflineDetector from "./components/OfflineDetector";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import DashboardPage from "./pages/Dashboard/index";
import OrdersPage from "./pages/Orders/index";
import TransactionsPage from "./pages/Transactions/index";
import InventoryPage from "./pages/Inventory/index";
import StoragePage from "./pages/Storage/index";
import CustomersPage from "./pages/Customers/index";
import UsersPage from "./pages/Users/index";
import SettingsPage from "./pages/Settings/index";
import LoginPage from "./pages/Login/index";
import { routes } from "./config/routes";
import { Toaster } from "react-hot-toast";

// Map routes to components
const routeComponents: Record<string, React.ComponentType> = {
  '/': DashboardPage,
  '/orders': OrdersPage,
  '/transactions': TransactionsPage,
  '/inventory': InventoryPage,
  '/storage': StoragePage,
  '/customers': CustomersPage,
  '/users': UsersPage,
  '/settings': SettingsPage,
};

const App: React.FC = () => {
  return (
    <OfflineDetector>
      <HashRouter>
        <AuthProvider>
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
                    <Route path="inventory" element={
                      <RoleBasedRoute requiredRole={routes.find(r => r.path === '/inventory')?.roles}>
                        <InventoryPage />
                      </RoleBasedRoute>
                    } />
                    <Route path="storage" element={
                      <RoleBasedRoute requiredRole={routes.find(r => r.path === '/storage')?.roles}>
                        <StoragePage />
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
                    <Route path="settings" element={
                      <RoleBasedRoute requiredRole={routes.find(r => r.path === '/settings')?.roles}>
                        <SettingsPage />
                      </RoleBasedRoute>
                    } />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </CustomerProvider>
            </OrderProvider>
          </LanguageProvider>
        </AuthProvider>
      </HashRouter>
      <Toaster position="top-center" reverseOrder={false} />
    </OfflineDetector>
  );
};

export default App;