'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [imageFormat, setImageFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [imageQuality, setImageQuality] = useState<number>(0.92);
  const imgRef = useRef<HTMLImageElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      const rect = e.currentTarget.getBoundingClientRect();
      setPanStart({
        x: e.clientX - rect.left - imagePosition.x,
        y: e.clientY - rect.top - imagePosition.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStart) {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const newX = e.clientX - rect.left - panStart.x;
      const newY = e.clientY - rect.top - panStart.y;
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

  const getCroppedImg = async () => {
    if (!completedCrop || !imgRef.current) return;
    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Failed to get canvas context');

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

      const base64Image = canvas.toDataURL(imageFormat, imageQuality);
      setPreviewImage(base64Image);
      setShowPreview(true);
      if (onCropComplete) {
        onCropComplete(base64Image);
      }
    } catch (error) {
      console.error('Error generating crop:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
    setPreviewImage('');
    setCompletedCrop(undefined);
    setCrop(undefined);
    setImageFormat('image/jpeg');
    setImageQuality(0.92);
    setZoom(1);
    setImagePosition({ x: 0, y: 0 });
  }, [setShowPreview, setPreviewImage, setCompletedCrop, setCrop, setImageFormat, setImageQuality, setZoom, setImagePosition]);

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPreview) {
        handleClosePreview();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [showPreview, handleClosePreview]);

  const handleDownload = () => {
    if (previewImage) {
      const link = document.createElement('a');
      link.href = previewImage;
      link.download = `cropped-image.${imageFormat === 'image/jpeg' ? 'jpg' : 'png'}`;
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
              className="rounded-full bg-foreground text-background px-6 py-2 hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors whitespace-nowrap"
              disabled={!completedCrop?.width || !completedCrop?.height}
            >
              Crop Image
            </button>
          </div>
        )}
      </div>

      {src && (
        <div
          className="relative overflow-hidden w-full max-w-full"
          style={{ aspectRatio: aspectRatio ? `${aspectRatio}` : 'auto' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {src && (
            <ReactCrop
              crop={crop}
              onChange={(c) => !isPanning && setCrop(c)}
              onComplete={(c) => !isPanning && setCompletedCrop(c)}
              aspect={aspectRatio}
              disabled={isPanning}
            >
              <div
                style={{
                  transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoom})`,
                  transition: isPanning ? 'none' : 'transform 0.3s',
                  cursor: isPanning ? (panStart ? 'grabbing' : 'grab') : 'default'
                }}
              >
                <Image
                  ref={imgRef}
                  alt="Crop me"
                  src={src}
                  width={800}
                  height={600}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
            </ReactCrop>
          )}
        </div>
      )}

      {mounted && showPreview && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-title"
          onClick={handleClosePreview}
          onKeyDown={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          <div 
            className="bg-background p-6 rounded-lg max-w-4xl w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            style={{ 
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 id="preview-title" className="text-xl font-semibold">Preview</h2>
              <button
                onClick={handleClosePreview}
                className="text-foreground hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            {isProcessing ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center">
                  <Image
                    src={previewImage}
                    alt="Cropped preview"
                    width={800}
                    height={600}
                    className="max-w-full h-auto rounded-lg shadow-lg"
                    style={{ width: 'auto', height: 'auto', maxHeight: '70vh' }}
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                  <select
                    value={imageFormat}
                    onChange={(e) => setImageFormat(e.target.value as 'image/jpeg' | 'image/png')}
                    className="px-3 py-2 rounded-md bg-background border border-foreground"
                  >
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/png">PNG</option>
                  </select>
                  {imageFormat === 'image/jpeg' && (
                    <div className="flex items-center gap-2">
                      <label htmlFor="quality">Quality:</label>
                      <input
                        type="range"
                        id="quality"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={imageQuality}
                        onChange={(e) => setImageQuality(Number(e.target.value))}
                        className="w-24"
                      />
                      <span>{Math.round(imageQuality * 100)}%</span>
                    </div>
                  )}
                  <button
                    onClick={handleDownload}
                    className="rounded-full bg-foreground text-background px-6 py-2 hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
                  >
                    Download
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}