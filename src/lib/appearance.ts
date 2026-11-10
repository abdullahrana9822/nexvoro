import { z } from "zod";
import { isFontId, isThemeId } from "@/lib/constants";
const hex = z.string().regex(/^$|^#[0-9a-fA-F]{6}$/);
export const appearanceSchema = z.object({
  defaultTheme: z.string().refine(isThemeId),
  defaultFont: z.string().refine(isFontId),
  allowCustomerThemes: z.boolean(),
  brandColor: hex.optional(), accentColor: hex.optional(),
});

/** Select the higher-contrast foreground for an administrator's brand color. */
export function onBrandColor(hex: string): "#111111" | "#ffffff" {
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
  return luminance > 0.179 ? "#111111" : "#ffffff";
}
