export interface Person {
  id: string;
  email: string;
  name: string;
  role: 'WORKER' | 'SUPERVISOR' | 'ADMIN' | 'SUPERUSER';
  companyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  nameEs?: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  nameEs?: string;
  description?: string;
  descriptionEs?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkLog {
  id: string;
  personId: string;
  projectId: string;
  clockIn: Date;
  clockOut?: Date;
  location?: string;
  tasksCompleted: any; // JSON array of tasks
  materialsUsed: any; // JSON array of materials
  photos: string[];
  notes?: string;
  notesEs?: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  companyId?: string;
  person?: Person;
  project?: Project;
  company?: Company;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  categoryId?: string | null;
  progressUnit: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Material {
  id: string;
  name: string;
  nameEs?: string;
  description?: string;
  unit: string;
  unitCost?: number; // Decimal in database
  minStockLevel?: number;
  maxStockLevel?: number;
  currentStock: number;
  createdAt: Date;
  updatedAt: Date;
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

// New interfaces for the updated schema
export interface Team {
  id: string;
  name: string;
  nameEs?: string;
  description?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCategory {
  id: string;
  name: string;
  nameEs?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskProgressUpdate {
  id: string;
  taskId: string;
  projectId: string;
  workerId: string;
  assignmentId: string;
  amountCompleted: number;
  additionalAttributes?: string;
  status: string;
  validatedBy?: string;
  validatedAt?: Date;
  validationStatus: string;
  validationComments?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialConsumption {
  id: string;
  taskProgressUpdateId?: string;
  materialId: string;
  projectId?: string;
  quantity: number;
  type: string;
  notes?: string;
  recordedAt: Date;
  recordedBy?: string;
  createdAt: Date;
}

export interface InventoryMovement {
  id: string;
  materialId: string;
  type: string;
  quantity: number;
  unitCost?: number; // Decimal in database
  totalCost?: number; // Decimal in database
  reference?: string;
  notes?: string;
  recordedBy?: string;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReorderRequest {
  id: string;
  materialId: string;
  requestedQuantity: number;
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  orderNumber?: string;
  orderedAt?: Date;
  receivedAt?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
