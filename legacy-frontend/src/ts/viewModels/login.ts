/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import * as AccUtils from "../accUtils";
import * as ko from "knockout";
import { ConfigService } from "../services/config-service";

class LoginViewModel {
  errorMessage: ko.Observable<string>;
  isProcessingAuth: ko.Observable<boolean>;

  constructor() {
    this.errorMessage = ko.observable("");
    this.isProcessingAuth = ko.observable(false);
    
    this.checkUrlParameters();
  }


  private checkUrlParameters(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    // Check for temporary authorization code (secure flow)
    if (hash.includes('auth_code=')) {
      const authCodeMatch = hash.match(/auth_code=([^&]+)/);
      if (authCodeMatch) {
        const authCode = authCodeMatch[1];
        this.exchangeAuthCode(authCode);
        return;
      }
    }
    
    
    // Check for error parameters
    if (hash.includes('error=')) {
      const messageMatch = hash.match(/message=([^&]+)/);
      if (messageMatch) {
        const errorMessage = decodeURIComponent(messageMatch[1]);
        this.errorMessage(errorMessage);
      }
    }
  }

  /**
   * Exchange temporary authorization code for JWT token
   */
  private async exchangeAuthCode(authCode: string): Promise<void> {
    try {
      this.isProcessingAuth(true);
      this.errorMessage("");

      // Clean URL immediately for security
      window.history.replaceState({}, document.title, window.location.pathname + '#login');

      await ConfigService.loadConfig();
      
      const response = await fetch(`${ConfigService.getApiUrl()}/auth/exchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_code: authCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.token) {
        localStorage.setItem('authToken', data.token);
        
        // Dispatch authentication event
        const authEvent = new CustomEvent('authStateChanged', { 
          detail: { authenticated: true }
        });
        window.dispatchEvent(authEvent);
        
        // Navigate to dashboard
        window.location.href = '#dashboard';
      } else {
        throw new Error(data.message || 'Invalid response from authentication service');
      }

    } catch (error) {
      console.error("Error exchanging auth code:", error);
      this.errorMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isProcessingAuth(false);
    }
  }


  handleLogin = async (): Promise<void> => {
    try {
      this.isProcessingAuth(true);
      this.errorMessage("");

      await ConfigService.loadConfig();
      const response = await fetch(`${ConfigService.getApiUrl()}/auth/google`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } 

      const data = await response.json();

      if (data.authUrl) {
        // Redirect to the Google OAuth URL
        console.log("Redirecting to Google OAuth URL:", data.authUrl);
        window.location.href = data.authUrl;
      } else {
        console.error("Invalid response from auth API:", data);
        this.errorMessage("Failed to initiate Google OAuth. Please try again.");
      }
    } catch (error) {
      console.error("Error calling auth API:", error);
      this.errorMessage("Failed to connect to authentication service. Please try again.");
    } finally {
      this.isProcessingAuth(false);
    }
  }

  /**
   * Optional ViewModel method invoked after the View is inserted into the
   * document DOM.  The application can put logic that requires the DOM being
   * attached here.
   * This method might be called multiple times - after the View is created
   * and inserted into the DOM and after the View is reconnected
   * after being disconnected.
   */
  connected(): void {
    AccUtils.announce("Login page loaded.");
    document.title = "Login - Log Tracker";
    // implement further logic if needed
  }

  /**
   * Optional ViewModel method invoked after the View is disconnected from the DOM.
   */
  disconnected(): void {
    // implement if needed
  }

  /**
   * Optional ViewModel method invoked after transition to the new View is complete.
   * That includes any possible animation between the old and the new View.
   */
  transitionCompleted(): void {
    // implement if needed
  }
}

export = LoginViewModel; 