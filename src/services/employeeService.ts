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
import { db, Employee } from '../lib/firebase';

const employeesCollection = 'employees';

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

// Helper para converter documento Firestore para Employee
const docToEmployee = (docSnap: any): Employee => {
  const data = docSnap.data ? docSnap.data() : docSnap;
  return {
    id: docSnap.id,
    name: data.name,
    team_type: data.team_type,
    status: data.status,
    created_at: convertTimestamp(data.created_at),
    updated_at: convertTimestamp(data.updated_at),
  };
};

export const employeeService = {
  async getAll(): Promise<Employee[]> {
    const q = query(collection(db, employeesCollection), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToEmployee);
  },

  async getActive(): Promise<Employee[]> {
    // Buscar todos e filtrar/ordenar no cliente para evitar índice composto
    // (alternativa: criar índice composto no Firestore: status + name)
    const q = query(collection(db, employeesCollection));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(docToEmployee)
      .filter(emp => emp.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getByTeamType(teamType: 'external' | 'internal'): Promise<Employee[]> {
    // Buscar todos e filtrar/ordenar no cliente para evitar índice composto
    const q = query(collection(db, employeesCollection));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(docToEmployee)
      .filter(emp => emp.status === 'active' && emp.team_type === teamType)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async create(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, employeesCollection), {
      ...employee,
      created_at: now,
      updated_at: now,
    });
    
    const newDocSnap = await getDoc(docRef);
    if (!newDocSnap.exists()) {
      throw new Error('Failed to create employee');
    }
    return docToEmployee(newDocSnap);
  },

  async update(id: string, updates: Partial<Employee>): Promise<Employee> {
    const employeeRef = doc(db, employeesCollection, id);
    await updateDoc(employeeRef, {
      ...updates,
      updated_at: Timestamp.now(),
    });
    
    const updatedDocSnap = await getDoc(employeeRef);
    if (!updatedDocSnap.exists()) {
      throw new Error('Employee not found');
    }
    return docToEmployee(updatedDocSnap);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, employeesCollection, id));
  }
};
