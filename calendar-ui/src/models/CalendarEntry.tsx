export interface CalendarEntry {
  id?: number;
  title?: string;
  category?: string[]; // extend as needed
  summary?: string;
  executiveSummary?: string;
  startDate?: string; // ISO format "2025-08-18"
  startTime?: string; // "14:30"
  endDate?: string;
  endTime?: string;
  timeframe?: string;
  issue?: string;
  ministry?: string;

  created_on?: string; // ISO timestamp
  updated_on?: string; // ISO timestamp
  created_by?: string;
  updated_by?: string;

  shared_with?: string[];
  assigned_to?: string;

  status?: string;
  deleted_on?: string | null;
  deleted_reason?: string | null;
  restored_on?: string | null;
}
