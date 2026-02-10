import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cloudinary } from '@/lib/cloudinary';
import { validateImageFile } from '@/lib/utils/file-validation';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB for avatars

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json(
      { error: 'Aucun fichier fourni' },
      { status: 400 }
    );
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return NextResponse.json(
      { error: 'Le fichier ne doit pas depasser 5 MB' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateImageFile(buffer, file.name);

  if (validation.isFailure) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  try {
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: 'kpsull/avatars',
      public_id: `user_${session.user.id}`,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    return NextResponse.json({ url: result.secure_url });
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload. Veuillez reessayer.' },
      { status: 500 }
    );
  }
}
