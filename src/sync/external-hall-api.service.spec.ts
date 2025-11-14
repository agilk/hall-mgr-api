import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { ExternalHallApiService, ExternalHall, ExternalRoom, ParticipantTimeSlot } from './external-hall-api.service';

describe('ExternalHallApiService', () => {
  let service: ExternalHallApiService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'EXTERNAL_HALL_API_URL') return 'https://api.example.com';
      if (key === 'EXTERNAL_HALL_API_TOKEN') return 'test-token';
      return null;
    }),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalHallApiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<ExternalHallApiService>(ExternalHallApiService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with config values', async () => {
      const mockConfigLocal = {
        get: jest.fn((key: string) => {
          if (key === 'EXTERNAL_HALL_API_URL') return 'https://api.example.com';
          if (key === 'EXTERNAL_HALL_API_TOKEN') return 'test-token';
          return null;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ExternalHallApiService,
          {
            provide: ConfigService,
            useValue: mockConfigLocal,
          },
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
        ],
      }).compile();

      module.get<ExternalHallApiService>(ExternalHallApiService);

      expect(mockConfigLocal.get).toHaveBeenCalledWith('EXTERNAL_HALL_API_URL');
      expect(mockConfigLocal.get).toHaveBeenCalledWith('EXTERNAL_HALL_API_TOKEN');
    });
  });

  describe('getExamHalls', () => {
    const mockHalls: ExternalHall[] = [
      {
        id: 1,
        uid: 'hall-1',
        name: 'Main Hall',
        address: '123 Main St',
        placeLimit: 500,
        regionId: 1,
        isActive: 1,
        rooms: [
          {
            id: 1,
            name: 'Room A',
            capacity: 50,
            examHallId: 1,
            isActive: 1,
          },
        ],
      },
      {
        id: 2,
        uid: 'hall-2',
        name: 'North Hall',
        address: '456 North St',
        placeLimit: 300,
        regionId: 2,
        isActive: 1,
        rooms: [],
      },
    ];

    it('should fetch exam halls successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: { data: mockHalls },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getExamHalls();

      expect(result).toEqual(mockHalls);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.example.com/api/external-app/exam-halls',
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should throw error when API call fails', async () => {
      const mockError = new Error('Network error');
      mockHttpService.get.mockReturnValue(throwError(() => mockError));

      await expect(service.getExamHalls()).rejects.toThrow('External API error: Network error');
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.example.com/api/external-app/exam-halls',
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle axios error with response', async () => {
      const axiosError: Partial<AxiosError> = {
        message: 'Request failed with status code 500',
        response: {
          data: { error: 'Internal Server Error' },
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
      };

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getExamHalls()).rejects.toThrow('External API error: Request failed with status code 500');
    });
  });

  describe('getHallRooms', () => {
    const mockRooms: ExternalRoom[] = [
      {
        id: 1,
        name: 'Room A',
        capacity: 50,
        examHallId: 1,
        isActive: 1,
      },
      {
        id: 2,
        name: 'Room B',
        capacity: 40,
        examHallId: 1,
        isActive: 1,
      },
    ];

    it('should fetch hall rooms successfully', async () => {
      const hallId = 1;
      const mockResponse: AxiosResponse = {
        data: { data: mockRooms },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getHallRooms(hallId);

      expect(result).toEqual(mockRooms);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.example.com/api/external-app/hall-rooms/1',
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should throw error when API call fails', async () => {
      const hallId = 1;
      const mockError = new Error('Connection timeout');
      mockHttpService.get.mockReturnValue(throwError(() => mockError));

      await expect(service.getHallRooms(hallId)).rejects.toThrow('External API error: Connection timeout');
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.example.com/api/external-app/hall-rooms/1',
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle different hall IDs', async () => {
      const hallId = 999;
      const mockResponse: AxiosResponse = {
        data: { data: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getHallRooms(hallId);

      expect(result).toEqual([]);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.example.com/api/external-app/hall-rooms/999',
        expect.any(Object),
      );
    });
  });

  describe('getRoomParticipants', () => {
    const mockParticipants: ParticipantTimeSlot[] = [
      {
        startTime: '09:00',
        participants: [
          {
            hallId: 1,
            hallName: 'Main Hall',
            roomId: 1,
            roomName: 'Room A',
            participantCount: 25,
          },
          {
            hallId: 1,
            hallName: 'Main Hall',
            roomId: 2,
            roomName: 'Room B',
            participantCount: 30,
          },
        ],
      },
      {
        startTime: '14:00',
        participants: [
          {
            hallId: 2,
            hallName: 'North Hall',
            roomId: 3,
            roomName: 'Room C',
            participantCount: 20,
          },
        ],
      },
    ];

    it('should fetch room participants successfully', async () => {
      const examDate = '2024-03-15';
      const mockResponse: AxiosResponse = {
        data: { data: mockParticipants },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getRoomParticipants(examDate);

      expect(result).toEqual(mockParticipants);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.example.com/api/external-app/room-participants/2024-03-15',
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should throw error when API call fails', async () => {
      const examDate = '2024-03-15';
      const mockError = new Error('API unavailable');
      mockHttpService.get.mockReturnValue(throwError(() => mockError));

      await expect(service.getRoomParticipants(examDate)).rejects.toThrow('External API error: API unavailable');
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.example.com/api/external-app/room-participants/2024-03-15',
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle different date formats', async () => {
      const examDate = '2024-12-31';
      const mockResponse: AxiosResponse = {
        data: { data: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getRoomParticipants(examDate);

      expect(result).toEqual([]);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.example.com/api/external-app/room-participants/2024-12-31',
        expect.any(Object),
      );
    });

    it('should handle 404 errors gracefully', async () => {
      const examDate = '2024-01-01';
      const axiosError: Partial<AxiosError> = {
        message: 'Request failed with status code 404',
        response: {
          data: { error: 'Not Found' },
          status: 404,
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
        isAxiosError: true,
      };

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getRoomParticipants(examDate)).rejects.toThrow('External API error: Request failed with status code 404');
    });
  });

  describe('error handling', () => {
    it('should log errors appropriately', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      const mockError = new Error('Test error');
      mockHttpService.get.mockReturnValue(throwError(() => mockError));

      await expect(service.getExamHalls()).rejects.toThrow();
      expect(loggerSpy).toHaveBeenCalledWith('Failed to fetch exam halls', expect.any(String));
    });

    it('should log success messages', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');
      const mockResponse: AxiosResponse = {
        data: { data: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.getExamHalls();
      expect(loggerSpy).toHaveBeenCalledWith('Fetching exam halls from external API');
      expect(loggerSpy).toHaveBeenCalledWith('Fetched 0 exam halls');
    });
  });
});
