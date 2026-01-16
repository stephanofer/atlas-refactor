import { z } from 'zod';

export const registerSchema = z.object({
  companyName: z
    .string()
    .min(2, 'El nombre de la empresa debe tener al menos 2 caracteres')
    .max(100, 'El nombre de la empresa no puede exceder 100 caracteres'),
  fullName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z
    .string()
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-zA-Z]/, 'La contraseña debe contener al menos una letra')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[^a-zA-Z0-9]/, 'La contraseña debe contener al menos un símbolo'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(1, 'Ingresa tu contraseña'),
});

export const areaSchema = z.object({
  name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/, 'Solo se permiten letras, números y espacios'),
  description: z
    .string()
    .max(255, 'La descripción no puede exceder 255 caracteres')
    .optional(),
});

export const userSchema = z.object({
  fullName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z
    .string()
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-zA-Z]/, 'La contraseña debe contener al menos una letra')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  areaId: z
    .string()
    .uuid('Selecciona un área válida')
    .optional(),
  role: z.enum(['admin', 'supervisor', 'user']),
});

export const documentUploadSchema = z.object({
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  targetAreaId: z
    .string()
    .uuid('Selecciona un área de destino'),
  targetUserId: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

export const deriveSchema = z.object({
  targetAreaId: z
    .string()
    .uuid('Selecciona un área de destino'),
  targetUserId: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  comment: z
    .string()
    .max(500, 'El comentario no puede exceder 500 caracteres')
    .optional(),
});

// File validation constants
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

export const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.sh', '.cmd', '.msi', '.app', '.dll', '.com'];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'El archivo no puede exceder 10MB' };
  }

  // Check blocked extensions
  const fileName = file.name.toLowerCase();
  for (const ext of BLOCKED_EXTENSIONS) {
    if (fileName.endsWith(ext)) {
      return { valid: false, error: 'Tipo de archivo no permitido por seguridad' };
    }
  }

  // Check MIME type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Formato de archivo no permitido. Use PDF, DOCX, XLSX, JPG o PNG' };
  }

  return { valid: true };
}

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type AreaFormData = z.infer<typeof areaSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;
export type DeriveFormData = z.infer<typeof deriveSchema>;
