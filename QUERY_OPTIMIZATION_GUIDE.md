# TypeORM Query Optimization Guide

This guide documents best practices for optimizing database queries in this NestJS + TypeORM application.

## Performance Optimizations Implemented

### 1. Database Indexes

#### Assignment Entity
- **Composite Index**: `(supervisor_id, status)` - Optimizes queries filtering by supervisor and status
- **Unique Composite Index**: `(exam_id, room_id)` - Ensures one assignment per room per exam, improves lookup performance
- **Composite Index**: `(status, created_at)` - Optimizes listing and sorting by status

#### Attendance Entity
- **Composite Index**: `(exam_id, room_id)` - Optimizes attendance queries by exam and room
- **Single Index**: `(participant_name)` - Improves search performance
- **Composite Index**: `(status, exam_id)` - Optimizes status-based filtering

### 2. Avoiding N+1 Queries

#### Problem Example (Before Optimization)
```typescript
async updateStatus(id: string, status: AssignmentStatus) {
  const assignment = await this.findOne(id);  // Query 1: Load with relations
  assignment.status = status;
  await this.save(assignment);                // Query 2: Save
  return this.findOne(id);                    // Query 3: Load again with relations
}
// Result: 3 queries (2 with joins) for a simple status update
```

#### Solution (After Optimization)
```typescript
async updateStatus(id: string, status: AssignmentStatus) {
  const result = await this.repository.update(id, { status });  // Query 1: Simple UPDATE
  if (result.affected === 0) {
    throw new NotFoundException();
  }
  return this.findOne(id);  // Query 2: Load once with relations
}
// Result: 2 queries (1 simple, 1 with joins)
```

### 3. Query Builder Optimizations

#### Use Pagination Always
```typescript
const queryBuilder = this.repository
  .createQueryBuilder('entity')
  .skip((page - 1) * limit)
  .take(limit);
```

#### Select Only Needed Columns
```typescript
// ❌ Bad: Loads all columns
const users = await this.userRepository.find();

// ✅ Good: Select specific columns
const users = await this.userRepository
  .createQueryBuilder('user')
  .select(['user.id', 'user.name', 'user.email'])
  .getMany();
```

#### Use `leftJoinAndSelect` vs `leftJoin`
```typescript
// Use leftJoinAndSelect when you need the related data
.leftJoinAndSelect('assignment.room', 'room')

// Use leftJoin (without Select) when you only need to filter
.leftJoin('assignment.room', 'room')
.where('room.active = :active', { active: true })
```

### 4. Transaction Patterns

Use the `TransactionUtil` for consistent transaction handling:

```typescript
import { TransactionUtil } from '../common/utils/transaction.util';

// Simple transaction
const result = await TransactionUtil.runInTransaction(
  this.dataSource,
  async (manager) => {
    const user = await manager.save(User, userData);
    const profile = await manager.save(Profile, profileData);
    return { user, profile };
  }
);

// Nested savepoints for partial rollback
await TransactionUtil.savepoint(
  queryRunner,
  'risky_operation',
  async (manager) => {
    // This can be rolled back without affecting parent transaction
    await manager.save(SomeEntity, data);
  }
);
```

### 5. Eager vs Lazy Loading

#### Default: Use Lazy Loading
```typescript
@Entity()
export class Assignment {
  @ManyToOne(() => Room)
  room: Room;  // Lazy loaded by default
}
```

#### Use Eager Loading Sparingly
```typescript
@Entity()
export class Assignment {
  @ManyToOne(() => Room, { eager: true })  // Always loaded
  room: Room;
}
// ⚠️ Warning: Can cause performance issues with nested relations
```

#### Best Practice: Load Relations Explicitly
```typescript
// In service methods, explicitly load what you need
const assignment = await this.repository.findOne({
  where: { id },
  relations: ['room', 'exam'],  // Only these relations
});
```

## Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Loading Full Entity for Simple Updates
```typescript
// BAD: Loads all data and relations just to update one field
const user = await this.userRepository.findOne({ where: { id }, relations: ['profile', 'roles'] });
user.lastLogin = new Date();
await this.userRepository.save(user);
```

**Solution:**
```typescript
// GOOD: Direct update without loading
await this.userRepository.update(id, { lastLogin: new Date() });
```

### ❌ Anti-Pattern 2: N+1 Queries in Loops
```typescript
// BAD: One query per iteration
const assignments = await this.assignmentRepository.find();
for (const assignment of assignments) {
  assignment.room = await this.roomRepository.findOne({ where: { id: assignment.roomId } });
}
```

**Solution:**
```typescript
// GOOD: Load relations in original query
const assignments = await this.assignmentRepository.find({
  relations: ['room']
});
```

### ❌ Anti-Pattern 3: Not Using Indexes
```typescript
// BAD: Frequently queried columns without indexes
@Column()
email: string;  // No index

await this.userRepository.findOne({ where: { email: 'user@example.com' } });
// Result: Full table scan
```

**Solution:**
```typescript
// GOOD: Add index for frequently queried columns
@Index()
@Column()
email: string;

// Or unique constraint (which creates an index)
@Column({ unique: true })
email: string;
```

### ❌ Anti-Pattern 4: Loading Unnecessary Relations
```typescript
// BAD: Loading all relations when only one is needed
const assignment = await this.repository.findOne({
  where: { id },
  relations: ['supervisor', 'room', 'exam', 'violations', 'room.hall', 'room.building']
});
// Just to check status
if (assignment.status === 'completed') { ... }
```

**Solution:**
```typescript
// GOOD: Load only what you need
const assignment = await this.repository.findOne({
  where: { id },
  select: ['id', 'status']  // Only load these columns
});
if (assignment.status === 'completed') { ... }
```

## Performance Monitoring

### Query Logging
Enable query logging in development to identify slow queries:

```typescript
// app.module.ts
TypeOrmModule.forRoot({
  // ...
  logging: process.env.NODE_ENV === 'development',
  logger: 'advanced-console',
});
```

### Measuring Query Performance
```typescript
// Add timing to critical queries
const start = Date.now();
const result = await this.repository.find({ ... });
const duration = Date.now() - start;
this.logger.log(`Query took ${duration}ms`);
```

### Database Query Analysis
Use PostgreSQL's EXPLAIN to analyze query performance:

```sql
EXPLAIN ANALYZE
SELECT * FROM assignments
WHERE supervisor_id = 'uuid'
AND status = 'pending';

-- Look for:
-- - Seq Scan (bad) vs Index Scan (good)
-- - High cost values
-- - Missing indexes
```

## Optimization Checklist

When writing new queries, ensure:

- [ ] Indexed columns are used in WHERE clauses
- [ ] Pagination is implemented for list endpoints
- [ ] Only necessary relations are loaded
- [ ] Simple updates use `repository.update()` instead of `save()`
- [ ] Bulk operations use batch methods
- [ ] Transactions are used for multi-step operations
- [ ] Query logging is enabled in development
- [ ] Complex queries are tested with realistic data volumes

## Best Practices Summary

1. **Index Strategy**: Index foreign keys and frequently queried columns
2. **Update Strategy**: Use `repository.update()` for simple field updates
3. **Loading Strategy**: Explicitly specify relations, avoid eager loading
4. **Transaction Strategy**: Use `TransactionUtil` for consistency
5. **Query Strategy**: Use QueryBuilder for complex queries with proper pagination
6. **Monitoring Strategy**: Enable logging in development, measure query performance

## Additional Resources

- TypeORM Documentation: https://typeorm.io
- PostgreSQL Performance Tips: https://wiki.postgresql.org/wiki/Performance_Optimization
- Database Indexing Guide: https://use-the-index-luke.com

---

**Last Updated**: 2025-11-14
**Status**: Living Document - Update as new patterns emerge
