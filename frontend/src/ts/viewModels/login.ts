/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import * as AccUtils from "../accUtils";
import * as ko from "knockout";

class LoginViewModel {
  errorMessage: ko.Observable<string>;

  constructor() {
    this.errorMessage = ko.observable("");
    
    // Check for token or error in URL parameters when page loads
    this.checkUrlParameters();
  }

  /**
   * Check URL parameters for token (successful auth) or error messages
   */
  private checkUrlParameters(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    if (hash.includes('token=')) {
      const tokenMatch = hash.match(/token=([^&]+)/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        
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


  handleLogin = async (): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:3000/auth/google`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check if the response is successful and contains authUrl
      if (data.success && data.authUrl) {
        // Redirect to the Google OAuth URL
        window.location.href = data.authUrl;
      } else {
        console.error("Invalid response from auth API:", data);
        alert("Failed to initiate Google OAuth. Please try again.");
      }
    } catch (error) {
      console.error("Error calling auth API:", error);
      alert("Failed to connect to authentication service. Please try again.");
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