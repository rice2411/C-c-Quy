import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '@/config/firebase';

/**
 * Check if user is authenticated
 * @returns true if user is authenticated
 */
const checkAuth = (): boolean => {
  return !!auth.currentUser;
};

/**
 * Upload image to Firebase Storage
 * @param file - Image file to upload
 * @param path - Storage path (e.g., 'products/image.jpg')
 * @returns Download URL of the uploaded image
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    if (!checkAuth()) {
      throw new Error('Bạn cần đăng nhập để upload ảnh');
    }
    
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    if (error.code === 'storage/unauthorized') {
      throw new Error('Bạn không có quyền upload ảnh. Vui lòng kiểm tra Firebase Storage rules hoặc đăng nhập lại.');
    }
    if (error.message) {
      throw error;
    }
    throw new Error('Không thể upload ảnh. Vui lòng thử lại.');
  }
};

/**
 * Delete image from Firebase Storage
 * @param imageUrl - Full URL of the image to delete
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) {
      return;
    }
    
    if (!checkAuth()) {
      console.warn('User not authenticated, skipping image deletion');
      return;
    }
    
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    if (!pathMatch) return;
    const decodedPath = decodeURIComponent(pathMatch[1]);
    const imageRef = ref(storage, decodedPath);
    await deleteObject(imageRef);
  } catch (error: any) {
    console.error('Error deleting image:', error);
    if (error.code === 'storage/unauthorized') {
      console.warn('User does not have permission to delete image');
    }
  }
};

/**
 * Generate a unique path for product image
 * @param productId - Product ID (or 'new' for new products)
 * @param fileName - Original file name
 * @returns Storage path
 */
export const getProductImagePath = (productId: string, fileName: string): string => {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop() || 'jpg';
  return `products/${productId || 'new'}_${timestamp}.${extension}`;
};

