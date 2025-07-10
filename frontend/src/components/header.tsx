/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import { h } from "preact";
import { useRef, useState, useEffect } from "preact/hooks";
import * as ResponsiveUtils from "ojs/ojresponsiveutils";
import "ojs/ojtoolbar";
import "ojs/ojmenu";
import "ojs/ojbutton";
import axios from "../api/axios"; // Adjust the import path as necessary

type Props = Readonly<{
  appName: string,
  userLogin: string
}>;

export function Header({ appName, userLogin }: Props) {
  const mediaQueryRef = useRef<MediaQueryList>(window.matchMedia(ResponsiveUtils.getFrameworkQuery("sm-only")!));
  
  const [isSmallWidth, setIsSmallWidth] = useState(mediaQueryRef.current.matches);

  useEffect(() => {
    mediaQueryRef.current.addEventListener("change", handleMediaQueryChange);
    return (() => mediaQueryRef.current.removeEventListener("change", handleMediaQueryChange));
  }, [mediaQueryRef]);

  function handleMediaQueryChange(e: MediaQueryListEvent) {
    setIsSmallWidth(e.matches);
  }

  function getDisplayType() {
    return (isSmallWidth ? "icons" : "all");
  };

  function getEndIconClass() {
    return (isSmallWidth ? "oj-icon demo-appheader-avatar" : "oj-component-icon oj-button-menu-dropdown-icon");
  }

  async function handleSignOut() {
    //first, make a request to the backend to sign out
    try {
      await axios.post(`/auth/logout`, {});
      
      //then, redirect to the login page
      window.location.href = "/login";
    }
    catch (error) {
      console.error("Sign out failed:", error);
      // Can show the error here later with a banner 
    }
  }

  return (
    <header role="banner" class="oj-web-applayout-header">
      <div class="oj-flex-bar oj-sm-align-items-center" style="width: 100%; padding: 0 16px;">
        <div class="oj-flex-bar-middle oj-sm-align-items-baseline">
        <img class="oj-icon demo-oracle-icon"
              title="Oracle Logo"
              alt="Oracle Logo"/>
          <h1
            class="oj-sm-only-hide oj-web-applayout-header-title"
            title="Application Name">
            {appName}
          </h1>
        </div>
        <div class="oj-flex-bar-end">
        <oj-toolbar>
          <oj-menu-button id="userMenu" display={getDisplayType()} chroming="borderless">
            <span>{userLogin}</span>
            <span slot="endIcon" class={getEndIconClass()}></span>
            <oj-menu id="menu1" slot="menu">
              <oj-option id="pref" value="pref">Preferences</oj-option>
              <oj-option id="help" value="help">Help</oj-option>
              <oj-option id="about" value="about">About</oj-option>
              <oj-option id="out" value="out" onClick={handleSignOut}>Sign Out</oj-option>
            </oj-menu>
          </oj-menu-button>
        </oj-toolbar>
        </div>
      </div>
    </header>
  );  
}
