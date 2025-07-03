import crypto from 'crypto';
import logger from './logger';

export interface TempCodeData {
  userId: string;
  email: string;
  name: string;
  expiresAt: number;
}

class TempCodeManager {
  private tempCodes = new Map<string, TempCodeData>();
  private cleanupInterval!: NodeJS.Timeout;

  constructor() {
    // Start cleanup interval when manager is instantiated
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredCodes();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  private cleanupExpiredCodes(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [code, data] of this.tempCodes.entries()) {
      if (data.expiresAt < now) {
        this.tempCodes.delete(code);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired temporary codes`);
    }
  }

  generateTempCode(userData: Omit<TempCodeData, 'expiresAt'>): string {
    const tempCode = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes expiry

    this.tempCodes.set(tempCode, {
      ...userData,
      expiresAt
    });

    logger.info(`Temporary code generated for user: ${userData.email}`);
    return tempCode;
  }

  getTempCodeData(code: string): TempCodeData | undefined {
    return this.tempCodes.get(code);
  }

  deleteTempCode(code: string): boolean {
    return this.tempCodes.delete(code);
  }

  isExpired(data: TempCodeData): boolean {
    return data.expiresAt < Date.now();
  }

  // Get stats for monitoring
  getStats(): { totalCodes: number; activeCount: number } {
    const now = Date.now();
    const activeCount = Array.from(this.tempCodes.values())
      .filter(data => data.expiresAt >= now).length;
    
    return {
      totalCodes: this.tempCodes.size,
      activeCount
    };
  }

  // Clean shutdown method
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.tempCodes.clear();
    logger.info('TempCodeManager destroyed');
  }
}

// Export singleton instance
export default new TempCodeManager(); 