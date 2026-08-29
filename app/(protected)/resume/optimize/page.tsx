import { redirect } from 'next/navigation';

export default function ResumeOptimizeRedirect() {
  redirect('/resume?tab=ats');
}
