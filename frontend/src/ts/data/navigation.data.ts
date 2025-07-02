// navigation.data.ts

import { CoreRouterDetail } from "../app.types";

export const navData: Array<{
  path: string;
  redirect?: string;
  detail?: CoreRouterDetail;
}> = [
  {
    path: "",
    redirect: "dashboard", // Default redirect, will be guarded
  },
  {
    path: "login",
    detail: { label: "Login", iconClass: "oj-ux-ico-user" },
  },
  {
    path: "dashboard",
    detail: { label: "Dashboard", iconClass: "oj-ux-ico-bar-chart" },
  },
  {
    path: "incidents",
    detail: { label: "Logs", iconClass: "oj-ux-ico-fire" },
  },
  {
    path: "customers",
    detail: { label: "Applications", iconClass: "oj-ux-ico-contact-group" },
  },
  {
    path: "userManagement",
    detail: {
      label: "User Management",
      iconClass: "oj-ux-ico-contact-group",
    },
  },
  {
    path: "about",
    detail: { label: "Settings", iconClass: "oj-ux-ico-information-s" },
  },
];