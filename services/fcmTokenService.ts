///mange FCM TOKEN
import { collection,  addDoc} from 'firebase/firestore';
import { db } from '../config/firebase';


export const addFcmToken = async (token: string): Promise<void> => {
  try {
    const fcmTokensRef = collection(db, 'fcmTokens');
    await addDoc(fcmTokensRef, { token });
  } catch (error) {
    console.error("Error adding FCM token:", error);
  }
};