'use client';

import { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  aspectRatio?: number;
  onCropComplete?: (croppedImage: string) => void;
}

export default function ImageCropper({ aspectRatio, onCropComplete }: ImageCropperProps) {
  const [src, setSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const imgRef = useRef<HTMLImageElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (reader.result) {
          setSrc(reader.result.toString());
        }
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getCroppedImg = () => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    const base64Image = canvas.toDataURL('image/jpeg');
    setPreviewImage(base64Image);
    setShowPreview(true);
    if (onCropComplete) {
      onCropComplete(base64Image);
    }
  };

  const handleDownload = () => {
    if (previewImage) {
      const link = document.createElement('a');
      link.href = previewImage;
      link.download = 'cropped-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto">
      <div className="w-full flex items-center gap-4">
        <input
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          className="flex-1 text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-foreground file:text-background
            hover:file:bg-[#383838] dark:hover:file:bg-[#ccc]"
        />
        {src && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
              className="rounded-full bg-foreground text-background px-4 py-2 hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors whitespace-nowrap"
            >
              -
            </button>
            <span className="text-sm">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              className="rounded-full bg-foreground text-background px-4 py-2 hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors whitespace-nowrap"
            >
              +
            </button>
            <button
              onClick={getCroppedImg}
              className="rounded-full bg-foreground text-background px-4 py-2 hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors whitespace-nowrap ml-2"
            >
              Crop Image
            </button>
          </div>
        )}
      </div>
      {src && (
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={aspectRatio}
          className="max-w-full"
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={src}
            style={{ transform: `scale(${zoom})` }}
            className="max-w-full h-auto transform-origin-center"
          />
        </ReactCrop>
      )}

      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-8 rounded-lg max-w-2xl w-full mx-4 relative">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 text-foreground hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-xl font-semibold">Preview</h2>
              <img
                src={previewImage}
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
          </div>
        </div>
      )}
    </div>
  );
}