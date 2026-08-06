import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

export const SHOP_CACHE_TAG = "shop-settings";

/**
 * The shop layout (header) looks this up on every single navigation. It rarely
 * changes, so cache it instead of hitting Postgres on every page load — settings
 * updates call revalidateTag(SHOP_CACHE_TAG) to bust this immediately.
 */
export const getShop = unstable_cache(() => prisma.shop.findFirst(), ["shop-settings"], {
  tags: [SHOP_CACHE_TAG],
});
