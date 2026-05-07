export type Role = 'admin' | 'worker';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  companyCode?: string;
  createdAt: string;
}

export interface Company {
  code: string;
  adminUid: string;
  name: string;
  createdAt: string;
}

export type AttendanceStatus = 'Present' | 'Absent';
export type AttendanceMethod = 'Button' | 'QR' | 'Admin Override';

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  companyCode: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  location?: {
    lat: number;
    lng: number;
  };
  method: AttendanceMethod;
  status: AttendanceStatus;
  editedByAdmin?: boolean;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  workerId: string; // The worker involved in this conversation
  companyCode: string;
  text: string;
  timestamp: string;
}
