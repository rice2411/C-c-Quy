/**
 * Chuyển về dạng tiền tệ Việt Nam
 * @param amount - Tiền dạng số
 * @returns Tiền dạng chuỗi
 */
export const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};