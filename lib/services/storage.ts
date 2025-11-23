import { supabase } from '@/lib/supabase/client';

/**
 * 이미지를 압축하고 리사이징합니다
 */
async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 최대 너비 제한
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * 파일 이름을 고유하게 생성합니다
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * 이미지를 Supabase Storage에 업로드합니다
 * @param file - 업로드할 파일
 * @param bucket - 저장할 버킷 이름 ('community-images', 'user-avatars', 'hike-photos')
 * @param folder - 버킷 내 폴더 경로 (선택사항)
 * @param compress - 이미지 압축 여부 (기본값: true)
 */
export async function uploadImage(
  file: File,
  bucket: 'community-images' | 'user-avatars' | 'hike-photos',
  folder?: string,
  compress = true
): Promise<{ url: string | null; error: string | null }> {
  try {
    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드할 수 있습니다.');
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
    }

    // 이미지 압축 (선택적)
    let fileToUpload: File | Blob = file;
    if (compress && file.type.startsWith('image/')) {
      try {
        fileToUpload = await compressImage(file);
      } catch (compressError) {
        console.warn('Image compression failed, uploading original:', compressError);
      }
    }

    // 고유 파일 이름 생성
    const fileName = generateUniqueFileName(file.name);
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // 공개 URL 생성
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return { url: urlData.publicUrl, error: null };
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return { url: null, error: error.message };
  }
}

/**
 * 여러 이미지를 한번에 업로드합니다
 * @param files - 업로드할 파일 배열
 * @param bucket - 저장할 버킷 이름
 * @param folder - 사용자 ID (폴더 경로로 사용)
 * @param category - 커뮤니티 카테고리 (community-images 사용 시 필수)
 * @param compress - 이미지 압축 여부
 */
export async function uploadMultipleImages(
  files: File[],
  bucket: 'community-images' | 'user-avatars' | 'hike-photos',
  folder?: string,
  category?: string,
  compress = true
): Promise<{ urls: string[]; errors: string[] }> {
  // community-images 버킷의 경우 category/folder 경로로 업로드
  const actualFolder = bucket === 'community-images' && category
    ? `${category}/${folder}`
    : folder;
  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const { url, error } = await uploadImage(file, bucket, actualFolder, compress);
    if (url) {
      urls.push(url);
    }
    if (error) {
      errors.push(error);
    }
  }

  return { urls, errors };
}

/**
 * Storage에서 이미지를 삭제합니다
 */
export async function deleteImage(
  bucket: 'community-images' | 'user-avatars' | 'hike-photos',
  filePath: string
): Promise<{ error: string | null }> {
  try {
    // URL에서 파일 경로 추출
    const pathMatch = filePath.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
    const actualPath = pathMatch ? pathMatch[1] : filePath;

    const { error } = await supabase.storage.from(bucket).remove([actualPath]);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return { error: error.message };
  }
}

/**
 * 여러 이미지를 한번에 삭제합니다
 */
export async function deleteMultipleImages(
  bucket: 'community-images' | 'user-avatars' | 'hike-photos',
  filePaths: string[]
): Promise<{ errors: string[] }> {
  const errors: string[] = [];

  for (const path of filePaths) {
    const { error } = await deleteImage(bucket, path);
    if (error) {
      errors.push(error);
    }
  }

  return { errors };
}

/**
 * 이미지 URL을 가져옵니다
 */
export function getImageUrl(
  bucket: 'community-images' | 'user-avatars' | 'hike-photos',
  filePath: string
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * 파일을 base64로 변환합니다 (미리보기용)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * 이미지 파일인지 확인합니다
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * 허용된 이미지 형식인지 확인합니다
 */
export function isAllowedImageType(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(file.type);
}

/**
 * 파일 크기를 포맷팅합니다
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
