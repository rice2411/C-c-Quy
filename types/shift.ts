/** Ca làm định nghĩa (cố định, seed 3 ca ở BE). */
export interface WorkShift {
  code: string; // 'ca1' | 'ca2' | 'ca3'
  name: string;
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
  congFactor: number; // 1 ca = ? công
  sortOrder: number;
  active: boolean;
}

/** 1 nhân viên được xếp vào 1 ca của 1 ngày (kế hoạch). */
export interface ShiftAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  workDate: string; // ISO yyyy-mm-dd
  shiftCode: string;
  note: string | null;
}

/** Đặt trọn danh sách NV cho 1 (ngày, ca). */
export interface SetDayInput {
  workDate: string; // yyyy-mm-dd
  shiftCode: string;
  employeeIds: string[];
}
