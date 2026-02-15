import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'System role ID' })
  roleId?: number;

  @ApiPropertyOptional({ description: 'Whether the user is active' })
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Admin notes about the user' })
  notes?: string | null;
}

export class AddUserToTeamDto {
  @ApiProperty({ description: 'Team ID' })
  teamId!: number;

  @ApiProperty({
    description: 'Team role: owner or member',
    enum: ['owner', 'member'],
  })
  role!: 'owner' | 'member';

  @ApiPropertyOptional({ description: 'Admin notes for audit trail' })
  notes?: string;
}

export class UpdateUserTeamRoleDto {
  @ApiProperty({
    description: 'Team role: owner or member',
    enum: ['owner', 'member'],
  })
  role!: 'owner' | 'member';

  @ApiPropertyOptional({ description: 'Admin notes for audit trail' })
  notes?: string;
}

export class TransferActivitiesDto {
  @ApiProperty({ description: 'User ID to transfer activities to' })
  targetUserId!: number;

  @ApiPropertyOptional({
    description:
      'Specific activity IDs to transfer. Omit or empty to transfer all.',
    type: [Number],
  })
  activityIds?: number[];

  @ApiProperty({
    description: 'Transfer lead comms contact (isLead=true) assignments',
  })
  transferCommsLead!: boolean;

  @ApiProperty({
    description: 'Transfer comms contact (isLead=false) assignments',
  })
  transferCommsContact!: boolean;

  @ApiPropertyOptional({ description: 'Admin notes for audit trail' })
  notes?: string;
}
