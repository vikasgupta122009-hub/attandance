import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { UserProfile, Company, AttendanceRecord, Message } from '../types';

export const firestoreService = {
  // --- User Profiles ---
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, path));
      return snap.exists() ? (snap.data() as UserProfile) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async createUserProfile(profile: UserProfile): Promise<void> {
    const path = `users/${profile.uid}`;
    try {
      await setDoc(doc(db, path), {
        ...profile,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async joinCompany(uid: string, companyCode: string): Promise<void> {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, path), { companyCode });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async getWorkersByCompany(companyCode: string): Promise<UserProfile[]> {
    const path = 'users';
    try {
      const q = query(
        collection(db, path), 
        where('companyCode', '==', companyCode),
        where('role', '==', 'worker')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as UserProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // --- Companies ---
  async getCompany(code: string): Promise<Company | null> {
    const path = `companies/${code}`;
    try {
      const snap = await getDoc(doc(db, path));
      return snap.exists() ? (snap.data() as Company) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async createCompany(company: Company): Promise<void> {
    const path = `companies/${company.code}`;
    try {
      await setDoc(doc(db, path), {
        ...company,
        createdAt: new Date().toISOString()
      });
      // Also update admin's profile with companyCode
      await updateDoc(doc(db, `users/${company.adminUid}`), {
        companyCode: company.code
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // --- Attendance ---
  async markAttendance(record: Omit<AttendanceRecord, 'id' | 'updatedAt'>): Promise<void> {
    const recordId = `${record.userId}_${record.date}`;
    const path = `attendance/${recordId}`;
    try {
      await setDoc(doc(db, path), {
        ...record,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateAttendanceStatus(recordId: string, status: 'Present' | 'Absent', adminUid: string): Promise<void> {
    const path = `attendance/${recordId}`;
    try {
      await updateDoc(doc(db, path), {
        status,
        editedByAdmin: true,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  subscribeToCompanyAttendance(companyCode: string, callback: (records: AttendanceRecord[]) => void) {
    const path = 'attendance';
    const q = query(
      collection(db, path),
      where('companyCode', '==', companyCode),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  subscribeToWorkerAttendance(userId: string, callback: (records: AttendanceRecord[]) => void) {
    const path = 'attendance';
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  // --- Messages ---
  async sendMessage(msg: Omit<Message, 'id' | 'timestamp'>): Promise<void> {
    const path = 'messages';
    try {
      await addDoc(collection(db, path), {
        ...msg,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  subscribeToMessages(companyCode: string, workerId: string | null, callback: (messages: Message[]) => void) {
    const path = 'messages';
    let q;
    if (workerId) {
      // Worker view: messages where they are the specific worker
      q = query(
        collection(db, path),
        where('companyCode', '==', companyCode),
        where('workerId', '==', workerId),
        orderBy('timestamp', 'asc')
      );
    } else {
      // Admin view: all messages in company
      q = query(
        collection(db, path),
        where('companyCode', '==', companyCode),
        orderBy('timestamp', 'asc')
      );
    }
    
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};
