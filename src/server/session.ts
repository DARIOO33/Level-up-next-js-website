import { cache } from 'react';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import type { ActionResult, Role, SessionUser } from '@/lib/types';

/** The signed-in user for this request, or null. Deduplicated per render. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return null;
  const u = session.user;
  const role = (['user', 'admin', 'owner'] as const).includes(u.role as Role) ? (u.role as Role) : 'user';
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role,
    avatar: u.image ?? null,
    phoneNumber: u.phoneNumber ?? null,
  };
});

export const isAdmin = (user: SessionUser | null): boolean => user?.role === 'admin' || user?.role === 'owner';

export const fail = (message: string, code?: string): ActionResult<never> => ({ ok: false, message, code });
export const ok = <T = undefined>(data?: T, message?: string): ActionResult<T> => ({ ok: true, data: data as T, message });

/** Thrown inside actions to answer with a clean failure instead of a 500. */
export class ActionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new ActionError('Authentication required', 'unauthenticated');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user)) throw new ActionError('You do not have permission to perform this action', 'forbidden');
  return user;
}

/** Wraps an action body: ActionErrors become failures, anything else is logged and hidden. */
export async function run<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ActionError) return { ok: false, message: error.message, code: error.code };
    // Next.js control-flow errors (redirect/notFound) must keep propagating.
    if (error && typeof error === 'object' && 'digest' in error && String((error as { digest: unknown }).digest).startsWith('NEXT_')) throw error;
    console.error('[action]', error);
    return { ok: false, message: 'Something went wrong. Please try again.' };
  }
}
