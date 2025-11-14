import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E test for complete exam workflow:
 * 1. Create building, hall, room
 * 2. Create exam
 * 3. Create supervisor assignment
 * 4. Mark attendance
 * 5. Report violation
 */
describe('Exam Workflow E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;

  // IDs for created entities
  let buildingId: string;
  let hallId: string;
  let roomId: string;
  let examId: string;
  let assignmentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // TODO: In a real E2E test, you would:
    // 1. Setup test database
    // 2. Create and activate a test user
    // 3. Get authentication token
    // For now, this is a structure for the workflow
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Building Management Workflow', () => {
    it('should create a building', () => {
      return request(app.getHttpServer())
        .post('/api/v1/buildings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Building',
          address: '123 Test Street',
          description: 'Building for E2E testing',
          active: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('E2E Test Building');
          buildingId = res.body.id;
        });
    });

    it('should get all buildings', () => {
      return request(app.getHttpServer())
        .get('/api/v1/buildings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should get building by id', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/buildings/${buildingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(buildingId);
          expect(res.body.name).toBe('E2E Test Building');
        });
    });
  });

  describe('Hall Management Workflow', () => {
    it('should create a hall in the building', () => {
      return request(app.getHttpServer())
        .post('/api/v1/halls')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Hall',
          buildingId: buildingId,
          description: 'Hall for E2E testing',
          active: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('E2E Test Hall');
          hallId = res.body.id;
        });
    });

    it('should get halls filtered by building', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/halls?buildingId=${buildingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(res.body.data[0].buildingId).toBe(buildingId);
        });
    });
  });

  describe('Room Management Workflow', () => {
    it('should create a room in the hall', () => {
      return request(app.getHttpServer())
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          number: 'R101',
          name: 'E2E Test Room',
          hallId: hallId,
          capacity: 30,
          active: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.number).toBe('R101');
          roomId = res.body.id;
        });
    });
  });

  describe('Exam Management Workflow', () => {
    it('should create an exam', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(11, 0, 0, 0);

      return request(app.getHttpServer())
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Exam',
          description: 'Exam for E2E testing',
          examDate: tomorrow.toISOString().split('T')[0],
          startTime: tomorrow.toISOString(),
          endTime: endTime.toISOString(),
          status: 'scheduled',
          totalParticipants: 30,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('E2E Test Exam');
          examId = res.body.id;
        });
    });

    it('should get upcoming exams', () => {
      return request(app.getHttpServer())
        .get('/api/v1/exams')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('Assignment Workflow', () => {
    it('should create a supervisor assignment', () => {
      return request(app.getHttpServer())
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          supervisorId: '1', // Assuming supervisor with ID 1 exists
          roomId: roomId,
          examId: examId,
          status: 'pending',
          noSupervisorNeeded: false,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          assignmentId = res.body.id;
        });
    });

    it('should confirm assignment', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/assignments/${assignmentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'confirmed',
        })
        .expect(200);
    });
  });

  describe('Attendance Workflow', () => {
    it('should mark student attendance', () => {
      return request(app.getHttpServer())
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          examId: examId,
          roomId: roomId,
          participantName: 'Test Student',
          participantId: 'STU001',
          status: 'present',
          seatNumber: '15',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.participantName).toBe('Test Student');
        });
    });

    it('should get attendance for exam', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/attendance?examId=${examId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });
  });

  describe('Violation Reporting Workflow', () => {
    it('should report a violation', () => {
      return request(app.getHttpServer())
        .post('/api/v1/violations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assignmentId: assignmentId,
          participantName: 'Test Student',
          participantId: 'STU001',
          violationType: 'unauthorized-materials',
          description: 'Student was using unauthorized materials',
          severity: 'high',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.violationType).toBe('unauthorized-materials');
        });
    });

    it('should get violations for assignment', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/violations?assignmentId=${assignmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Data Validation', () => {
    it('should reject invalid exam with end time before start time', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(11, 0, 0, 0);

      const startTime = new Date(tomorrow);
      startTime.setHours(9, 0, 0, 0);

      return request(app.getHttpServer())
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Exam',
          examDate: tomorrow.toISOString().split('T')[0],
          startTime: tomorrow.toISOString(),
          endTime: startTime.toISOString(), // End before start
        })
        .expect(400);
    });

    it('should reject assignment without supervisor when noSupervisorNeeded is false', () => {
      return request(app.getHttpServer())
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roomId: roomId,
          examId: examId,
          noSupervisorNeeded: false,
        })
        .expect(400);
    });
  });
});
