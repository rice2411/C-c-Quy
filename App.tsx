import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { OrderProvider } from './contexts/OrderContext';
import { CustomerProvider } from './contexts/CustomerContext';
import OfflineDetector from './components/OfflineDetector';
import Layout from './components/Layout';
import DashboardPage from './pages/Dashboard/index';
import OrdersPage from './pages/Orders/index';
import TransactionsPage from './pages/Transactions/index';
import InventoryPage from './pages/Inventory/index';
import CustomersPage from './pages/Customers/index';
import SettingsPage from './pages/Settings/index';
import SePayWebhookViewer from './components/SePayWebhookViewer';

const App: React.FC = () => {
  return (
    <OfflineDetector>
      <HashRouter>
        <LanguageProvider>
          <OrderProvider>
            <CustomerProvider>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="sepay-webhook" element={<SePayWebhookViewer />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </CustomerProvider>
          </OrderProvider>
        </LanguageProvider>
      </HashRouter>
    </OfflineDetector>
  );
};

export default App;