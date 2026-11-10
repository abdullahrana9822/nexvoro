import { ExperienceWorlds } from "@/components/store/experience-worlds";
export const metadata = {
  title: "Ten worlds. One NEXVORO.",
  description:
    "Explore cinematic electronics collections: gaming, audio, creative workspaces, smart homes and more.",
};
export default function Experiences() {
  return <ExperienceWorlds full />;
}
