# Advanced Filtering and Search Guide

This guide explains how to use the advanced filtering, pagination, and search capabilities in the Exam Supervision Management API.

## Table of Contents
1. [Pagination](#pagination)
2. [Sorting](#sorting)
3. [Full-Text Search](#full-text-search)
4. [Advanced Filters](#advanced-filters)
5. [Date Range Filters](#date-range-filters)
6. [Query Examples](#query-examples)

## Pagination

All list endpoints support pagination with the following query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 10 | Items per page (max: 100) |

**Example:**
```http
GET /api/v1/users?page=2&limit=20
```

**Response Format:**
```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "totalItems": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

## Sorting

Control the order of results using `sortBy` and `sortOrder` parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sortBy` | string | createdAt | Field to sort by |
| `sortOrder` | enum | DESC | Sort order (ASC or DESC) |

**Example:**
```http
GET /api/v1/users?sortBy=fullName&sortOrder=ASC
```

## Full-Text Search

Use the `search` parameter to perform full-text search across multiple fields:

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search term (case-insensitive) |

The search is performed across predefined fields for each module:

- **Users**: `fullName`, `email`, `phone`, `username`
- **Buildings**: `name`, `address`, `campus`
- **Exams**: `title`, `description`, `examCode`
- **Documents**: `title`, `description`, `fileName`

**Example:**
```http
GET /api/v1/users?search=john
GET /api/v1/documents?search=guidelines
```

## Advanced Filters

Use the `filter` parameter for complex filtering with operators:

**Format:**
```
filter=field:operator:value
```

**Supported Operators:**

| Operator | Code | Description | Example |
|----------|------|-------------|---------|
| Equals | `eq` | Exact match | `filter=role:eq:supervisor` |
| Not Equals | `ne` | Not equal to | `filter=status:ne:inactive` |
| Greater Than | `gt` | Greater than | `filter=capacity:gt:50` |
| Greater Than or Equal | `gte` | >= | `filter=capacity:gte:50` |
| Less Than | `lt` | Less than | `filter=capacity:lt:100` |
| Less Than or Equal | `lte` | <= | `filter=capacity:lte:100` |
| Like | `like` | Partial match | `filter=name:like:hall` |
| In | `in` | Match any value | `filter=status:in:active,pending` |

**Multiple Filters:**

You can apply multiple filters by repeating the `filter` parameter:

```http
GET /api/v1/users?filter=role:eq:supervisor&filter=status:in:active,approved
```

## Date Range Filters

Filter by date ranges using `startDate` and `endDate` parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string (ISO 8601) | Start date (inclusive) |
| `endDate` | string (ISO 8601) | End date (inclusive) |

**Example:**
```http
GET /api/v1/exams?startDate=2025-01-01&endDate=2025-12-31
```

## Query Examples

### Example 1: Find Active Supervisors

```http
GET /api/v1/users?role=supervisor&status=active&sortBy=fullName&sortOrder=ASC&page=1&limit=20
```

### Example 2: Search for Documents with Filters

```http
GET /api/v1/documents?search=exam&filter=type:eq:guideline&filter=visibility:eq:public&sortBy=createdAt&sortOrder=DESC
```

### Example 3: Find Exams in Date Range

```http
GET /api/v1/exams?startDate=2025-11-01&endDate=2025-11-30&status=upcoming&sortBy=scheduledStartTime&sortOrder=ASC
```

### Example 4: Advanced User Filtering

```http
GET /api/v1/users?filter=role:in:supervisor,building_manager&filter=status:eq:active&search=john&page=1&limit=10
```

### Example 5: Combined Filters for Assignments

```http
GET /api/v1/assignments?filter=status:in:pending,accepted&filter=priority:gte:3&sortBy=createdAt&sortOrder=DESC
```

## Module-Specific Filters

### Users Module

**Available Filters:**
- `role` - User role (supervisor, building_manager, exam_director)
- `status` - User status (pending, active, inactive, suspended)
- `buildingId` - Filter by assigned building

**Example:**
```http
GET /api/v1/users?role=supervisor&status=active&buildingId=1
```

### Buildings Module

**Available Filters:**
- `campus` - Campus name or location
- `isActive` - Active status (true/false)

**Example:**
```http
GET /api/v1/buildings?campus=Main Campus&isActive=true
```

### Exams Module

**Available Filters:**
- `status` - Exam status (scheduled, in_progress, completed, cancelled)
- `roomId` - Filter by room
- `buildingId` - Filter by building
- `startDate` / `endDate` - Date range

**Example:**
```http
GET /api/v1/exams?status=scheduled&buildingId=1&startDate=2025-11-01&endDate=2025-11-30
```

### Assignments Module

**Available Filters:**
- `supervisorId` - Filter by supervisor
- `examId` - Filter by exam
- `roomId` - Filter by room
- `status` - Assignment status (pending, accepted, rejected, confirmed, etc.)

**Example:**
```http
GET /api/v1/assignments?supervisorId=5&status=confirmed&examId=EXM-001
```

### Documents Module

**Available Filters:**
- `type` - Document type (guideline, report, form, certificate, photo, other)
- `category` - Document category
- `examId` - Filter by exam
- `buildingId` - Filter by building

**Example:**
```http
GET /api/v1/documents?type=guideline&category=supervision&examId=EXM-001
```

### Violations Module

**Available Filters:**
- `assignmentId` - Filter by assignment
- `isResolved` - Resolution status (true/false)
- `severity` - Severity level (low, medium, high, critical)

**Example:**
```http
GET /api/v1/violations?isResolved=false&severity:in:high,critical
```

### Attendance Module

**Available Filters:**
- `examId` - Filter by exam
- `roomId` - Filter by room
- `status` - Attendance status (present, absent, late, excused)

**Example:**
```http
GET /api/v1/attendance?examId=EXM-001&roomId=101&status=present
```

## Performance Tips

1. **Use Pagination**: Always use pagination for large datasets to reduce load times
2. **Limit Results**: Keep `limit` parameter reasonable (10-50 items)
3. **Specific Filters**: Use specific filters instead of broad searches when possible
4. **Index Fields**: Common filter fields are indexed for faster queries
5. **Avoid Over-Filtering**: Too many filters can slow down queries

## Common Use Cases

### 1. Admin Dashboard - Recent Activity

```http
GET /api/v1/audit-logs?sortBy=createdAt&sortOrder=DESC&limit=50
```

### 2. Supervisor View - My Assignments

```http
GET /api/v1/assignments?supervisorId=5&filter=status:in:pending,accepted,confirmed&sortBy=exam.scheduledStartTime&sortOrder=ASC
```

### 3. Building Manager - Today's Exams

```http
GET /api/v1/exams?buildingId=1&startDate=2025-11-14&endDate=2025-11-14&status=in_progress
```

### 4. Director View - Unresolved Violations

```http
GET /api/v1/violations?isResolved=false&filter=severity:in:high,critical&sortBy=createdAt&sortOrder=DESC
```

### 5. Document Library - Public Guidelines

```http
GET /api/v1/documents?type=guideline&visibility=public&sortBy=createdAt&sortOrder=DESC
```

## Error Handling

### Invalid Filter Format

```json
{
  "statusCode": 400,
  "message": "Invalid filter format. Expected: field:operator:value",
  "error": "Bad Request"
}
```

### Invalid Page Number

```json
{
  "statusCode": 400,
  "message": "Page must be greater than 0",
  "error": "Bad Request"
}
```

### Limit Exceeded

```json
{
  "statusCode": 400,
  "message": "Limit cannot exceed 100",
  "error": "Bad Request"
}
```

## Integration Examples

### JavaScript/TypeScript (Axios)

```typescript
import axios from 'axios';

const getUsers = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) => {
  const response = await axios.get('/api/v1/users', { params });
  return response.data;
};

// Usage
const users = await getUsers({
  page: 1,
  limit: 20,
  search: 'john',
  role: 'supervisor',
});
```

### cURL

```bash
curl -X GET \
  'https://api.example.com/api/v1/users?page=1&limit=10&search=john&filter=role:eq:supervisor' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Python (Requests)

```python
import requests

params = {
    'page': 1,
    'limit': 20,
    'search': 'john',
    'filter': [
        'role:eq:supervisor',
        'status:eq:active'
    ]
}

response = requests.get(
    'https://api.example.com/api/v1/users',
    params=params,
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

data = response.json()
```

## Best Practices

1. **Always use pagination** for list endpoints
2. **Combine filters** to narrow down results effectively
3. **Use search** for user-facing features, **use filters** for precise queries
4. **Cache results** when appropriate on the client side
5. **Handle empty results** gracefully in your UI
6. **Show loading states** while fetching data
7. **Implement infinite scroll** or "load more" for better UX
8. **Validate filter values** on the client side before sending

## Support

For issues or questions about filtering and search:
- Check the [API Documentation](README.md)
- Review the [Swagger/OpenAPI docs](http://localhost:3000/api/docs)
- Contact API support team

---

**Last Updated**: 2025-11-14
**API Version**: 1.0
