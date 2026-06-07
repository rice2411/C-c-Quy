import { apiClient } from '@/services/api/client';
import { Customer } from '@/types';

export const fetchCustomers = async (): Promise<Customer[]> => {
  const res = await apiClient.get<Customer[]>('/customers');
  return res.data;
};

export const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<void> => {
  await apiClient.post('/customers', customerData);
};

export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<void> => {
  await apiClient.patch(`/customers/${id}`, customerData);
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await apiClient.delete(`/customers/${id}`);
};
