
export enum EntryType {
  WORK = 'WORK',
  ADVANCE = 'ADVANCE',
  OVERTIME = 'OVERTIME'
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  dailyRate: number;
  hourlyRate: number;
  createdAt: number;
}

export interface DailyLog {
  id: string;
  workerId: string;
  date: string;
  taskName: string;
  isPresent: boolean;
  otHours: number;
  otRate: number; // Override default or use default
  advanceAmount: number;
  note: string;
  totalEarnings: number; // Daily + (OT * Rate)
}

export interface AppState {
  workers: Worker[];
  logs: DailyLog[];
  selectedWorkerId: string | null;
}
