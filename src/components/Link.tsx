'use client';
import NextLink from 'next/link';
import type { ComponentProps } from 'react';
import { useLocalePath } from '@/i18n/client';

/** `next/link` that keeps the visitor in their language: `/shop` becomes `/fr/shop` on the French site. */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const localize = useLocalePath();
  return <NextLink href={typeof href === 'string' ? localize(href) : href} {...props} />;
}
