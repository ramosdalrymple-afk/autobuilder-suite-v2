export const sidebarPanelNames = [
  "assets",
  "components",
  "navigator",
  "pages",
  "marketplace",
  "resources",
] as const;

export type SidebarPanelName = (typeof sidebarPanelNames)[number] | "none";
