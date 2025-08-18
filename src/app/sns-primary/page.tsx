'use client';

import PageLayout from "@/components/layouts/PageLayout";
import SnsPrimaryCourse from "@/components/SnsPrimaryCourse";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <PageLayout
      title="SNS: Primary Domain & Community Setup"
      subtitle="Set primary, confirm on Solscan, add a PFP, and verify in Discord."
      showHomeButton={true}
      showBackButton={true}
      backHref="/courses"
      backgroundImage=""
      backgroundOverlay={false}
    >
      <SnsPrimaryCourse
        // Use standalone mode since we don't have the course progress system yet
        useShellProgress={false}
        buttonVariant="default"
      />
    </PageLayout>
  );
}
