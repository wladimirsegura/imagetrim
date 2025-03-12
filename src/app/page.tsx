'use client';

import { useState, useEffect } from 'react';
import ImageCropper from '@/components/ImageCropper';

export default function Home() {
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [customWidth, setCustomWidth] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('customWidth') || '';
    }
    return '';
  });
  const [customHeight, setCustomHeight] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('customHeight') || '';
    }
    return '';
  });

  useEffect(() => {
    if (customWidth && customHeight) {
      const width = parseFloat(customWidth);
      const height = parseFloat(customHeight);
      if (width > 0 && height > 0) {
        setAspectRatio(width / height);
      }
    }
  }, [customWidth, customHeight, setAspectRatio]);

  const handleCustomRatioChange = (type: 'width' | 'height', value: string) => {
    if (type === 'width') {
      setCustomWidth(value);
      localStorage.setItem('customWidth', value);
      const height = parseFloat(customHeight || '0');
      const width = parseFloat(value || '0');
      if (width > 0 && height > 0) {
        setAspectRatio(width / height);
      }
    } else {
      setCustomHeight(value);
      localStorage.setItem('customHeight', value);
      const width = parseFloat(customWidth || '0');
      const height = parseFloat(value || '0');
      if (width > 0 && height > 0) {
        setAspectRatio(width / height);
      }
    }
  };

  return (
    <div className="max-w-screen min-h-screen p-4 md:p-6 lg:p-8">
      <main className="flex flex-col gap-4 items-center max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center px-4">Image Trimmer </h1>
        <h2>by W.Segura © 2025 March v1.1</h2>
        
        <div className="w-full max-w-[1200px] mx-auto px-2 md:px-4">
          <div className="flex flex-wrap gap-2 md:gap-4 justify-center mb-4">
            <button
              onClick={() => setAspectRatio(undefined)}
              className={`px-3 md:px-4 py-2 rounded-md ${!aspectRatio ? 'bg-foreground text-background' : 'border border-foreground'}`}
            >
              Free
            </button>
            <button
              onClick={() => setAspectRatio(1)}
              className={`px-3 md:px-4 py-2 rounded-md ${aspectRatio === 1 ? 'bg-foreground text-background' : 'border border-foreground'}`}
            >
              1:1
            </button>
            <button
              onClick={() => setAspectRatio(16/9)}
              className={`px-3 md:px-4 py-2 rounded-md ${aspectRatio === 16/9 ? 'bg-foreground text-background' : 'border border-foreground'}`}
            >
              16:9
            </button>
            <button
              onClick={() => setAspectRatio(4/3)}
              className={`px-3 md:px-4 py-2 rounded-md ${aspectRatio === 4/3 ? 'bg-foreground text-background' : 'border border-foreground'}`}
            >
              4:3
            </button>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                placeholder="横幅"
                value={customWidth}
                className="w-16 md:w-20 px-2 md:px-3 py-2 rounded-md border border-foreground text-sm"
                onChange={(e) => handleCustomRatioChange('width', e.target.value)}
              />
              <span>:</span>
              <input
                type="number"
                min="1"
                placeholder="高さ"
                value={customHeight}
                className="w-16 md:w-20 px-2 md:px-3 py-2 rounded-md border border-foreground text-sm"
                onChange={(e) => handleCustomRatioChange('height', e.target.value)}
              />
            </div>
          </div>
          
          <ImageCropper
            aspectRatio={aspectRatio}
          />
        </div>
      </main>
    </div>
  );
}
