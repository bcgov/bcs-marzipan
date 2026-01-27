import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating or updating a form draft
 */
export class SaveDraftDto {
  @ApiProperty({
    description: 'Type of form being saved (e.g., activity, event, category)',
    example: 'activity',
  })
  formType!: string;

  @ApiPropertyOptional({
    description: 'ID of the entity being edited (null for new items)',
    example: 123,
  })
  entityId?: number;

  @ApiProperty({
    description: 'The incomplete form data (any valid JSON object)',
    example: {
      title: 'Incomplete Event',
      startDate: '2026-01-15',
      summary: 'Work in progress...',
    },
  })
  draftData!: Record<string, any>;
}

/**
 * DTO for draft response
 */
export class DraftResponseDto {
  @ApiProperty({ description: 'Unique identifier for the draft' })
  id!: number;

  @ApiProperty({ description: 'User ID who created the draft' })
  userId!: number;

  @ApiProperty({ description: 'Type of form' })
  formType!: string;

  @ApiPropertyOptional({
    description: 'Entity ID being edited (if applicable)',
  })
  entityId?: number | null;

  @ApiProperty({ description: 'The draft form data' })
  draftData!: Record<string, any>;

  @ApiProperty({ description: 'When the draft was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the draft was last updated' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'When the draft expires' })
  expiresAt?: Date | null;
}

/**
 * DTO for list of drafts response
 */
export class DraftsListResponseDto {
  @ApiProperty({ type: [DraftResponseDto] })
  drafts!: DraftResponseDto[];

  @ApiProperty()
  count!: number;
}
