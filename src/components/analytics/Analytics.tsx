import { GoogleAnalytics } from "@next/third-parties/google";

export function Analytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_ID;
  if (!measurementId) return null;
  return <GoogleAnalytics gaId={measurementId} />;
}
