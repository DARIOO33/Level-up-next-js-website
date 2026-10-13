import { NextResponse, type NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getSessionUser, isAdmin } from '@/server/session';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const json = (message: string, status: number) => NextResponse.json({ status: 'fail', message }, { status });

/**
 * POST /api/upload — admin only. multipart/form-data with a single "file".
 * Streams the image to Cloudinary (same `levelup/products` folder as before) and returns { url, publicId }.
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return json('Authentication required', 401);
  if (!isAdmin(user)) return json('You do not have permission to perform this action', 403);

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return json('Image uploads are not configured (missing Cloudinary credentials). Paste an image URL instead.', 503);
  }
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return json('No file provided', 400);
  if (!ALLOWED_TYPES.includes(file.type)) return json('Only JPEG, PNG, WebP, and GIF images are allowed', 415);
  if (file.size > MAX_BYTES) return json('File exceeds 5 MB limit', 413);

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'levelup/products', resource_type: 'image' }, (error, data) => (error || !data ? reject(error) : resolve(data)))
        .end(buffer);
    });
    return NextResponse.json({ status: 'success', url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error('[upload]', error);
    return json('Upload failed. Please try again.', 502);
  }
}
