import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';
import { LoggerService } from '../services/logger.service';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let logger: LoggerService;

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  const mockGetResponse = jest.fn().mockReturnValue({
    status: mockStatus,
  });
  const mockGetRequest = jest.fn().mockReturnValue({
    url: '/test-url',
  });
  const mockHttpArgumentsHost = jest.fn().mockReturnValue({
    getResponse: mockGetResponse,
    getRequest: mockGetRequest,
  });

  const mockArgumentsHost = {
    switchToHttp: mockHttpArgumentsHost,
    getArgByIndex: jest.fn(),
    getArgs: jest.fn(),
    getType: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
  } as unknown as ArgumentsHost;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
    logger = module.get<LoggerService>(LoggerService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should set logger context on construction', async () => {
    // Create a new instance to test constructor behavior
    const localMockLogger = {
      setContext: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        {
          provide: LoggerService,
          useValue: localMockLogger,
        },
      ],
    }).compile();

    module.get<AllExceptionsFilter>(AllExceptionsFilter);

    expect(localMockLogger.setContext).toHaveBeenCalledWith('AllExceptionsFilter');
  });

  describe('catch', () => {
    it('should handle HttpException with string message', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Not found',
        },
        timestamp: expect.any(String),
        path: '/test-url',
      });
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        {
          message: 'Validation failed',
          error: 'BAD_REQUEST',
          details: { field: 'email', issue: 'invalid format' },
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Validation failed',
          details: { field: 'email', issue: 'invalid format' },
        },
        timestamp: expect.any(String),
        path: '/test-url',
      });
    });

    it('should handle HttpException without details', () => {
      const exception = new HttpException(
        {
          message: 'Unauthorized',
          error: 'UNAUTHORIZED',
        },
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        },
        timestamp: expect.any(String),
        path: '/test-url',
      });
    });

    it('should handle regular Error instances', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Something went wrong',
        },
        timestamp: expect.any(String),
        path: '/test-url',
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unhandled exception: Something went wrong',
        expect.any(String),
      );
    });

    it('should handle unknown exception types', () => {
      const exception = 'Unknown error';

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
        timestamp: expect.any(String),
        path: '/test-url',
      });
    });

    it('should handle HttpException with partial object response', () => {
      const exception = new HttpException(
        {
          message: 'Forbidden',
        },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Forbidden',
        },
        timestamp: expect.any(String),
        path: '/test-url',
      });
    });

    it('should include timestamp in ISO format', () => {
      const exception = new HttpException('Test', HttpStatus.OK);
      const beforeTime = new Date().toISOString();

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockJson.mock.calls[0][0];
      const timestamp = callArgs.timestamp;

      // Check it's a valid ISO string
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include request path', () => {
      const exception = new HttpException('Test', HttpStatus.OK);
      mockGetRequest.mockReturnValueOnce({ url: '/api/v1/users' });

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/v1/users',
        }),
      );
    });

    it('should handle HttpException with empty message', () => {
      const exception = new HttpException({}, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
        timestamp: expect.any(String),
        path: '/test-url',
      });
    });

    it('should handle Error with stack trace', () => {
      const exception = new Error('Test error');
      exception.stack = 'Error: Test error\n    at Object.<anonymous> (test.js:1:1)';

      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unhandled exception: Test error',
        exception.stack,
      );
    });

    it('should not include details when not provided', () => {
      const exception = new HttpException(
        {
          message: 'No details',
          error: 'TEST_ERROR',
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockJson.mock.calls[0][0];
      expect(callArgs.error).not.toHaveProperty('details');
    });

    it('should always set success to false', () => {
      const exceptions = [
        new HttpException('Test 1', HttpStatus.OK),
        new HttpException('Test 2', HttpStatus.BAD_REQUEST),
        new Error('Test 3'),
        'Unknown',
      ];

      exceptions.forEach((exception) => {
        jest.clearAllMocks();
        filter.catch(exception, mockArgumentsHost);
        const callArgs = mockJson.mock.calls[0][0];
        expect(callArgs.success).toBe(false);
      });
    });
  });
});
