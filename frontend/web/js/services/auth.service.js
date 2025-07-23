var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "./config-service"], function (require, exports, config_service_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthService = void 0;
    class AuthService {
        checkAuthToken() {
            const token = localStorage.getItem("authToken");
            if (!token) {
                return false;
            }
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                const exp = payload.exp ? payload.exp * 1000 : 0;
                if (Date.now() > exp) {
                    localStorage.removeItem("authToken");
                    return false;
                }
            }
            catch (error) {
                console.error("Error decoding token:", error);
                localStorage.removeItem("authToken");
                return false;
            }
            return token.length > 0;
        }
        getUserInfoFromToken() {
            const token = localStorage.getItem("authToken");
            if (!token) {
                return null;
            }
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                return {
                    name: payload.name || "Unknown User",
                    email: payload.email || "Unknown Email",
                    userId: payload.userId || "",
                    is_admin: payload.is_admin || false
                };
            }
            catch (error) {
                console.error("Error decoding token:", error);
                return null;
            }
        }
        getUserInitials() {
            const userInfo = this.getUserInfoFromToken();
            if (!userInfo || !userInfo.name) {
                return "U";
            }
            const nameParts = userInfo.name.split(" ");
            if (nameParts.length >= 2) {
                return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
            }
            return nameParts[0][0].toUpperCase();
        }
        getIsAdminFromToken() {
            const token = localStorage.getItem("authToken");
            if (!token)
                return false;
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                return payload.is_admin === true;
            }
            catch (error) {
                console.error("Error getting admin status from token:", error);
                return false;
            }
        }
        logout() {
            return __awaiter(this, void 0, void 0, function* () {
                const token = localStorage.getItem("authToken");
                if (token) {
                    try {
                        yield config_service_1.ConfigService.loadConfig();
                        yield fetch(`${config_service_1.ConfigService.getApiUrl()}/auth/logout`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                        });
                    }
                    catch (fetchError) {
                        console.error("Error calling backend logout:", fetchError);
                    }
                }
                localStorage.removeItem("authToken");
                sessionStorage.clear();
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.includes("auth") || key.includes("token"))) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach((key) => localStorage.removeItem(key));
            });
        }
        verifyToken() {
            return __awaiter(this, void 0, void 0, function* () {
                const token = localStorage.getItem("authToken");
                if (!token)
                    return false;
                try {
                    const response = yield fetch(`${config_service_1.ConfigService.getApiUrl()}/auth/verify`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (!response.ok) {
                        localStorage.removeItem("authToken");
                        return false;
                    }
                    const data = yield response.json();
                    if (data.success && data.user) {
                        if (data.token) {
                            localStorage.setItem("authToken", data.token);
                        }
                        return true;
                    }
                    return false;
                }
                catch (error) {
                    console.error("Error verifying token:", error);
                    return false;
                }
            });
        }
    }
    exports.AuthService = AuthService;
});
//# sourceMappingURL=auth.service.js.map