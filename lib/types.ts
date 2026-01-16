export type UserRole = 'admin' | 'supervisor' | 'user';
export type UserStatus = 'active' | 'inactive' | 'pending';
export type DocumentStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'archived' | 'derived';
export type DocumentPriority = 'low' | 'normal' | 'high' | 'urgent';
export type HistoryAction = 'created' | 'viewed' | 'downloaded' | 'derived' | 'edited' | 'status_changed' | 'commented';
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'document';

export interface Company {
  id: string;
  name: string;
  slug?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  position?: string;
  area_id?: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  area?: Area;
  company?: Company;
}

export interface Area {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  // Computed
  user_count?: number;
  document_count?: number;
}

export interface DocumentCategory {
  id: string;
  company_id?: string;
  name: string;
  description?: string;
  is_system: boolean;
  created_at: string;
}

export interface Document {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  category_id?: string;
  category?: string;
  current_area_id?: string;
  current_user_id?: string;
  origin_area_id?: string;
  created_by: string;
  status: DocumentStatus;
  priority: DocumentPriority;
  created_at: string;
  updated_at: string;
  due_date?: string;
  // Joined data
  current_area?: Area;
  current_user?: User;
  origin_area?: Area;
  creator?: User;
}

export interface DocumentHistory {
  id: string;
  document_id: string;
  company_id: string;
  user_id: string;
  action: HistoryAction;
  from_area_id?: string;
  to_area_id?: string;
  from_user_id?: string;
  to_user_id?: string;
  comment?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  // Joined data
  user?: User;
  from_area?: Area;
  to_area?: Area;
  from_user?: User;
  to_user?: User;
}

export interface Notification {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  document_id?: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
  // Joined data
  document?: Document;
}

// Form types
export interface RegisterFormData {
  companyName: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AreaFormData {
  name: string;
  description?: string;
}

export interface UserFormData {
  fullName: string;
  email: string;
  position?: string;
  areaId?: string;
  role: UserRole;
}

export interface DocumentFormData {
  title: string;
  description?: string;
  category: string;
  targetAreaId: string;
  targetUserId?: string;
  priority?: DocumentPriority;
}

export interface DeriveFormData {
  targetAreaId: string;
  targetUserId?: string;
  comment?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalDocuments: number;
  pendingDocuments: number;
  derivedToday: number;
  activeUsers: number;
}
