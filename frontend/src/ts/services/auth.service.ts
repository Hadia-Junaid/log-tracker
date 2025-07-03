// auth.service.ts

import { UserInfo } from "../app.types";
import { ConfigService } from "./config-service";

export class AuthService {
 
  public checkAuthToken(): boolean {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return false;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const exp = payload.exp ? payload.exp * 1000 : 0;
      if (Date.now() > exp) {
        localStorage.removeItem("authToken"); // Token expired, remove it
        return false;
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem("authToken"); 
      return false;
    }
    return token.length > 0;
  }


  public getUserInfoFromToken(): UserInfo | null {
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
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }


  public getUserInitials(): string {
    const userInfo = this.getUserInfoFromToken();
    if (!userInfo || !userInfo.name) {
      return "U";
    }
    const nameParts = userInfo.name.split(" ");
    if (nameParts.length >= 2) {
      return (
        nameParts[0][0] + nameParts[nameParts.length - 1][0]
      ).toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  }


  public getIsAdminFromToken(): boolean {
    const token = localStorage.getItem("authToken");
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.is_admin === true; // Explicitly check for true
    } catch (error) {
      console.error("Error getting admin status from token:", error);
      return false;
    }
  }


  public async logout(): Promise<void> {
    const token = localStorage.getItem("authToken");

    if (token) {
      try {
        await ConfigService.loadConfig();
        await fetch(`${ConfigService.getApiUrl()}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (fetchError) {
        console.error("Error calling backend logout:", fetchError);
      }
    }

    // Clear all auth-related storage
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
  }

  public async verifyToken(): Promise<boolean> {
    const token = localStorage.getItem("authToken");
    if (!token) return false;

    try {
      const response = await fetch(`${ConfigService.getApiUrl()}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        localStorage.removeItem("authToken");
        return false;
      }

      const data = await response.json();
      if (data.success && data.user) {
        // Update local storage with new token if provided
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error verifying token:", error);
      return false;
    }
  }
}