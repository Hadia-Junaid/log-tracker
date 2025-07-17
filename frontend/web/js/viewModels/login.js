var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "../accUtils", "knockout", "../services/config-service"], function (require, exports, AccUtils, ko, config_service_1) {
    "use strict";
    class LoginViewModel {
        constructor() {
            this.handleLogin = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    this.isProcessingAuth(true);
                    this.errorMessage("");
                    yield config_service_1.ConfigService.loadConfig();
                    const response = yield fetch(`${config_service_1.ConfigService.getApiUrl()}/auth/google`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = yield response.json();
                    if (data.success && data.authUrl) {
                        console.log("Redirecting to Google OAuth URL:", data.authUrl);
                        window.location.href = data.authUrl;
                    }
                    else {
                        console.error("Invalid response from auth API:", data);
                        this.errorMessage("Failed to initiate Google OAuth. Please try again.");
                    }
                }
                catch (error) {
                    console.error("Error calling auth API:", error);
                    this.errorMessage("Failed to connect to authentication service. Please try again.");
                }
                finally {
                    this.isProcessingAuth(false);
                }
            });
            this.errorMessage = ko.observable("");
            this.isProcessingAuth = ko.observable(false);
            this.checkUrlParameters();
        }
        checkUrlParameters() {
            const urlParams = new URLSearchParams(window.location.search);
            const hash = window.location.hash;
            if (hash.includes('auth_code=')) {
                const authCodeMatch = hash.match(/auth_code=([^&]+)/);
                if (authCodeMatch) {
                    const authCode = authCodeMatch[1];
                    this.exchangeAuthCode(authCode);
                    return;
                }
            }
            if (hash.includes('token=')) {
                const tokenMatch = hash.match(/token=([^&]+)/);
                if (tokenMatch) {
                    const token = tokenMatch[1];
                    console.warn('JWT token received in URL - this is deprecated and insecure');
                    localStorage.setItem('authToken', token);
                    const authEvent = new CustomEvent('authStateChanged', {
                        detail: { authenticated: true }
                    });
                    window.dispatchEvent(authEvent);
                    window.history.replaceState({}, document.title, window.location.pathname);
                    window.location.href = '#dashboard';
                    return;
                }
            }
            if (hash.includes('error=')) {
                const messageMatch = hash.match(/message=([^&]+)/);
                if (messageMatch) {
                    const errorMessage = decodeURIComponent(messageMatch[1]);
                    this.errorMessage(errorMessage);
                }
            }
        }
        exchangeAuthCode(authCode) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    this.isProcessingAuth(true);
                    this.errorMessage("");
                    window.history.replaceState({}, document.title, window.location.pathname + '#login');
                    yield config_service_1.ConfigService.loadConfig();
                    const response = yield fetch(`${config_service_1.ConfigService.getApiUrl()}/auth/exchange`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            auth_code: authCode
                        })
                    });
                    const data = yield response.json();
                    if (!response.ok) {
                        throw new Error(data.message || `HTTP error! status: ${response.status}`);
                    }
                    if (data.success && data.token) {
                        localStorage.setItem('authToken', data.token);
                        const authEvent = new CustomEvent('authStateChanged', {
                            detail: { authenticated: true }
                        });
                        window.dispatchEvent(authEvent);
                        window.location.href = '#dashboard';
                    }
                    else {
                        throw new Error(data.message || 'Invalid response from authentication service');
                    }
                }
                catch (error) {
                    console.error("Error exchanging auth code:", error);
                    this.errorMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
                finally {
                    this.isProcessingAuth(false);
                }
            });
        }
        connected() {
            AccUtils.announce("Login page loaded.");
            document.title = "Login - Log Tracker";
        }
        disconnected() {
        }
        transitionCompleted() {
        }
    }
    return LoginViewModel;
});
//# sourceMappingURL=login.js.map