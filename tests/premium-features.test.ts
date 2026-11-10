import { describe, expect, it } from "vitest";
import { THEMES, isThemeId } from "@/lib/constants";
import { appearanceSchema, onBrandColor } from "@/lib/appearance";
import { DEFAULT_STORIES, storiesSchema } from "@/lib/editorial";
import { productQuerySchema } from "@/lib/validation";

describe("premium theme settings", () => {
 it("offers all five flagship identities with unique IDs", () => {
  for (const name of ["Midnight Luxury","Arctic Minimal","Cyber Neon","Royal Purple","Titanium Pro"]) expect(THEMES.some(theme=>theme.name===name)).toBe(true);
  expect(new Set(THEMES.map(theme=>theme.id)).size).toBe(THEMES.length);
 });
 it("validates theme, typography and color configuration", () => {
  expect(isThemeId("titanium")).toBe(true);
  expect(appearanceSchema.safeParse({defaultTheme:"titanium",defaultFont:"inter",allowCustomerThemes:true,brandColor:"#111111"}).success).toBe(true);
  expect(appearanceSchema.safeParse({defaultTheme:"unknown",defaultFont:"inter",allowCustomerThemes:true}).success).toBe(false);
  expect(appearanceSchema.safeParse({defaultTheme:"dark",defaultFont:"inter",allowCustomerThemes:true,brandColor:"url(javascript:bad)"}).success).toBe(false);
 });
 it("chooses contrasting button text",()=>{expect(onBrandColor("#ffffff")).toBe("#111111");expect(onBrandColor("#000000")).toBe("#ffffff");});
});
describe("real editorial content",()=>{
 it("ships validated, substantive original guides",()=>{expect(storiesSchema.safeParse(DEFAULT_STORIES).success).toBe(true);expect(DEFAULT_STORIES.length).toBe(3);});
 it("rejects duplicate slugs and unsafe destination URLs",()=>{expect(storiesSchema.safeParse([DEFAULT_STORIES[0],DEFAULT_STORIES[0]]).success).toBe(false);expect(storiesSchema.safeParse([{...DEFAULT_STORIES[0],collection:"javascript:alert(1)"}]).success).toBe(false);});
});
describe("recently viewed catalogue requests",()=>{
 it("accepts bounded UUID lists",()=>{expect(productQuerySchema.parse({ids:"00000000-0000-4000-8000-000000000001"}).ids).toHaveLength(1);});
 it("rejects invalid and oversized history requests",()=>{expect(productQuerySchema.safeParse({ids:"not-an-id"}).success).toBe(false);expect(productQuerySchema.safeParse({ids:Array(13).fill("00000000-0000-4000-8000-000000000001").join(",")}).success).toBe(false);});
});
