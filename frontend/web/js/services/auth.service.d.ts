import { UserInfo } from "../app.types";
export declare class AuthService {
    checkAuthToken(): boolean;
    getUserInfoFromToken(): UserInfo | null;
    getUserInitials(): string;
    getIsAdminFromToken(): boolean;
    logout(): Promise<void>;
    verifyToken(): Promise<boolean>;
}
