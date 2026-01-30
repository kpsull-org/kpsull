import Image from 'next/image';

interface AboutContent {
  text?: string;
  image?: string;
  imagePosition?: 'left' | 'right';
}

interface AboutSectionProps {
  title: string;
  content: AboutContent;
}

export function AboutSection({ title, content }: AboutSectionProps) {
  const { text, image, imagePosition = 'right' } = content;

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
        <div
          className={`flex flex-col ${
            imagePosition === 'left' ? 'md:flex-row-reverse' : 'md:flex-row'
          } gap-8 items-center`}
        >
          <div className="flex-1">
            {text && (
              <p className="text-lg text-muted-foreground leading-relaxed">
                {text}
              </p>
            )}
          </div>
          {image && (
            <div className="flex-1">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
