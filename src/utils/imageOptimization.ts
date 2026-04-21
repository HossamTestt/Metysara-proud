import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file before upload.
 * Default settings: max 1.5MB size, max 1280px width, 85% quality.
 */
export async function optimizeImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    initialQuality: 0.85,
  };

  try {
    console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    const compressedFile = await imageCompression(file, options);
    console.log(`Optimized size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Maintain original name
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Image optimization failed:', error);
    return file; // Fallback to original file
  }
}
