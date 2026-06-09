/**
 * Cấu hình Firebase client (dùng chung). Chỉ là object thuần, không kéo SDK.
 *
 * Giá trị mặc định là config CLIENT CÔNG KHAI (đằng nào cũng nằm trong bundle JS
 * gửi xuống trình duyệt) → an toàn commit, giúp build tự chứa khi build trên CI
 * runner (không có file .env.production). Vẫn ưu tiên env nếu được set lúc build.
 * Bảo mật thực thi bằng Firebase Auth + quyền ở BE, KHÔNG dựa vào việc giấu key này.
 */
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyAQtMPqZE0A2XMM7bwikMW1EMlmDOdNip8',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'tiembanhcucquy-75fe1.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'tiembanhcucquy-75fe1',
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET || 'tiembanhcucquy-75fe1.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '744823161157',
  appId: process.env.FIREBASE_APP_ID || '1:744823161157:web:695e5dbe4cca0de719fe2c',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-6202LFPC63',
};
