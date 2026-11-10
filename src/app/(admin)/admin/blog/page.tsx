import { getStories } from "@/lib/editorial-data";
import { SettingsJsonEditor } from "@/components/admin/settings-json-editor";
export default async function AdminBlogPage(){return <div><h1 className="mb-6 text-2xl font-bold">Journal management</h1><SettingsJsonEditor settingKey="content.stories" group="content" label="Editorial stories" description="Edit original guides: slug, title, category (Buying guide / Technology explained / Workspace), summary, paragraphs and /shop collection URL. Saved stories are validated and appear on the public Journal." value={await getStories()} /></div>}
