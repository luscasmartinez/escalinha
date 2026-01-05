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
  Timestamp,
  writeBatch 
} from 'firebase/firestore';
import { db, Schedule, Employee } from '../lib/firebase';
import { employeeService } from './employeeService';

const schedulesCollection = 'schedules';

export type ScheduleWithEmployees = Schedule & {
  external_employee1?: Employee;
  external_employee2?: Employee;
  internal_employee?: Employee;
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

// Helper para converter documento Firestore para Schedule
const docToSchedule = (docSnap: any): Schedule => {
  const data = docSnap.data ? docSnap.data() : docSnap;
  return {
    id: docSnap.id,
    schedule_date: data.schedule_date,
    day_type: data.day_type,
    external_employee1_id: data.external_employee1_id || null,
    external_employee2_id: data.external_employee2_id || null,
    internal_employee_id: data.internal_employee_id || null,
    manual_edit: data.manual_edit || false,
    last_edited_by: data.last_edited_by || null,
    last_edited_at: data.last_edited_at ? convertTimestamp(data.last_edited_at) : null,
    created_at: convertTimestamp(data.created_at),
    updated_at: convertTimestamp(data.updated_at),
  };
};

// Helper para buscar employees e anexar aos schedules
const attachEmployees = async (schedules: Schedule[]): Promise<ScheduleWithEmployees[]> => {
  const employeeIds = new Set<string>();
  schedules.forEach(s => {
    if (s.external_employee1_id) employeeIds.add(s.external_employee1_id);
    if (s.external_employee2_id) employeeIds.add(s.external_employee2_id);
    if (s.internal_employee_id) employeeIds.add(s.internal_employee_id);
  });

  const employeesMap = new Map<string, Employee>();
  if (employeeIds.size > 0) {
    const allEmployees = await employeeService.getAll();
    allEmployees.forEach(emp => {
      if (employeeIds.has(emp.id)) {
        employeesMap.set(emp.id, emp);
      }
    });
  }

  return schedules.map(s => ({
    ...s,
    external_employee1: s.external_employee1_id ? employeesMap.get(s.external_employee1_id) : undefined,
    external_employee2: s.external_employee2_id ? employeesMap.get(s.external_employee2_id) : undefined,
    internal_employee: s.internal_employee_id ? employeesMap.get(s.internal_employee_id) : undefined,
  }));
};

export const scheduleService = {
  async getByDateRange(startDate: string, endDate: string): Promise<ScheduleWithEmployees[]> {
    // Usar apenas um where para evitar índice composto, filtrar o restante no cliente
    const q = query(
      collection(db, schedulesCollection),
      where('schedule_date', '>=', startDate),
      orderBy('schedule_date')
    );
    const querySnapshot = await getDocs(q);
    const schedules = querySnapshot.docs
      .map(docToSchedule)
      .filter(s => s.schedule_date <= endDate); // Filtrar endDate no cliente
    return attachEmployees(schedules);
  },

  async getByMonth(year: number, month: number): Promise<ScheduleWithEmployees[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.getByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  },

  async create(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<Schedule> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, schedulesCollection), {
      ...schedule,
      manual_edit: schedule.manual_edit || false,
      created_at: now,
      updated_at: now,
    });
    
    const newDocSnap = await getDoc(docRef);
    if (!newDocSnap.exists()) {
      throw new Error('Failed to create schedule');
    }
    return docToSchedule(newDocSnap);
  },

  async createMany(schedules: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>[]): Promise<Schedule[]> {
    const batch = writeBatch(db);
    const now = Timestamp.now();
    const docRefs: any[] = [];

    schedules.forEach(schedule => {
      const docRef = doc(collection(db, schedulesCollection));
      docRefs.push(docRef);
      batch.set(docRef, {
        ...schedule,
        manual_edit: schedule.manual_edit || false,
        created_at: now,
        updated_at: now,
      });
    });

    await batch.commit();
    
    // Buscar documentos criados
    const createdSchedules: Schedule[] = [];
    for (const docRef of docRefs) {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        createdSchedules.push(docToSchedule(docSnap));
      }
    }
    
    return createdSchedules;
  },

  async update(id: string, updates: Partial<Schedule>, editedBy?: string): Promise<Schedule> {
    const scheduleRef = doc(db, schedulesCollection, id);
    const updateData: any = {
      ...updates,
      updated_at: Timestamp.now(),
    };

    if (editedBy) {
      updateData.manual_edit = true;
      updateData.last_edited_by = editedBy;
      updateData.last_edited_at = Timestamp.now();
    }

    await updateDoc(scheduleRef, updateData);
    
    const updatedDocSnap = await getDoc(scheduleRef);
    if (!updatedDocSnap.exists()) {
      throw new Error('Schedule not found');
    }
    return docToSchedule(updatedDocSnap);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, schedulesCollection, id));
  },

  async deleteByDateRange(startDate: string, endDate: string): Promise<void> {
    const q = query(
      collection(db, schedulesCollection),
      where('schedule_date', '>=', startDate),
      where('schedule_date', '<=', endDate)
    );
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    
    await batch.commit();
  }
};
