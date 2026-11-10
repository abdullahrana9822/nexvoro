import { ThemeStudio } from "@/components/themes/theme-studio";
export const metadata = {
  title: "Theme Studio — Choose Your Experience",
  description:
    "Explore five signature NEXVORO worlds. Preview, customize and apply your personal shopping experience.",
};
export default function ThemesPage() {
  return (
    <div className="container-page py-8">
      <div className="overflow-hidden rounded-3xl border border-border bg-bg-elevated">
        <ThemeStudio />
      </div>
    </div>
  );
}
