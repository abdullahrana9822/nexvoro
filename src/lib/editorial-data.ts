import "server-only";
import { getSetting } from "@/lib/settings";
import { DEFAULT_STORIES, storiesSchema } from "@/lib/editorial";
export async function getStories() {
  const raw = await getSetting<unknown>("content.stories", DEFAULT_STORIES);
  const parsed = storiesSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_STORIES;
}
