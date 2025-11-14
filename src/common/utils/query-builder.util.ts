import { SelectQueryBuilder, Brackets } from 'typeorm';
import { PaginationDto } from '../dto/pagination.dto';
import { FilterOperator } from '../dto/filter.dto';

/**
 * Utility class for building TypeORM queries with pagination, filtering, and search
 */
export class QueryBuilderUtil {
  /**
   * Apply pagination to query
   */
  static applyPagination<T>(
    query: SelectQueryBuilder<T>,
    paginationDto: PaginationDto,
  ): SelectQueryBuilder<T> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    return query;
  }

  /**
   * Apply sorting to query
   */
  static applySorting<T>(
    query: SelectQueryBuilder<T>,
    paginationDto: PaginationDto,
    alias: string,
  ): SelectQueryBuilder<T> {
    const sortBy = paginationDto.sortBy || 'createdAt';
    const sortOrder = paginationDto.sortOrder || 'DESC';

    // Prevent SQL injection by validating sort field
    const safeField = sortBy.replace(/[^a-zA-Z0-9_.]/g, '');

    query.orderBy(`${alias}.${safeField}`, sortOrder);

    return query;
  }

  /**
   * Apply full-text search to query
   * @param searchFields - Array of fields to search in
   */
  static applySearch<T>(
    query: SelectQueryBuilder<T>,
    paginationDto: PaginationDto,
    alias: string,
    searchFields: string[],
  ): SelectQueryBuilder<T> {
    if (!paginationDto.search || searchFields.length === 0) {
      return query;
    }

    const searchTerm = `%${paginationDto.search}%`;

    query.andWhere(
      new Brackets((qb) => {
        searchFields.forEach((field, index) => {
          if (index === 0) {
            qb.where(`LOWER(${alias}.${field}) LIKE LOWER(:searchTerm)`, { searchTerm });
          } else {
            qb.orWhere(`LOWER(${alias}.${field}) LIKE LOWER(:searchTerm)`, { searchTerm });
          }
        });
      }),
    );

    return query;
  }

  /**
   * Apply advanced filters to query
   * Format: field:operator:value
   * Example: role:eq:supervisor, status:in:active,pending
   */
  static applyAdvancedFilters<T>(
    query: SelectQueryBuilder<T>,
    filters: string[] = [],
    alias: string,
  ): SelectQueryBuilder<T> {
    filters.forEach((filter, index) => {
      const [field, operator, value] = filter.split(':');

      if (!field || !operator || !value) {
        return; // Skip invalid filters
      }

      // Sanitize field name
      const safeField = field.replace(/[^a-zA-Z0-9_.]/g, '');
      const paramName = `filter_${index}`;

      switch (operator as FilterOperator) {
        case FilterOperator.EQUALS:
          query.andWhere(`${alias}.${safeField} = :${paramName}`, { [paramName]: value });
          break;

        case FilterOperator.NOT_EQUALS:
          query.andWhere(`${alias}.${safeField} != :${paramName}`, { [paramName]: value });
          break;

        case FilterOperator.GREATER_THAN:
          query.andWhere(`${alias}.${safeField} > :${paramName}`, { [paramName]: value });
          break;

        case FilterOperator.GREATER_THAN_OR_EQUAL:
          query.andWhere(`${alias}.${safeField} >= :${paramName}`, { [paramName]: value });
          break;

        case FilterOperator.LESS_THAN:
          query.andWhere(`${alias}.${safeField} < :${paramName}`, { [paramName]: value });
          break;

        case FilterOperator.LESS_THAN_OR_EQUAL:
          query.andWhere(`${alias}.${safeField} <= :${paramName}`, { [paramName]: value });
          break;

        case FilterOperator.LIKE:
          query.andWhere(`${alias}.${safeField} LIKE :${paramName}`, { [paramName]: `%${value}%` });
          break;

        case FilterOperator.IN:
          const values = value.split(',');
          query.andWhere(`${alias}.${safeField} IN (:...${paramName})`, { [paramName]: values });
          break;
      }
    });

    return query;
  }

  /**
   * Apply date range filter
   */
  static applyDateRange<T>(
    query: SelectQueryBuilder<T>,
    startDate: string | undefined,
    endDate: string | undefined,
    alias: string,
    field: string = 'createdAt',
  ): SelectQueryBuilder<T> {
    if (startDate) {
      query.andWhere(`${alias}.${field} >= :startDate`, { startDate });
    }

    if (endDate) {
      query.andWhere(`${alias}.${field} <= :endDate`, { endDate });
    }

    return query;
  }

  /**
   * All-in-one method to apply pagination, sorting, search, and filters
   */
  static buildQuery<T>(
    query: SelectQueryBuilder<T>,
    paginationDto: PaginationDto,
    alias: string,
    options?: {
      searchFields?: string[];
      advancedFilters?: string[];
      dateRange?: { startDate?: string; endDate?: string; field?: string };
    },
  ): SelectQueryBuilder<T> {
    // Apply search
    if (options?.searchFields && options.searchFields.length > 0) {
      this.applySearch(query, paginationDto, alias, options.searchFields);
    }

    // Apply advanced filters
    if (options?.advancedFilters && options.advancedFilters.length > 0) {
      this.applyAdvancedFilters(query, options.advancedFilters, alias);
    }

    // Apply date range
    if (options?.dateRange) {
      this.applyDateRange(
        query,
        options.dateRange.startDate,
        options.dateRange.endDate,
        alias,
        options.dateRange.field,
      );
    }

    // Apply sorting
    this.applySorting(query, paginationDto, alias);

    // Apply pagination
    this.applyPagination(query, paginationDto);

    return query;
  }
}
