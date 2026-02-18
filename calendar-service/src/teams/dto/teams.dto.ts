import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ description: 'Internal team name', maxLength: 255 })
  name!: string;

  @ApiPropertyOptional({ description: 'Display name', maxLength: 255 })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Team description' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Display order (lower first)',
    default: 0,
  })
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the team is active',
    default: true,
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Ministry UUIDs to associate with the team',
    type: [String],
    isArray: true,
  })
  ministryIds?: string[];

  @ApiPropertyOptional({
    description: 'Notes for audit trail (stored in team history)',
  })
  notes?: string;
}

export class UpdateTeamDto {
  @ApiPropertyOptional({ description: 'Internal team name', maxLength: 255 })
  name?: string;

  @ApiPropertyOptional({ description: 'Display name', maxLength: 255 })
  displayName?: string;

  @ApiPropertyOptional({ description: 'Team description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Display order (lower first)' })
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Whether the team is active' })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Ministry UUIDs to set on the team (replaces current list)',
    type: [String],
    isArray: true,
  })
  ministryIds?: string[];

  @ApiPropertyOptional({
    description: 'Notes for audit trail (stored in team history)',
  })
  notes?: string;
}
