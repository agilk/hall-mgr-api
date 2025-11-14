import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Tree,
  TreeParent,
  TreeChildren,
} from 'typeorm';
import { User } from './user.entity';
import { Assignment } from './assignment.entity';

export enum FeedbackType {
  SUPERVISOR_TO_BM = 'supervisor_to_bm',
  SUPERVISOR_TO_EM = 'supervisor_to_em',
  BM_TO_SUPERVISOR = 'bm_to_supervisor',
  EM_TO_SUPERVISOR = 'em_to_supervisor',
}

@Entity('feedbacks')
@Tree('materialized-path')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.feedbackGiven)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'author_id' })
  authorId: string;

  @ManyToOne(() => User, (user) => user.feedbackReceived, { nullable: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @Column({ name: 'recipient_id', nullable: true })
  recipientId: string;

  @ManyToOne(() => Assignment, { nullable: true })
  @JoinColumn({ name: 'assignment_id' })
  assignment: Assignment;

  @Column({ name: 'assignment_id', nullable: true })
  assignmentId: string;

  @Column({
    type: 'enum',
    enum: FeedbackType,
  })
  type: FeedbackType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', nullable: true })
  rating: number; // 1-5 rating

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @TreeParent()
  parentFeedback: Feedback;

  @TreeChildren()
  replies: Feedback[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
