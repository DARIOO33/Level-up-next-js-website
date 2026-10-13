import type { Metadata } from 'next';
import { ResetPassword } from '@/components/auth/PasswordForms';

export const metadata: Metadata = { title: 'Reset password', robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  const { token } = await searchParams;
  return <ResetPassword token={typeof token === 'string' ? token : ''} />;
}
