import React, { useEffect } from 'react';

interface AdBannerProps {
  slotId?: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ slotId = "DEFAULT_SLOT", format = "auto", className = "" }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense Error:', err);
    }
  }, []);

  // For development or when Publisher ID isn't set, show a placeholder
  const isDev = import.meta.env.DEV;

  if (isDev) {
    return (
      <div className={`w-full bg-secondary/30 border border-border/50 text-muted-foreground flex items-center justify-center p-4 rounded-lg my-4 h-[100px] text-sm \${className}`}>
        [ مساحة إعلانية - Ad Slot: {slotId} ]
      </div>
    );
  }

  return (
    <div className={`w-full text-center my-4 overflow-hidden \${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-YOUR_AD_CLIENT_ID" // قم بتغيير هذا الآيدي
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdBanner;
