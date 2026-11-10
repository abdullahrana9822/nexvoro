import { RecentlyViewed } from "@/components/store/recently-viewed";
export const metadata = { title: "Recently viewed", robots: { index: false, follow: false } };
export default function RecentlyViewedPage() { return <RecentlyViewed standalone />; }
