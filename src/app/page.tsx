'use client';

import { useState, useEffect } from 'react';
import ImageCropper from '@/components/ImageCropper';

export default function Home() {
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [croppedImage, setCroppedImage] = useState<string>('');
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
  }, []);

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

  const handleDownload = () => {
    if (croppedImage) {
      const link = document.createElement('a');
      link.href = croppedImage;
      link.download = 'cropped-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-8 items-center max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">Image Trimmer</h1>
        
        <div className="w-full space-y-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setAspectRatio(undefined)}
              className={`px-4 py-2 rounded-full ${!aspectRatio ? 'bg-foreground text-background' : 'border border-foreground'}`}
            >
              Free
            </button>
            <button
              onClick={() => setAspectRatio(1)}
              className={`px-4 py-2 rounded-full ${aspectRatio === 1 ? 'bg-foreground text-background' : 'border border-foreground'}`}
            >
              1:1
            </button>
            <button
              onClick={() => setAspectRatio(16/9)}
              className={`px-4 py-2 rounded-full ${aspectRatio === 16/9 ? 'bg-foreground text-background' : 'border border-foreground'}`}
            >
              16:9
            </button>
            <button
              onClick={() => setAspectRatio(4/3)}
              className={`px-4 py-2 rounded-full ${aspectRatio === 4/3 ? 'bg-foreground text-background' : 'border border-foreground'}`}
            >
              4:3
            </button>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                placeholder="Width"
                value={customWidth}
                className="w-20 px-3 py-2 rounded-full border border-foreground text-sm"
                onChange={(e) => handleCustomRatioChange('width', e.target.value)}
              />
              <span>:</span>
              <input
                type="number"
                min="1"
                placeholder="Height"
                value={customHeight}
                className="w-20 px-3 py-2 rounded-full border border-foreground text-sm"
                onChange={(e) => handleCustomRatioChange('height', e.target.value)}
              />
            </div>
          </div>
          
          <ImageCropper
            aspectRatio={aspectRatio}
            onCropComplete={setCroppedImage}
          />

          {croppedImage && (
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-xl font-semibold">Preview</h2>
              <img
                src={croppedImage}
                alt="Cropped preview"
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
              <button
                onClick={handleDownload}
                className="rounded-full bg-foreground text-background px-6 py-2 hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
              >
                Download
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
