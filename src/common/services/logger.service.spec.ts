import { LoggerService } from './logger.service';
import { Logger } from 'winston';

describe('LoggerService', () => {
  let service: LoggerService;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    service = new LoggerService();
    (service as any).logger = mockLogger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      const context = 'TestContext';

      service.log(message, context);

      expect(mockLogger.info).toHaveBeenCalledWith(message, { context });
    });

    it('should log info without context', () => {
      const message = 'Test message';

      service.log(message);

      expect(mockLogger.info).toHaveBeenCalledWith(message, {
        context: undefined,
      });
    });
  });

  describe('error', () => {
    it('should log error messages with trace', () => {
      const message = 'Test error';
      const trace = 'Error stack trace';
      const context = 'ErrorContext';

      service.error(message, trace, context);

      expect(mockLogger.error).toHaveBeenCalledWith(message, {
        trace,
        context,
      });
    });

    it('should log error without trace and context', () => {
      const message = 'Test error';

      service.error(message);

      expect(mockLogger.error).toHaveBeenCalledWith(message, {
        trace: undefined,
        context: undefined,
      });
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      const message = 'Test warning';
      const context = 'WarnContext';

      service.warn(message, context);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, { context });
    });

    it('should log warning without context', () => {
      const message = 'Test warning';

      service.warn(message);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, {
        context: undefined,
      });
    });
  });

  describe('debug', () => {
    it('should log debug messages', () => {
      const message = 'Test debug';
      const context = 'DebugContext';

      service.debug(message, context);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, { context });
    });

    it('should log debug without context', () => {
      const message = 'Test debug';

      service.debug(message);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, {
        context: undefined,
      });
    });
  });
});
