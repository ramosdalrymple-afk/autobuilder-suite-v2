/**
 * Strapi CMS Connection State
 * 
 * Manages the connection state between Webstudio and Strapi CMS.
 * This state is shared across Resources panel and Assets panel.
 */

import { atom } from "nanostores";

/**
 * Whether the Strapi CMS is connected.
 * When false, Strapi-related features are hidden/disabled.
 */
export const $isStrapiConnected = atom<boolean>(true);

/**
 * Connect to Strapi CMS
 */
export const connectStrapi = () => {
  $isStrapiConnected.set(true);
};

/**
 * Disconnect from Strapi CMS
 */
export const disconnectStrapi = () => {
  $isStrapiConnected.set(false);
};
