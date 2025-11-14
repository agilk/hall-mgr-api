import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  describe('getHealth', () => {
    it('should return health check data with status ok', () => {
      const result = service.getHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return current timestamp', () => {
      const beforeTime = Date.now();
      const result = service.getHealth();
      const afterTime = Date.now();
      const resultTime = new Date(result.timestamp).getTime();

      expect(resultTime).toBeGreaterThanOrEqual(beforeTime);
      expect(resultTime).toBeLessThanOrEqual(afterTime + 1000); // Allow 1s margin
    });

    it('should return process uptime', () => {
      const uptime = process.uptime();
      const result = service.getHealth();

      expect(result.uptime).toBeGreaterThanOrEqual(uptime - 1);
      expect(result.uptime).toBeLessThanOrEqual(uptime + 1);
    });
  });
});
