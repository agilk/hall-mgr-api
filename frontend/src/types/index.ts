// API Response Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// User Types
export type UserRole = 'SUPERVISOR' | 'MANAGER' | 'EXAM_DIRECTOR' | 'ADMIN'

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: UserRole
  phone_number?: string
  is_active: boolean
  twofa_enabled: boolean
  created_at: string
  updated_at: string
}

// Building & Room Types
export interface Building {
  id: number
  name: string
  code: string
  location?: string
  external_id?: string
  sync_status?: string
  created_at: string
  updated_at: string
}

export interface Hall {
  id: number
  building_id: number
  name: string
  code: string
  capacity?: number
  created_at: string
  updated_at: string
  building?: Building
}

export interface Room {
  id: number
  hall_id: number
  building_id: number
  name: string
  code: string
  capacity?: number
  external_id?: string
  created_at: string
  updated_at: string
  hall?: Hall
  building?: Building
}

// Exam Types
export type ExamStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface Exam {
  id: number
  title: string
  exam_code: string
  exam_date: string
  start_time: string
  end_time: string
  status: ExamStatus
  description?: string
  created_at: string
  updated_at: string
}

// Assignment Types
export type AssignmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'

export interface Assignment {
  id: number
  supervisor_id: number
  exam_id: number
  room_id: number
  status: AssignmentStatus
  arrival_time?: string
  departure_time?: string
  notes?: string
  created_at: string
  updated_at: string
  supervisor?: User
  exam?: Exam
  room?: Room
}

// Attendance Types
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE'

export interface Attendance {
  id: number
  exam_id: number
  room_id: number
  participant_id: string
  participant_name: string
  status: AttendanceStatus
  check_in_time?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Violation Types
export type ViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ViolationStatus = 'REPORTED' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'

export interface Violation {
  id: number
  exam_id: number
  room_id: number
  reporter_id: number
  participant_id?: string
  participant_name?: string
  violation_type: string
  description: string
  severity: ViolationSeverity
  status: ViolationStatus
  evidence?: string
  resolution?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

// Chart Types
export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

// Form Types
export interface LoginForm {
  username: string
  password: string
  twofa_code?: string
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  full_name: string
  phone_number?: string
}
