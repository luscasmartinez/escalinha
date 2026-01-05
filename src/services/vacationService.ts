import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db, Vacation, Employee } from '../lib/firebase';
import { employeeService } from './employeeService';

const vacationsCollection = 'vacations';

export type VacationWithEmployee = Vacation & {
  employee?: Employee;
};

// Helper para converter Firestore timestamp para ISO string
const convertTimestamp = (timestamp: any): string => {
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return timestamp || new Date().toISOString();
};

// Helper para converter documento Firestore para Vacation
const docToVacation = (docSnap: any): Vacation => {
  const data = docSnap.data ? docSnap.data() : docSnap;
  return {
    id: docSnap.id,
    employee_id: data.employee_id,
    start_date: data.start_date,
    end_date: data.end_date,
    created_at: convertTimestamp(data.created_at),
    updated_at: convertTimestamp(data.updated_at),
  };
};

// Helper para anexar employee aos vacations
const attachEmployee = async (vacations: Vacation[]): Promise<VacationWithEmployee[]> => {
  const employeeIds = new Set(vacations.map(v => v.employee_id));
  const employeesMap = new Map<string, Employee>();
  
  if (employeeIds.size > 0) {
    const allEmployees = await employeeService.getAll();
    allEmployees.forEach(emp => {
      if (employeeIds.has(emp.id)) {
        employeesMap.set(emp.id, emp);
      }
    });
  }

  return vacations.map(v => ({
    ...v,
    employee: employeesMap.get(v.employee_id),
  }));
};

export const vacationService = {
  async getAll(): Promise<VacationWithEmployee[]> {
    const q = query(collection(db, vacationsCollection), orderBy('start_date'));
    const querySnapshot = await getDocs(q);
    const vacations = querySnapshot.docs.map(docToVacation);
    return attachEmployee(vacations);
  },

  async getByEmployee(employeeId: string): Promise<Vacation[]> {
    const q = query(
      collection(db, vacationsCollection),
      where('employee_id', '==', employeeId),
      orderBy('start_date')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToVacation);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<VacationWithEmployee[]> {
    const q = query(
      collection(db, vacationsCollection),
      where('start_date', '<=', endDate),
      orderBy('start_date')
    );
    const querySnapshot = await getDocs(q);
    // Filtrar no cliente pois Firestore não suporta range queries complexas facilmente
    const vacations = querySnapshot.docs
      .map(docToVacation)
      .filter(v => v.start_date <= endDate && v.end_date >= startDate);
    return attachEmployee(vacations);
  },

  async getActiveVacationsByDate(date: string): Promise<Vacation[]> {
    const q = query(
      collection(db, vacationsCollection),
      where('start_date', '<=', date),
      orderBy('start_date')
    );
    const querySnapshot = await getDocs(q);
    // Filtrar no cliente
    return querySnapshot.docs
      .map(docToVacation)
      .filter(v => v.start_date <= date && v.end_date >= date);
  },

  async isEmployeeOnVacation(employeeId: string, date: string): Promise<boolean> {
    const q = query(
      collection(db, vacationsCollection),
      where('employee_id', '==', employeeId),
      where('start_date', '<=', date)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(docToVacation)
      .some(v => v.start_date <= date && v.end_date >= date);
  },

  async create(vacation: Omit<Vacation, 'id' | 'created_at' | 'updated_at'>): Promise<Vacation> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, vacationsCollection), {
      ...vacation,
      created_at: now,
      updated_at: now,
    });
    
    const newDocSnap = await getDoc(docRef);
    if (!newDocSnap.exists()) {
      throw new Error('Failed to create vacation');
    }
    return docToVacation(newDocSnap);
  },

  async update(id: string, updates: Partial<Vacation>): Promise<Vacation> {
    const vacationRef = doc(db, vacationsCollection, id);
    await updateDoc(vacationRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
    
    const updatedDocSnap = await getDoc(vacationRef);
    if (!updatedDocSnap.exists()) {
      throw new Error('Vacation not found');
    }
    return docToVacation(updatedDocSnap);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, vacationsCollection, id));
  }
};
