import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'calendar' })
export class CalendarEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  category!: 'event' | 'meeting' | 'other' | 'release' | 'issue';

  @Column({ nullable: true })
  type!: 'Awareness Date' | 'News Release' | 'Issue' | 'release' | 'issue';

  @Column({ nullable: true })
  summary!: string;

  @Column({ nullable: true })
  executiveSummary!: string;

  @Column({ nullable: true })
  startDate!: string; // ISO date (YYYY-MM-DD)

  @Column({ nullable: true })
  startTime!: string; // HH:mm

  @Column({ nullable: true })
  endDate!: string;

  @Column({ nullable: true })
  endTime!: string;

  @Column({ default: 'tentative' })
  timeframe!: 'estimated' | 'confirmed' | 'tentative';

  @Column({ nullable: true })
  issue!: string;

  @Column({ nullable: true })
  ministry!: string;

  @CreateDateColumn()
  created_on!: Date | undefined;

  @UpdateDateColumn()
  updated_on!: Date | undefined;

  @Column({ nullable: true })
  created_by!: string;

  @Column({ nullable: true })
  updated_by!: string;

  @Column('simple-array', { nullable: true })
  shared_with!: string[];

  @Column({ nullable: true })
  assigned_to!: string;

  @Column({ default: 'active' })
  status!: 'active' | 'deleted' | 'new' | 'changed' | 'reviewed';

  @Column({ nullable: true })
  deleted_on!: Date | undefined;

  @Column({ nullable: true })
  deleted_reason!: string;

  @Column({ nullable: true })
  restored_on!: Date | undefined;
}
