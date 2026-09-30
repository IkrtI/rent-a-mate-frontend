import { ErrorStatusPage } from "@/components/shared/error-status-page";

export default function NotFound() {
  return (
    <ErrorStatusPage
      code="404"
      eyebrow="Page not found"
      title="This page wandered off."
      description="The link may be out of date, or the page may have moved. Let’s get you back to the good company."
    />
  );
}
