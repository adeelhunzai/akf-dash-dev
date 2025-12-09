'use client';

import { useGetCurrentUserQuery } from '@/lib/store/api/userApi';

export default function TestWordpressPage() {
  const { data, error, isLoading } = useGetCurrentUserQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <pre>{JSON.stringify(error, null, 2)}</pre>;

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}