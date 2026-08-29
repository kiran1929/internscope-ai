import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default async function ResumeOptimizeJobRedirect({ params }: PageProps) {
  const { jobId } = await params;
  redirect(`/resume?tab=ats&job=${jobId}`);
}
