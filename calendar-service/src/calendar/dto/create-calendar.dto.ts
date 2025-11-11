import { IsString, IsOptional, IsArray, IsEnum, IsDateString } from 'class-validator';

export class CreateCalendarDto {
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(['event', 'meeting', 'other'])
  category?: 'event' | 'meeting' | 'other' | 'release';

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  executiveSummary?: string;

  @IsString()
  startDate?: string; // "2025-08-18"

  @IsString()
  startTime?: string; // "14:30"

  @IsString()
  endDate?: string;

  @IsString()
  endTime?: string;

  @IsOptional()
  @IsEnum(['estimated', 'confirmed', 'tentative'])
  timeframe?: 'estimated' | 'confirmed' | 'tentative';

  @IsOptional()
  @IsString()
  issue?: string;

  @IsOptional()
  @IsString()
  ministry?: string;

  @IsOptional()
  @IsString()
  created_by?: string;

  @IsOptional()
  @IsString()
  updated_by?: string;

  @IsOptional()
  @IsArray()
  shared_with?: string[];

  @IsOptional()
  @IsString()
  assigned_to?: string;

  @IsOptional()
  @IsEnum(['active', 'deleted'])
  status?: 'active' | 'deleted';

  @IsOptional()
  @IsDateString()
  deleted_on?: string;

  @IsOptional()
  @IsString()
  deleted_reason?: string;

  @IsOptional()
  @IsDateString()
  restored_on?: string;
}
