interface AppConfig {
    apiUrl: string;
    environment: string;
}
export declare class ConfigService {
    private static _config;
    static loadConfig(): Promise<AppConfig>;
    private static detectEnvironment;
    static getConfig(): AppConfig;
    static getApiUrl(): string;
}
export {};
