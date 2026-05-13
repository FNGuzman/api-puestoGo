const normalizeBaseUrl = (url?: string): string | undefined => {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/+$/, '');
};

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();

export const R2_CONFIG = {
  accountId,
  accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim(),
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim(),
  bucketName: process.env.R2_BUCKET_NAME?.trim() || 'sacop',
  endpoint: accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : '',
  region: 'auto', // Cloudflare R2 usa 'auto',

  ambiente: process.env.NODE_ENV || 'development', // Ambiente de la aplicación
  developmentUrl: normalizeBaseUrl(process.env.R2_DEVELOPMENT_URL), // URL de desarrollo del bucket
  productionUrl: normalizeBaseUrl(process.env.R2_PRODUCTION_URL), // URL de producción del bucket
};

export const R2_STORAGE_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB (aumentado para archivos grandes)
  allowedMimeTypes: [
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',

    // Imágenes (optimizadas)
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',

    // Otros formatos
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  uploadPath: 'documentos', // Ruta base en el bucket

  // Configuración de optimización de imágenes
  imageOptimization: {
    defaultMaxWidth: 1920,
    defaultMaxHeight: 1080,
    defaultQuality: 80,
    defaultFormat: 'jpeg' as 'jpeg' | 'png' | 'webp',
    thumbnailWidth: 300,
    thumbnailHeight: 300,
    thumbnailQuality: 70,
  },
};