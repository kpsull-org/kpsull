import { v2 as cloudinary } from 'cloudinary';
import * as path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGES_TO_UPLOAD = [
  { local: 'public/images/hero-skater.png', publicId: 'kpsull/static/hero-skater' },
  { local: 'public/images/tartan-pattern.png', publicId: 'kpsull/static/tartan-pattern' },
  { local: 'public/images/separator-tartan.png', publicId: 'kpsull/static/separator-tartan' },
  { local: 'public/images/tartan-stripe.png', publicId: 'kpsull/static/tartan-stripe' },
  { local: 'public/images/cleaning-icons.png', publicId: 'kpsull/static/cleaning-icons' },
  { local: 'public/images/hero-about.png', publicId: 'kpsull/static/hero-about' },
];

async function uploadStaticImages() {
  console.log('🚀 Upload des images statiques vers Cloudinary...\n');

  for (const image of IMAGES_TO_UPLOAD) {
    const localPath = path.join(process.cwd(), image.local);

    try {
      console.log(`⬆️  Upload: ${image.local} → ${image.publicId}`);
      const result = await cloudinary.uploader.upload(localPath, {
        public_id: image.publicId,
        overwrite: true,
      });
      console.log(`✅ OK: ${result.secure_url}`);
      console.log(`   Dimensions: ${result.width}x${result.height}`);
      console.log(`   Taille: ${Math.round(result.bytes / 1024)}KB\n`);
    } catch (err) {
      console.error(`❌ Erreur pour ${image.local}:`, err);
    }
  }

  console.log('✅ Upload terminé !');
  console.log('\nURLs Cloudinary (format f_auto,q_auto) :');
  for (const image of IMAGES_TO_UPLOAD) {
    console.log(
      `  ${image.publicId} → https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${image.publicId}`,
    );
  }
}

await uploadStaticImages();
