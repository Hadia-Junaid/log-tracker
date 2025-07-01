// src/ts/services/userState.ts
import * as ko from "knockout";
import { authService } from "./authService";

class UserState {
  public userLogin: ko.Observable<string>;
  public userEmail: ko.Observable<string>;
  public userInitials: ko.Observable<string>;

  constructor() {
    this.userLogin = ko.observable("Not logged in");
    this.userEmail = ko.observable("");
    this.userInitials = ko.observable("U");

    authService.isAuthenticated.subscribe(() => this.updateUserInfo());
    this.updateUserInfo();
  }

  private getUserInfoFromToken(): { name: string; email: string } | null {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        name: payload.name || "Authenticated User",
        email: payload.email || ""
      };
    } catch (e) {
      return null;
    }
  }

  private calculateInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name ? name[0].toUpperCase() : 'U';
  }
  
  public updateUserInfo(): void {
    const info = this.getUserInfoFromToken();
    if (info) {
      this.userLogin(info.name);
      this.userEmail(info.email);
      this.userInitials(this.calculateInitials(info.name));
    } else {
      this.userLogin("Not logged in");
      this.userEmail("");
      this.userInitials("U");
    }
  }
}

export const userState = new UserState();