// src/ts/services/authService.ts
import * as ko from "knockout";

class AuthService {
  public isAuthenticated: ko.Observable<boolean>;
  public isLoggingOut: ko.Observable<boolean> = ko.observable(false);

  constructor() {
    this.isAuthenticated = ko.observable(this.checkAuthToken());
    this.addAuthListeners();
  }

  private checkAuthToken(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  private addAuthListeners() {
    window.addEventListener('authStateChanged', (e: any) => {
      this.isAuthenticated(e.detail.authenticated);
    });

    // Optional: periodic check for token changes across tabs
    setInterval(() => {
      const hasToken = this.checkAuthToken();
      if (hasToken !== this.isAuthenticated()) {
        this.isAuthenticated(hasToken);
      }
    }, 5000);
  }

  public async logout(router: any): Promise<void> {
    if (this.isLoggingOut()) return;
    this.isLoggingOut(true);

    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch('http://localhost:3000/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Backend logout failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      sessionStorage.clear();
      this.isAuthenticated(false);
      this.isLoggingOut(false);
      router.go({ path: 'login' });
    }
  }
}

export const authService = new AuthService();