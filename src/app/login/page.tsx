import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthView } from '@/components/auth/AuthView';
import { getSessionUser } from '@/server/session';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

/** Only same-site paths are accepted as a post-login destination. */
const safeNext = (value: unknown) => (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/');

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const user = await getSessionUser();
  // A freshly registered user stays here for the optional "first address" step.
  const onboarding = user && params.step === 'address' ? { name: user.name, phone: user.phoneNumber } : null;
  if (user && !onboarding) redirect(next);
  return <AuthView next={next} initialMode={params.mode === 'register' ? 'register' : 'login'} onboarding={onboarding} />;
}
