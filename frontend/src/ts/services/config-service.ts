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

    try {
      // Try to fetch the OracleJET configuration
      const response = await fetch('/oraclejetconfig.json');
      if (response.ok) {
        const ojetConfig = await response.json();
        const environment = this.detectEnvironment();
        
        if (ojetConfig.environments && ojetConfig.environments[environment]) {
          this._config = {
            apiUrl: ojetConfig.environments[environment].apiUrl,
            environment: environment
          };
          return this._config;
        }
      }
    } catch (error) {
      logger.warn('Could not load OracleJET config, using fallback configuration', error);
    }

    // Fallback configuration if oraclejetconfig.json is not accessible
    const environment = this.detectEnvironment();
    this._config = {
      apiUrl: environment === 'development' 
        ? 'http://localhost:3000/api'
        : 'https://your-production-api.com/api',
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