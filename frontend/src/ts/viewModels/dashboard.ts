/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
   
import * as ko from "knockout";
import MutableArrayDataProvider = require("ojs/ojmutablearraydataprovider");
import "ojs/ojselectsingle";
import "ojs/ojlabel";

import * as AccUtils from "../accUtils";


type ChartType = {
  value: string;
  label: string;
};

class DashboardViewModel {

  chartTypes: Array<Object>;
  chartTypesDP: MutableArrayDataProvider<ChartType["value"], ChartType>;
  val: ko.Observable<string>;
   
   constructor() {
   this.chartTypes = [
      { value: "pie", label: "Pie" },
      { value: "bar", label: "Bar" },
      ];
   
   this.chartTypesDP = new MutableArrayDataProvider<
      ChartType["value"],
      ChartType
      >(this.chartTypes, {
      keyAttributes: "value",
      });
    this.val = ko.observable("pie");

  } // End constructor

  /**
   * Optional ViewModel method invoked after the View is inserted into the
   * document DOM.  The application can put logic that requires the DOM being
   * attached here.
   * This method might be called multiple times - after the View is created
   * and inserted into the DOM and after the View is reconnected
   * after being disconnected.
   */
  connected(): void {
    AccUtils.announce("Dashboard page loaded.");
    document.title = "Dashboard";
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

export = DashboardViewModel;
