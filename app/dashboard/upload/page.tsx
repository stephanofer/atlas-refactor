'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  File,
  Image as ImageIcon,
} from 'lucide-react';

import { documentUploadSchema, validateFile, type DocumentUploadFormData } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { Area, User } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const priorities = [
  { value: 'low', label: 'Baja', color: 'text-slate-600' },
  { value: 'normal', label: 'Normal', color: 'text-blue-600' },
  { value: 'high', label: 'Alta', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgente', color: 'text-red-600' },
];

const fileTypeIcons: Record<string, React.ReactNode> = {
  'application/pdf': <FileText className="w-8 h-8 text-red-500" />,
  'application/msword': <FileText className="w-8 h-8 text-blue-500" />,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <FileText className="w-8 h-8 text-blue-500" />,
  'application/vnd.ms-excel': <FileText className="w-8 h-8 text-green-500" />,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': <FileText className="w-8 h-8 text-green-500" />,
  'image/jpeg': <ImageIcon className="w-8 h-8 text-purple-500" />,
  'image/png': <ImageIcon className="w-8 h-8 text-purple-500" />,
};

export default function UploadPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      priority: 'normal' as const,
    },
  });

  const watchedAreaId = watch('targetAreaId');

  useEffect(() => {
    async function fetchData() {
      if (!profile?.company_id) return;

      // Fetch areas
      const { data: areasData } = await supabase
        .from('areas')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      setAreas(areasData || []);
    }

    fetchData();
  }, [profile?.company_id]);

  // Fetch users when area changes
  useEffect(() => {
    async function fetchUsers() {
      if (!watchedAreaId) {
        setUsers([]);
        return;
      }

      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .eq('area_id', watchedAreaId)
        .eq('status', 'active')
        .order('full_name');

      setUsers(usersData || []);
    }

    fetchUsers();
  }, [watchedAreaId]);

  const handleFileChange = useCallback((selectedFile: File | null) => {
    setFileError(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setFileError(validation.error || 'Archivo no válido');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      handleFileChange(droppedFile);
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onSubmit = async (data: DocumentUploadFormData) => {
    if (!file || !profile?.company_id) {
      toast.error('Selecciona un archivo para subir');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${profile.company_id}/documents/${fileName}`;

      // Upload to Supabase Storage
      setUploadProgress(20);
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist, create it (for development)
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('El bucket de almacenamiento no existe', {
            description: 'Configura el bucket "documents" en Supabase Storage.',
          });
          return;
        }
        throw uploadError;
      }

      setUploadProgress(60);

      // Create document record
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          company_id: profile.company_id,
          title: data.title,
          description: data.description,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: fileExt || 'unknown',
          mime_type: file.type,
          current_area_id: data.targetAreaId,
          current_user_id: data.targetUserId || null,
          origin_area_id: profile.area_id,
          created_by: profile.id,
          status: 'pending',
          priority: data.priority,
        })
        .select()
        .single();

      if (docError) throw docError;

      setUploadProgress(80);

      // Create history entry
      await supabase.from('document_history').insert({
        document_id: document.id,
        company_id: profile.company_id,
        user_id: profile.id,
        action: 'created',
        to_area_id: data.targetAreaId,
        to_user_id: data.targetUserId || null,
        comment: 'Documento subido al sistema',
      });

      setUploadProgress(100);

      toast.success('Documento subido exitosamente');
      router.push('/dashboard/documents');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error al subir el documento');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-slate-900">Subir Documento</h1>
        <p className="text-slate-500 mt-1">Carga un nuevo archivo al sistema de gestión</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* File Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Archivo</CardTitle>
              <CardDescription>
                Arrastra o selecciona el archivo que deseas subir
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!file ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                    ${isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }
                  `}
                >
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  />
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
                  <p className="text-slate-600 font-medium mb-1">
                    Arrastra tu archivo aquí o haz clic para seleccionar
                  </p>
                  <p className="text-sm text-slate-400">
                    PDF, DOCX, XLSX, JPG, PNG • Máximo 10MB
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
                >
                  <div className="flex-shrink-0">
                    {fileTypeIcons[file.type] || <File className="w-8 h-8 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFile(null)}
                      className="h-8 w-8 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {fileError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-3 text-sm text-red-600"
                >
                  <AlertCircle className="w-4 h-4" />
                  {fileError}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Document Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Detalles del Documento</CardTitle>
              <CardDescription>
                Completa la información del documento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título del documento</Label>
                <Input
                  id="title"
                  placeholder="Ej: Factura de servicios enero 2026"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Agrega una descripción o notas adicionales..."
                  rows={3}
                  {...register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <span className={p.color}>{p.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Destination */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Destino</CardTitle>
              <CardDescription>
                Selecciona el área y usuario que recibirá el documento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAreaId">Área destino</Label>
                  <Controller
                    name="targetAreaId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar área" />
                        </SelectTrigger>
                        <SelectContent>
                          {areas.map((area) => (
                            <SelectItem key={area.id} value={area.id}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.targetAreaId && (
                    <p className="text-sm text-red-500">{errors.targetAreaId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetUserId">Usuario destino (opcional)</Label>
                  <Controller
                    name="targetUserId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        disabled={!watchedAreaId || users.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !watchedAreaId
                              ? 'Selecciona un área primero'
                              : users.length === 0
                              ? 'Sin usuarios en esta área'
                              : 'Seleccionar usuario'
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upload Progress & Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-4"
        >
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Subiendo documento...</span>
                <span className="text-slate-900 font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !file}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Documento
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
