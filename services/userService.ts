import { doc, setDoc, getDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '@/config/firebase';
import { UserData, UserRole, UserStatus } from '@/types/user';

/**
 * Kiểm tra xem user với email đã tồn tại trong Firestore chưa
 * @param email - Email của user cần kiểm tra
 * @returns UserData nếu tồn tại, null nếu không
 */
export const getUserByEmail = async (email: string | null): Promise<UserData | null> => {
  if (!email) return null;

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return doc.data() as UserData;
    }

    return null;
  } catch (error) {
    console.error('Error checking user by email:', error);
    return null;
  }
};

/**
 * Kiểm tra xem user với UID đã tồn tại trong Firestore chưa
 * @param uid - UID của user cần kiểm tra
 * @returns UserData nếu tồn tại, null nếu không
 */
export const getUserByUid = async (uid: string): Promise<UserData | null> => {
  if (!uid) return null;
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    }

    return null;
  } catch (error) {
    console.error('Error checking user by UID:', error);
    return null;
  }
};

/**
 * Lưu hoặc cập nhật thông tin user vào Firestore
 * Nếu user đã tồn tại (theo email hoặc UID) thì chỉ lấy thông tin, không save
 * Nếu user chưa tồn tại thì mới save mới
 * @param user - User object từ Firebase Auth
 * @returns UserData từ Firestore
 */
export const saveUserToFirestore = async (user: User): Promise<UserData> => {
  try {
    // Kiểm tra xem user đã tồn tại chưa (theo UID hoặc email)
    const existingUserByUid = await getUserByUid(user.uid);
    const existingUserByEmail = user.email ? await getUserByEmail(user.email) : null;

    // Nếu user đã tồn tại, chỉ cập nhật lastLoginAt và return
    if (existingUserByUid || existingUserByEmail) {
      const existingUser = existingUserByUid || existingUserByEmail;
      const userRef = doc(db, 'users', existingUser!.uid);
      
      // Chỉ cập nhật lastLoginAt
      await setDoc(userRef, {
        lastLoginAt: Timestamp.now().toDate().toISOString()
      }, { merge: true });

      return {
        ...existingUser!,
        lastLoginAt: Timestamp.now().toDate().toISOString()
      };
    }

    // Nếu user chưa tồn tại, tạo mới với status pending
    const userRef = doc(db, 'users', user.uid);
    const now = Timestamp.now().toDate().toISOString();

    const userData: UserData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      status: UserStatus.PENDING, // Mặc định là pending, cần admin phê duyệt
      createdAt: now,
      lastLoginAt: now,
      role: UserRole.COLABORATOR,
    };

    await setDoc(userRef, userData);

    return userData;
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
    throw error;
  }
};

/**
 * Lấy tất cả users từ Firestore
 * @returns Mảng UserData
 */
export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id
    } as UserData));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

/**
 * Cập nhật status của user
 * @param uid - UID của user
 * @param status - Status mới
 */
export const updateUserStatus = async (uid: string, status: UserStatus): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { status }, { merge: true });
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

/**
 * Cập nhật customName của user
 * @param uid - UID của user
 * @param customName - Tên gợi nhớ mới
 */
export const updateUserCustomName = async (uid: string, customName: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { customName }, { merge: true });
  } catch (error) {
    console.error('Error updating user custom name:', error);
    throw error;
  }
};

/**
 * Cập nhật role của user
 * @param uid - UID của user
 * @param role - Role mới
 */
export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { role }, { merge: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};