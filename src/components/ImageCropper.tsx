'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullViewport, setIsFullViewport] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isPanning) {
        e.preventDefault();
        setIsPanning(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanning) {
      e.preventDefault();
      setPanStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStart) {
      e.preventDefault();
      const newX = e.clientX - panStart.x;
      const newY = e.clientY - panStart.y;
      setImagePosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setPanStart(null);
    }
  };

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
    <div className="w-full max-w-[95vw] mx-auto px-4">
      <div className="w-full flex flex-wrap items-center gap-4 mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          className="flex-1 text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-foreground file:text-background
            hover:file:bg-[#383838] dark:hover:file:bg-[#ccc]"
        />
        {src && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
              className="rounded-full bg-foreground text-background px-3 py-1 hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors whitespace-nowrap"
            >
              -
            </button>
            <span className="text-sm">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              className="rounded-full bg-foreground text-background px-3 py-1 hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors whitespace-nowrap"
            >
              +
            </button>
            <button
              onClick={getCroppedImg}
              className="rounded-md bg-foreground text-background px-4 py-2 hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors whitespace-nowrap"
            >
              Crop Image
            </button>
          </div>
        )}
      </div>
      {src && (
        <ReactCrop
          crop={crop}
          onChange={(c) => !isPanning && setCrop(c)}
          onComplete={(c) => !isPanning && setCompletedCrop(c)}
          aspect={aspectRatio}
          className="max-w-full overflow-hidden"
          disabled={isPanning}
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={src}
            style={{
              transform: `scale(${zoom}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
              cursor: isPanning ? 'grab' : 'default',
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            className="max-h-[80vh] w-auto mx-auto"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </ReactCrop>
      )}

      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-8 rounded-md max-w-2xl w-full mx-4 relative">
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
                className="max-w-full h-auto rounded-md shadow-lg"
              />
              <button
                onClick={handleDownload}
                className="rounded-md bg-foreground text-background px-6 py-2 hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
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