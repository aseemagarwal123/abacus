export interface Centre {
  id: string;
  name: string;
  email: string;
  location: string;
  status: 'active' | 'inactive';
}

export interface Student {
  id: string;
  name: string;
  email: string;
  centreId: string;
  level: number;
  progress: number;
  status: 'active' | 'inactive';
  lastActive: string;
  completedTests: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface Question {
  uuid: string;
  text: string;
  order: number;
  marks: number;
}

export interface Section {
  uuid: string;
  section_type: string;
  order: number;
  questions: Question[];
}

export interface Test {
  uuid: string;
  title: string;
  level: number;
  level_uuid: string;
  duration_minutes: number;
  duration_remaining: number;
  sections: Section[];
  due_date: string | null;
  created_at: string;
  completed: boolean;
}

export interface Level {
  uuid: string;
  name: string;
  number: number;
} 