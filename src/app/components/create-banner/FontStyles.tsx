import { projectId } from '../../../../utils/supabase/info';

export const FontStyles = () => {
  const baseUrl = `https://${projectId}.supabase.co/storage/v1/object/public/fonts_display`;

  return (
    <style>{`
      @font-face {
        font-family: 'Tiket Odyssey Display';
        src: url('${baseUrl}/TiketOdysseyDisplay-Regular.woff2') format('woff2'),
             url('${baseUrl}/TiketOdysseyDisplay-Regular.woff') format('woff');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Tiket Odyssey Display';
        src: url('${baseUrl}/TiketOdysseyDisplay-SemiBold.woff2') format('woff2'),
             url('${baseUrl}/TiketOdysseyDisplay-SemiBold.woff') format('woff');
        font-weight: 600;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Tiket Odyssey Display';
        src: url('${baseUrl}/TiketOdysseyDisplay-Bold.woff2') format('woff2'),
             url('${baseUrl}/TiketOdysseyDisplay-Bold.woff') format('woff');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Tiket Odyssey Display';
        src: url('${baseUrl}/TiketOdysseyDisplay-ExtraBold.woff2') format('woff2'),
             url('${baseUrl}/TiketOdysseyDisplay-ExtraBold.woff') format('woff');
        font-weight: 800;
        font-style: normal;
        font-display: swap;
      }

      .font-banner {
        font-family: 'Tiket Odyssey Display', sans-serif !important;
      }
    `}</style>
  );
};
