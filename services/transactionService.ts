import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Transaction } from '@types';

export const fetchTransactions = async (): Promise<Transaction[]> => {
  try {
    const transactionsRef = collection(db, 'transactions');
    // Attempt to sort by transactionDate descending
    const q = query(transactionsRef, orderBy('transactionDate', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Helper to handle dates safely
      const getDateStr = (val: any) => {
        if (!val) return new Date().toISOString();
        if (val.toDate && typeof val.toDate === 'function') {
          return val.toDate().toISOString();
        }
        return String(val);
      };

      return {
        id: doc.id,
        accountNumber: data.accountNumber || '',
        accumulated: Number(data.accumulated) || 0,
        code: data.code || null,
        content: data.content || '',
        createdAt: getDateStr(data.createdAt),
        description: data.description || '',
        gateway: data.gateway || '',
        orderNumber: data.orderNumber || '',
        receivedAt: getDateStr(data.receivedAt),
        referenceCode: data.referenceCode || '',
        sepayId: Number(data.sepayId) || 0,
        subAccount: data.subAccount || '',
        transactionDate: getDateStr(data.transactionDate),
        transferAmount: Number(data.transferAmount) || 0,
        transferType: data.transferType || 'in'
      } as Transaction;
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    // Fallback if index is missing or other error
    try {
        const snapshot = await getDocs(collection(db, 'transactions'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Transaction));
    } catch (e) {
        return [];
    }
  }
};
