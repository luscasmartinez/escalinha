import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYhqlAj1FqOyEwVBuJ238k6jvDkkgLRds",
  authDomain: "escala-proj.firebaseapp.com",
  projectId: "escala-proj",
  storageBucket: "escala-proj.firebasestorage.app",
  messagingSenderId: "37570966490",
  appId: "1:37570966490:web:9553025dafe6948377c6e3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Export types (mesmos tipos para manter compatibilidade com o código existente)
export type Employee = {
  id: string;
  name: string;
  team_type: 'external' | 'internal';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type Schedule = {
  id: string;
  schedule_date: string;
  day_type: 'weekday' | 'weekend';
  external_employee1_id: string | null;
  external_employee2_id: string | null;
  internal_employee_id: string | null;
  manual_edit: boolean;
  last_edited_by: string | null;
  last_edited_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Vacation = {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
};

