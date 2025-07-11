var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigService = void 0;
    class ConfigService {
        static loadConfig() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this._config) {
                    return this._config;
                }
                const environment = this.detectEnvironment();
                this._config = {
                    apiUrl: environment === 'development'
                        ? 'http://localhost:3000/api'
                        : 'https://your-production-api.com/api',
                    environment: environment
                };
                return this._config;
            });
        }
        static detectEnvironment() {
            return window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1'
                ? 'development'
                : 'production';
        }
        static getConfig() {
            if (!this._config) {
                throw new Error('Configuration not loaded. Call loadConfig() first.');
            }
            return this._config;
        }
        static getApiUrl() {
            return this.getConfig().apiUrl;
        }
    }
    exports.ConfigService = ConfigService;
    ConfigService._config = null;
});
//# sourceMappingURL=config-service.js.map