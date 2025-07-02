import logger from './logger-service';

interface AppConfig {
  apiUrl: string;
  environment: string;
}

export class ConfigService {
  private static _config: AppConfig | null = null;

  public static async loadConfig(): Promise<AppConfig> {
    if (this._config) {
      return this._config;
    }

    const environment = this.detectEnvironment();
    this._config = {
      apiUrl: environment === 'development' 
        ? 'http://localhost:3000'
        : 'https://your-production-api.com',
      environment: environment
    };
    
    return this._config;
  }

  private static detectEnvironment(): 'development' | 'production' {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' 
      ? 'development' 
      : 'production';
  }

  public static getConfig(): AppConfig {
    if (!this._config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this._config;
  }

  // Convenience method to get just the API URL
  public static getApiUrl(): string {
    return this.getConfig().apiUrl;
  }
} 