# Database Migrations

This directory contains TypeORM migrations for managing database schema changes.

## Migration Strategy

This project uses TypeORM migrations instead of `synchronize: true` for production deployments to ensure:
- Controlled schema changes
- Version control for database schema
- Rollback capability
- Production safety

## Configuration

Migrations are configured via `src/data-source.ts` which is used by TypeORM CLI.

## Available Commands

### Generate Migration from Entity Changes
```bash
npm run migration:generate -- src/migrations/MigrationName
```
This compares your entities with the current database schema and generates a migration file.

### Create Empty Migration
```bash
npm run migration:create -- src/migrations/MigrationName
```
Creates an empty migration file for custom SQL.

### Run Pending Migrations
```bash
npm run migration:run
```
Executes all pending migrations.

### Revert Last Migration
```bash
npm run migration:revert
```
Reverts the most recently executed migration.

### Show Migration Status
```bash
npm run migration:show
```
Displays which migrations have been run and which are pending.

## Workflow

### Development
1. Set `DB_SYNCHRONIZE=true` or `NODE_ENV=development` to use auto-sync
2. Make changes to entities
3. Test your changes
4. Generate migration: `npm run migration:generate -- src/migrations/DescriptiveName`
5. Review the generated migration file
6. Commit the migration file to version control

### Production Deployment
1. Ensure `DB_SYNCHRONIZE=false` and `NODE_ENV=production`
2. Run migrations before starting the app: `npm run migration:run`
3. Migrations will also run automatically on app startup in production

## Best Practices

1. **Always review generated migrations** - Ensure they do what you expect
2. **Test migrations on a copy of production data** - Verify no data loss
3. **Use descriptive migration names** - e.g., `AddUserPhoneNumber`, `CreateAuditLogTable`
4. **Never modify existing migrations** - Create a new migration to fix issues
5. **Keep migrations small and focused** - One logical change per migration
6. **Include data migrations when needed** - Don't just alter schema, migrate data too

## Troubleshooting

### Migration Generation Fails
- Ensure database is running and accessible
- Verify `.env` configuration is correct
- Check that entities are properly decorated

### Migration Run Fails
- Check migration SQL for errors
- Verify database permissions
- Review entity definitions for conflicts

### Can't Revert Migration
- Some migrations may not be safely reversible
- Implement proper `down()` methods in custom migrations
- Consider data backup before running destructive migrations
