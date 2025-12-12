import { addFcmToken } from "@/services/fcmTokenService";
import { messaging } from "../config/firebase";
import { getToken } from "firebase/messaging";
import toast from "react-hot-toast";

export async function requestPermission() {
  const permission = await Notification.requestPermission();
  toast.success(permission)
  if (permission !== "granted") return null;

  const token = await getToken(messaging, {
    vapidKey: process.env.FIREBASE_VAPID_KEY
  });

  await addFcmToken(token);

  return token;
}
