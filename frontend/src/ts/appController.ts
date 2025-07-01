/**

* @license

* Copyright (c) 2014, 2025, Oracle and/or its affiliates.

* Licensed under The Universal Permissive License (UPL), Version 1.0

* as shown at https://oss.oracle.com/licenses/upl/

* @ignore

*/

import * as ko from "knockout";

import * as ModuleUtils from "ojs/ojmodule-element-utils";

import * as ResponsiveUtils from "ojs/ojresponsiveutils";

import * as ResponsiveKnockoutUtils from "ojs/ojresponsiveknockoututils";

import CoreRouter = require ("ojs/ojcorerouter");

import ModuleRouterAdapter = require("ojs/ojmodulerouter-adapter");

import KnockoutRouterAdapter = require("ojs/ojknockoutrouteradapter");

import UrlParamAdapter = require("ojs/ojurlparamadapter");

import ArrayDataProvider = require("ojs/ojarraydataprovider");

import "ojs/ojknockout";

import "ojs/ojmodule-element";

import { ojNavigationList } from "ojs/ojnavigationlist";

import { ojModule } from "ojs/ojmodule-element";

import Context = require("ojs/ojcontext");

import "ojs/ojdrawerpopup";



interface CoreRouterDetail {

label: string;

iconClass: string;

};



class RootViewModel {

manner: ko.Observable<string>;

message: ko.Observable<string|undefined>;

smScreen: ko.Observable<boolean>|undefined;

mdScreen: ko.Observable<boolean>|undefined;

router: CoreRouter<CoreRouterDetail>|undefined;

moduleAdapter: ModuleRouterAdapter<CoreRouterDetail>;

sideDrawerOn: ko.Observable<boolean>;

navDataProvider: ojNavigationList<string, CoreRouter.CoreRouterState<CoreRouterDetail>>["data"];

appName: ko.Observable<string>;

userLogin: ko.Observable<string>;

userEmail: ko.Observable<string>;

userInitials: ko.Observable<string>;

isLoggingOut: ko.Observable<boolean>;

footerLinks: Array<object>;

selection: KnockoutRouterAdapter<CoreRouterDetail>;

isAuthenticated: ko.Observable<boolean>;



constructor() {

// handle announcements sent when pages change, for Accessibility.

this.manner = ko.observable("polite");

this.message = ko.observable();



// Initialize authentication state

this.isAuthenticated = ko.observable(this.checkAuthToken());


// Watch for changes in authentication state

this.isAuthenticated.subscribe((authenticated) => {

if (!authenticated && this.router) {

// If user becomes unauthenticated, redirect to login

this.router.go({ path: "login" });

}

});



let globalBodyElement: HTMLElement = document.getElementById("globalBody") as HTMLElement;

globalBodyElement.addEventListener("announce", this.announcementHandler, false);



// media queries for responsive layouts

let smQuery: string | null = ResponsiveUtils.getFrameworkQuery("sm-only");

if (smQuery){

this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);

}



let mdQuery: string | null = ResponsiveUtils.getFrameworkQuery("md-up");

if (mdQuery){

this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

}



const navData = [

{

path: "",

redirect: this.checkAuthToken() ? "dashboard" : "login"

}, // Redirect based on authentication status

{ path: "login", detail: { label: "Login", iconClass: "oj-ux-ico-user" } },

{ path: "dashboard", detail: { label: "Dashboard", iconClass: "oj-ux-ico-bar-chart" } },

{ path: "incidents", detail: { label: "Logs", iconClass: "oj-ux-ico-fire" } },

{ path: "customers", detail: { label: "Applications", iconClass: "oj-ux-ico-contact-group" } },

{ path: "customers", detail: { label: "User Management", iconClass: "oj-ux-ico-contact-group" } },

{ path: "about", detail: { label: "Settings", iconClass: "oj-ux-ico-information-s" } }

];


// router setup

const router = new CoreRouter(navData, {

urlAdapter: new UrlParamAdapter()

});


// Add route guard for authentication

router.beforeStateChange.subscribe((args) => {

const state = args.state;

const isLoginRoute = state?.path === "login";

const isAuthenticated = this.checkAuthToken();


// If not authenticated and trying to access non-login route, redirect to login

if (!isAuthenticated && !isLoginRoute) {

// Accept the navigation first, then redirect

args.accept(Promise.resolve());

setTimeout(() => {

router.go({ path: "login" });

}, 0);

return;

}


// If authenticated and trying to access login route, redirect to dashboard

if (isAuthenticated && isLoginRoute) {

// Accept the navigation first, then redirect

args.accept(Promise.resolve());

setTimeout(() => {

router.go({ path: "dashboard" });

}, 0);

return;

}


// Otherwise, allow the navigation

args.accept(Promise.resolve());

});


router.sync();

this.router = router;



this.moduleAdapter = new ModuleRouterAdapter(router);

this.selection = new KnockoutRouterAdapter(router);



// Setup the navDataProvider with protected routes only (excluding login and redirect route)

// Only show navigation items if user is authenticated

const protectedNavData = navData.slice(2); // Remove redirect and login routes

this.navDataProvider = new ArrayDataProvider(protectedNavData, {keyAttributes: "path"});



// drawer

this.sideDrawerOn = ko.observable(false);



// close drawer on medium and larger screens

this.mdScreen?.subscribe(() => {

this.sideDrawerOn(false);

});



// header

// application Name used in Branding Area

this.appName = ko.observable("LogTracker");


// user Info used in Global Navigation area - get from token if available

const userInfo = this.getUserInfoFromToken();

this.userLogin = ko.observable(this.getUserFromToken() || "Not logged in");

this.userEmail = ko.observable(userInfo?.email || "");

this.userInitials = ko.observable(this.getUserInitials());

this.isLoggingOut = ko.observable(false);


// footer

this.footerLinks = [

{name: 'About Oracle', linkId: 'aboutOracle', linkTarget:'http://www.oracle.com/us/corporate/index.html#menu-about'},

{ name: "Contact Us", id: "contactUs", linkTarget: "http://www.oracle.com/us/corporate/contact/index.html" },

{ name: "Legal Notices", id: "legalNotices", linkTarget: "http://www.oracle.com/us/legal/index.html" },

{ name: "Terms Of Use", id: "termsOfUse", linkTarget: "http://www.oracle.com/us/legal/terms/index.html" },

{ name: "Your Privacy Rights", id: "yourPrivacyRights", linkTarget: "http://www.oracle.com/us/legal/privacy/index.html" },

];


// Listen for authentication state changes

window.addEventListener('authStateChanged', (event: any) => {

const isAuth = event.detail.authenticated;

if (isAuth) {

this.isAuthenticated(true);

this.updateUserInfo();

}

});


// Check authentication status periodically (optional)

setInterval(() => {

const currentAuth = this.checkAuthToken();

if (currentAuth !== this.isAuthenticated()) {

this.isAuthenticated(currentAuth);

this.updateUserInfo();

}

}, 5000); // Check every 5 seconds


// release the application bootstrap busy state

Context.getPageContext().getBusyContext().applicationBootstrapComplete();

}



/**

* Check if user has valid authentication token

*/

private checkAuthToken(): boolean {

const token = localStorage.getItem('authToken');

if (!token) {

return false;

}


// You can add more sophisticated token validation here

// For now, just check if token exists

try {

// Basic validation - you might want to add expiration checks

return token.length > 0;

} catch (error) {

console.error('Error validating token:', error);

return false;

}

}



/**

* Get user information from stored token

*/

private getUserFromToken(): string | null {

const token = localStorage.getItem('authToken');

if (!token) {

return null;

}


try {

// Decode JWT token to get user info

// JWT has 3 parts separated by dots: header.payload.signature

const payload = JSON.parse(atob(token.split('.')[1]));


// Return user's name, fallback to email if name not available

return payload.name || payload.email || "Authenticated User";

} catch (error) {

console.error('Error decoding token:', error);

return "Authenticated User";

}

}



/**

* Get full user information from stored token

*/

private getUserInfoFromToken(): { name: string; email: string; userId: string } | null {

const token = localStorage.getItem('authToken');

if (!token) {

return null;

}


try {

// Decode JWT token to get user info

const payload = JSON.parse(atob(token.split('.')[1]));


return {

name: payload.name || 'Unknown User',

email: payload.email || 'Unknown Email',

userId: payload.userId || ''

};

} catch (error) {

console.error('Error decoding token:', error);

return null;

}

}



/**

* Get user's initials for display

*/

private getUserInitials(): string {

const userInfo = this.getUserInfoFromToken();

if (!userInfo || !userInfo.name) {

return "U";

}


const nameParts = userInfo.name.split(' ');

if (nameParts.length >= 2) {

return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();

} else {

return nameParts[0][0].toUpperCase();

}

}



/**

* Update all user information observables

*/

private updateUserInfo(): void {

const userInfo = this.getUserInfoFromToken();

if (userInfo) {

this.userLogin(userInfo.name);

this.userEmail(userInfo.email);

this.userInitials(this.getUserInitials());

} else {

this.userLogin("Not logged in");

this.userEmail("");

this.userInitials("U");

}

}



/**

* Logout user

*/

logout = async (): Promise<void> => {

// Prevent multiple simultaneous logout attempts

if (this.isLoggingOut()) {

return;

}



try {

this.isLoggingOut(true);

console.log('Logout initiated...');



// Get the current auth token before clearing it

const token = localStorage.getItem('authToken');


// Call backend logout endpoint to revoke tokens

if (token) {

try {

console.log('Calling backend logout endpoint...');

const response = await fetch('http://localhost:3000/auth/logout', {

method: 'POST',

headers: {

'Content-Type': 'application/json',

'Authorization': `Bearer ${token}`

}

});



if (response.ok) {

const data = await response.json();

console.log('Backend logout successful:', data.message);

} else {

console.warn('Backend logout failed:', response.status, response.statusText);

}

} catch (fetchError) {

console.error('Error calling backend logout:', fetchError);

// Continue with frontend logout even if backend fails

}

}



// Clear all authentication-related storage

localStorage.removeItem('authToken');

sessionStorage.clear(); // Clear any session storage that might contain auth data


// Clear any other auth-related localStorage items that might exist

const keysToRemove = [];

for (let i = 0; i < localStorage.length; i++) {

const key = localStorage.key(i);

if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {

keysToRemove.push(key);

}

}

keysToRemove.forEach(key => localStorage.removeItem(key));


this.isAuthenticated(false);

this.updateUserInfo(); // This will set all user info to logged out state


console.log('User logged out successfully');


// Use setTimeout to avoid router sync conflicts

if (this.router) {

setTimeout(() => {

this.router?.go({ path: "login" });

}, 0);

}


} catch (error) {

console.error('Logout error:', error);


// Even if logout fails, clear local storage and redirect

localStorage.removeItem('authToken');

sessionStorage.clear();

this.isAuthenticated(false);

this.updateUserInfo();


if (this.router) {

setTimeout(() => {

this.router?.go({ path: "login" });

}, 0);

}

} finally {

// Always reset the logging out state

this.isLoggingOut(false);

}

}



/**

* Handle menu actions (like logout)

*/

menuItemAction = (event: any): void => {

const value = event.detail.selectedValue;

switch (value) {

case "out":

this.logout();

break;

}

}



announcementHandler = (event: any): void => {

this.message(event.detail.message);

this.manner(event.detail.manner);

}



// called by navigation drawer toggle button and after selection of nav drawer item

toggleDrawer = (): void => {

this.sideDrawerOn(!this.sideDrawerOn());

}



// a close listener so we can move focus back to the toggle button when the drawer closes

openedChangedHandler = (event: CustomEvent): void => {

if (event.detail.value === false) {

const drawerToggleButtonElement = document.querySelector("#drawerToggleButton") as HTMLElement;

drawerToggleButtonElement.focus();

}

};

}



export default new RootViewModel();