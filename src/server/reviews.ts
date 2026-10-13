import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import type { Order } from '@/lib/types';
import { isObjectId } from '@/lib/utils';

/** One pending review (with its one-time token) per order line. */
export async function createReviewTokens(order: Order) {
  const tokens: { productName: string; token: string }[] = [];
  for (const item of order.items) {
    const token = randomBytes(24).toString('hex');
    await db.orm.storereviews.create({
      orderId: order.id,
      productName: item.productName,
      productId: isObjectId(item.product) ? item.product : null,
      token,
      isApproved: false,
      showName: true,
      rating: null,
      comment: null,
      source: 'website',
    });
    tokens.push({ productName: item.productName, token });
  }
  return tokens;
}
