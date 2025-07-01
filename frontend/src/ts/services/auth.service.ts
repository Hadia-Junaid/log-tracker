// auth.service.ts

import { UserInfo } from "../app.types";
import { ConfigService } from "./config-service";

export class AuthService {
  /**
   * Checks if a valid authentication token exists in local storage.
   */
  public checkAuthToken(): boolean {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return false;
    }
    // For example, decode the token and check the expiration time
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const exp = payload.exp ? payload.exp * 1000 : 0; // Convert to milliseconds
      if (Date.now() > exp) {
        localStorage.removeItem("authToken"); // Token expired, remove it
        return false;
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      localStorage.removeItem("authToken"); // Invalid token, remove it
      return false;
    }
    return token.length > 0;
  }

  /**
   * Retrieves full user information from the JWT token.
   */
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
      };
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  /**
   * Generates user initials from their name for display purposes.
   */
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

  /**
   * Handles the complete user logout process.
   */
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
}