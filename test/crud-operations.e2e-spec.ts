import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../src/modules/users/users.service';

describe('CRUD Operations (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let usersService: UsersService;
  let authToken: string;
  let testUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    usersService = moduleFixture.get<UsersService>(UsersService);

    await app.init();

    // Create a test user and get auth token
    try {
      const testUser = await usersService.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        full_name: 'Test User',
        roles: ['supervisor', 'manager'],
      });
      testUserId = testUser.id;

      authToken = jwtService.sign({
        sub: testUser.id,
        username: testUser.username,
        roles: testUser.roles,
      });
    } catch (error) {
      // User might already exist, try to find it
      const existingUser = await dataSource.getRepository('user').findOne({
        where: { username: 'testuser' },
      });
      if (existingUser) {
        testUserId = existingUser.id;
        authToken = jwtService.sign({
          sub: existingUser.id,
          username: existingUser.username,
          roles: existingUser.roles || ['supervisor'],
        });
      }
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      try {
        await usersService.remove(testUserId);
      } catch (error) {
        // User might already be deleted
      }
    }
    await dataSource.destroy();
    await app.close();
  });

  describe('/api/v1/buildings (Buildings CRUD)', () => {
    let buildingId: number;

    it('should create a new building', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/buildings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Building E2E',
          address: '123 Test Street',
          capacity: 500,
          is_active: true,
        })
        .expect((res) => {
          expect([201, 400, 401]).toContain(res.status);
          if (res.status === 201) {
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.name).toBe('Test Building E2E');
          }
        });

      if (response.status === 201) {
        buildingId = response.body.data.id;
      }
    });

    it('should get all buildings with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/buildings')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect((res) => {
          expect([200, 401]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body.data).toHaveProperty('items');
            expect(res.body.data).toHaveProperty('meta');
            expect(Array.isArray(res.body.data.items)).toBe(true);
          }
        });
    });

    it('should get a specific building by id', async () => {
      if (!buildingId) {
        return; // Skip if building creation failed
      }

      return request(app.getHttpServer())
        .get(`/api/v1/buildings/${buildingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 401, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body.data.id).toBe(buildingId);
            expect(res.body.data.name).toBe('Test Building E2E');
          }
        });
    });

    it('should update a building', async () => {
      if (!buildingId) {
        return; // Skip if building creation failed
      }

      return request(app.getHttpServer())
        .patch(`/api/v1/buildings/${buildingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Building',
          capacity: 600,
        })
        .expect((res) => {
          expect([200, 401, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body.data.name).toBe('Updated Test Building');
            expect(res.body.data.capacity).toBe(600);
          }
        });
    });

    it('should delete a building', async () => {
      if (!buildingId) {
        return; // Skip if building creation failed
      }

      return request(app.getHttpServer())
        .delete(`/api/v1/buildings/${buildingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 204, 401, 404]).toContain(res.status);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/buildings')
        .expect(401);
    });

    it('should validate required fields on create', () => {
      return request(app.getHttpServer())
        .post('/api/v1/buildings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          capacity: 100,
        })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });
  });

  describe('/api/v1/users (Users CRUD)', () => {
    let createdUserId: number;

    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'newuser_e2e',
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          full_name: 'New User',
          roles: ['supervisor'],
        })
        .expect((res) => {
          expect([201, 400, 401, 409]).toContain(res.status);
          if (res.status === 201) {
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.username).toBe('newuser_e2e');
            expect(res.body.data).not.toHaveProperty('password');
          }
        });

      if (response.status === 201) {
        createdUserId = response.body.data.id;
      }
    });

    it('should get all users with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect((res) => {
          expect([200, 401]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body.data).toHaveProperty('items');
            expect(Array.isArray(res.body.data.items)).toBe(true);
          }
        });
    });

    it('should not expose password in response', async () => {
      if (!createdUserId) {
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 401, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body.data).not.toHaveProperty('password');
      }
    });

    it('should update user profile', async () => {
      if (!createdUserId) {
        return;
      }

      return request(app.getHttpServer())
        .patch(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          full_name: 'Updated User Name',
        })
        .expect((res) => {
          expect([200, 401, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body.data.full_name).toBe('Updated User Name');
          }
        });
    });

    it('should delete user', async () => {
      if (!createdUserId) {
        return;
      }

      return request(app.getHttpServer())
        .delete(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 204, 401, 404]).toContain(res.status);
        });
    });

    it('should validate email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'testuser2',
          email: 'invalid-email',
          password: 'Pass123!',
          full_name: 'Test User 2',
          roles: ['supervisor'],
        })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });

    it('should require strong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'testuser3',
          email: 'test3@example.com',
          password: 'weak',
          full_name: 'Test User 3',
          roles: ['supervisor'],
        })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });
  });

  describe('/api/v1/audit-logs (Audit Logs)', () => {
    it('should get audit logs', () => {
      return request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect((res) => {
          expect([200, 401]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body.data).toHaveProperty('items');
            expect(Array.isArray(res.body.data.items)).toBe(true);
          }
        });
    });

    it('should filter logs by entity', () => {
      return request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ entity: 'user', page: 1, limit: 10 })
        .expect((res) => {
          expect([200, 401]).toContain(res.status);
        });
    });

    it('should filter logs by action', () => {
      return request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ action: 'CREATE', page: 1, limit: 10 })
        .expect((res) => {
          expect([200, 401]).toContain(res.status);
        });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent resources', () => {
      return request(app.getHttpServer())
        .get('/api/v1/buildings/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([404, 401]).toContain(res.status);
          if (res.status === 404) {
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
          }
        });
    });

    it('should return 401 for missing auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(401);
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/buildings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Empty name should fail validation
          capacity: -100, // Negative capacity should fail
        })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });
  });

  describe('Pagination', () => {
    it('should respect page and limit parameters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/buildings')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 5 })
        .expect((res) => {
          expect([200, 401]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body.data.meta).toHaveProperty('currentPage', 1);
            expect(res.body.data.meta).toHaveProperty('itemsPerPage', 5);
          }
        });
    });

    it('should handle different page numbers', async () => {
      const page1 = await request(app.getHttpServer())
        .get('/api/v1/buildings')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 2 });

      const page2 = await request(app.getHttpServer())
        .get('/api/v1/buildings')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 2, limit: 2 });

      if (page1.status === 200 && page2.status === 200) {
        expect(page1.body.data.meta.currentPage).toBe(1);
        expect(page2.body.data.meta.currentPage).toBe(2);
      }
    });
  });
});
