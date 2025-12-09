import { redirect } from 'next/navigation';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Redirect to admin dashboard by default
  // RouteGuard will handle showing ForbiddenAccess if user is not authenticated
  redirect(`/${locale}/admin`);
}
