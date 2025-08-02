export interface User {
  id: string;
  email: string;
  name: string;
  role: 'WORKER' | 'SUPERVISOR' | 'ADMIN' | 'SUPERUSER';
  companyId: string;
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  createdAt: Date;
}

export interface WorkLog {
  id: string;
  userId: string;
  projectId: string;
  clockIn: Date;
  clockOut?: Date;
  location?: string;
  tasksCompleted: string; // JSON array of tasks
  materialsUsed: string; // JSON array of materials
  photos: string[];
  notes?: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  user?: User;
  project?: Project;
}

export interface Task {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  completed: boolean;
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface PhotoData {
  id: string;
  url: string;
  category: 'before' | 'during' | 'after' | 'materials';
  location?: LocationData;
  timestamp: Date;
}
