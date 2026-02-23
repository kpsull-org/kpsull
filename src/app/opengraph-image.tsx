import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "KPSULL - L'antidote à l'uniforme";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          KPSULL
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#a3a3a3',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          {"L'antidote à l'uniforme"}
        </div>
        <div
          style={{
            marginTop: 16,
            width: 64,
            height: 3,
            background: '#ffffff',
            borderRadius: 2,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
