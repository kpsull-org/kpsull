const CLOUDINARY_CLOUD_NAME = 'damucxy2t';

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Si l'URL est déjà complète (http/https), la retourner telle quelle
  if (src.startsWith('http')) {
    return src;
  }
  const params = ['f_auto', `q_${quality ?? 'auto'}`, `w_${width}`].join(',');
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${params}/${src}`;
}
