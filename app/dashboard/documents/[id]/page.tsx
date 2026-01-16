'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  FileText,
  Download,
  Send,
  Clock,
  User,
  Building2,
  Eye,
  Loader2,
  History,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { deriveSchema, type DeriveFormData } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { Document, Area, User as UserType, DocumentHistory as DocHistory } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  in_review: { label: 'En revisión', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  derived: { label: 'Derivado', color: 'bg-purple-100 text-purple-700' },
  archived: { label: 'Archivado', color: 'bg-slate-100 text-slate-700' },
};

const actionIcons: Record<string, React.ReactNode> = {
  created: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  viewed: <Eye className="w-4 h-4 text-blue-500" />,
  downloaded: <Download className="w-4 h-4 text-purple-500" />,
  derived: <Send className="w-4 h-4 text-orange-500" />,
  edited: <FileText className="w-4 h-4 text-slate-500" />,
  status_changed: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  commented: <MessageSquare className="w-4 h-4 text-cyan-500" />,
};

const actionLabels: Record<string, string> = {
  created: 'Documento creado',
  viewed: 'Documento visualizado',
  downloaded: 'Documento descargado',
  derived: 'Documento derivado',
  edited: 'Documento editado',
  status_changed: 'Estado actualizado',
  commented: 'Comentario agregado',
};

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { profile } = useAuth();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [history, setHistory] = useState<DocHistory[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [isDeriveDialogOpen, setIsDeriveDialogOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const supabase = createClient();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<DeriveFormData>({
    resolver: zodResolver(deriveSchema),
  });

  const watchedAreaId = watch('targetAreaId');

  useEffect(() => {
    async function fetchDocument() {
      if (!profile?.company_id) return;

      try {
        // Fetch document
        const { data: doc, error } = await supabase
          .from('documents')
          .select(`
            *,
            current_area:areas!documents_current_area_id_fkey(*),
            current_user:users!documents_current_user_id_fkey(id, full_name, avatar_url, email),
            origin_area:areas!documents_origin_area_id_fkey(*),
            creator:users!documents_created_by_fkey(id, full_name, avatar_url, email)
          `)
          .eq('id', resolvedParams.id)
          .eq('company_id', profile.company_id)
          .single();

        if (error) throw error;
        if (!doc) {
          router.push('/dashboard/documents');
          return;
        }

        setDocument(doc);

        // Record view in history
        await supabase.from('document_history').insert({
          document_id: doc.id,
          company_id: profile.company_id,
          user_id: profile.id,
          action: 'viewed',
        });

        // Fetch history
        const { data: historyData, error: historyError } = await supabase
          .from('document_history')
          .select(`
            *,
            user:users!document_history_user_id_fkey(id, full_name, avatar_url),
            from_area:areas!document_history_from_area_id_fkey(id, name),
            to_area:areas!document_history_to_area_id_fkey(id, name),
            to_user:users!document_history_to_user_id_fkey(id, full_name)
          `)
          .eq('document_id', resolvedParams.id)
          .order('created_at', { ascending: false });

        if (historyError) {
          console.error('Error fetching history:', historyError);
        }

        console.log('History data:', historyData);
        setHistory(historyData || []);

        // Fetch areas for derivation
        const { data: areasData } = await supabase
          .from('areas')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('name');

        setAreas(areasData || []);

        // Get preview URL for supported file types
        if (['pdf', 'jpg', 'jpeg', 'png'].includes(doc.file_type.toLowerCase())) {
          const { data: signedUrl } = await supabase.storage
            .from('documents')
            .createSignedUrl(doc.file_path, 3600);

          if (signedUrl) {
            setPreviewUrl(signedUrl.signedUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        toast.error('Error al cargar el documento');
      } finally {
        setLoading(false);
      }
    }

    fetchDocument();
  }, [resolvedParams.id, profile?.company_id]);

  // Fetch users when area changes
  useEffect(() => {
    async function fetchUsers() {
      if (!watchedAreaId || !profile?.company_id) {
        setUsers([]);
        return;
      }

      // Fetch active and pending users (exclude only inactive)
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('area_id', watchedAreaId)
        .in('status', ['active', 'pending'])
        .order('full_name');

      if (error) {
        console.error('Error fetching users:', error);
      }

      setUsers(usersData || []);
    }

    fetchUsers();
  }, [watchedAreaId, profile?.company_id]);

  const handleDownload = async () => {
    if (!document || !profile) return;

    setDownloading(true);

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Record download in history
      await supabase.from('document_history').insert({
        document_id: document.id,
        company_id: profile.company_id,
        user_id: profile.id,
        action: 'downloaded',
      });

      toast.success('Documento descargado');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Error al descargar el documento');
    } finally {
      setDownloading(false);
    }
  };

  const onDerive = async (data: DeriveFormData) => {
    if (!document || !profile) return;

    setIsSubmitting(true);

    try {
      // Update document
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          current_area_id: data.targetAreaId,
          current_user_id: data.targetUserId || null,
          status: 'derived',
        })
        .eq('id', document.id);

      if (updateError) throw updateError;

      // Create history entry
      await supabase.from('document_history').insert({
        document_id: document.id,
        company_id: profile.company_id,
        user_id: profile.id,
        action: 'derived',
        from_area_id: document.current_area_id,
        to_area_id: data.targetAreaId,
        from_user_id: document.current_user_id,
        to_user_id: data.targetUserId || null,
        comment: data.comment,
      });

      // Create notification for recipient
      if (data.targetUserId) {
        await supabase.from('notifications').insert({
          company_id: profile.company_id,
          user_id: data.targetUserId,
          title: 'Nuevo documento recibido',
          message: `Se te ha derivado el documento "${document.title}"`,
          type: 'document',
          document_id: document.id,
          action_url: `/dashboard/documents/${document.id}`,
        });
      }

      // Get the new area and user data for UI update
      const targetArea = areas.find(a => a.id === data.targetAreaId);
      const targetUser = users.find(u => u.id === data.targetUserId);

      // Update local document state
      setDocument(prev => {
        if (!prev) return null;
        return {
          ...prev,
          current_area_id: data.targetAreaId,
          current_user_id: data.targetUserId || undefined,
          current_area: targetArea,
          current_user: targetUser,
          status: 'derived' as const,
        };
      });

      // Add new history entry to the list
      const newHistoryEntry = {
        id: crypto.randomUUID(),
        document_id: document.id,
        company_id: profile.company_id,
        user_id: profile.id,
        action: 'derived',
        from_area_id: document.current_area_id,
        to_area_id: data.targetAreaId,
        from_user_id: document.current_user_id,
        to_user_id: data.targetUserId || null,
        comment: data.comment,
        created_at: new Date().toISOString(),
        user: {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
        from_area: document.current_area ? { id: document.current_area.id, name: document.current_area.name } : null,
        to_area: targetArea ? { id: targetArea.id, name: targetArea.name } : null,
        to_user: targetUser ? { id: targetUser.id, full_name: targetUser.full_name } : null,
      };

      setHistory(prev => [newHistoryEntry as DocHistory, ...prev]);

      toast.success('Documento derivado exitosamente');
      setIsDeriveDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Error deriving document:', error);
      toast.error('Error al derivar el documento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Documento no encontrado</h2>
          <p className="text-slate-500 mb-4">El documento que buscas no existe o no tienes acceso.</p>
          <Button onClick={() => router.push('/dashboard/documents')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a documentos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/documents')}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{document.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={statusLabels[document.status]?.color || 'bg-slate-100 text-slate-700'}>
                {statusLabels[document.status]?.label || document.status}
              </Badge>
              <Badge variant="outline">{document.category}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-14 sm:ml-0">
          <Button
            variant="outline"
            onClick={() => setIsHistorySheetOpen(true)}
          >
            <History className="w-4 h-4 mr-2" />
            Historial
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Descargar
          </Button>
          <Button
            onClick={() => setIsDeriveDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Send className="w-4 h-4 mr-2" />
            Derivar
          </Button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Vista previa</CardTitle>
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                <div className="bg-slate-100 rounded-xl overflow-hidden">
                  {document.mime_type === 'application/pdf' ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-[600px]"
                      title="Document preview"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt={document.title}
                      className="w-full h-auto max-h-[600px] object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl h-96 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">
                      Vista previa no disponible para este tipo de archivo
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="mt-4"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar para ver
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Details Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* File Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Información del archivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Nombre</span>
                <span className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                  {document.file_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Tamaño</span>
                <span className="text-sm font-medium text-slate-900">
                  {formatFileSize(document.file_size)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Tipo</span>
                <span className="text-sm font-medium text-slate-900 uppercase">
                  {document.file_type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Fecha</span>
                <span className="text-sm font-medium text-slate-900">
                  {format(new Date(document.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Asignación actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-slate-500">Área</span>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-900">
                    {document.current_area?.name || 'Sin asignar'}
                  </span>
                </div>
              </div>
              {document.current_user && (
                <div>
                  <span className="text-sm text-slate-500">Usuario</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={document.current_user.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {document.current_user.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-slate-900">
                      {document.current_user.full_name}
                    </span>
                  </div>
                </div>
              )}
              <Separator />
              <div>
                <span className="text-sm text-slate-500">Creado por</span>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={document.creator?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {document.creator?.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-slate-900">
                    {document.creator?.full_name}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {document.description && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{document.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Recent History */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Historial Reciente</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHistorySheetOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Ver todo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-slate-500">No hay historial disponible</p>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {actionIcons[entry.action]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {actionLabels[entry.action]}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <span>{entry.user?.full_name}</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(entry.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                        {entry.action === 'derived' && entry.to_area && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            → {entry.to_area.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Derive Dialog */}
      <Dialog open={isDeriveDialogOpen} onOpenChange={setIsDeriveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Derivar Documento</DialogTitle>
            <DialogDescription>
              Envía este documento a otra área o usuario
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onDerive)} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="comment">Comentario (opcional)</Label>
              <Controller
                name="comment"
                control={control}
                render={({ field }) => (
                  <Textarea
                    placeholder="Agrega un comentario para el destinatario..."
                    rows={3}
                    {...field}
                  />
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeriveDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Derivando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Derivar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Sheet */}
      <Sheet open={isHistorySheetOpen} onOpenChange={setIsHistorySheetOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Historial del Documento</SheetTitle>
            <SheetDescription>
              Trazabilidad completa de acciones
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

              <div className="space-y-6">
                {history.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-12"
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-3 w-5 h-5 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                      {actionIcons[entry.action]}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900">
                            {actionLabels[entry.action]}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={entry.user?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {entry.user?.full_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-slate-600">
                              {entry.user?.full_name}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(entry.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>

                      {entry.action === 'derived' && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                          <span>{entry.from_area?.name || 'Origen'}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span className="font-medium">{entry.to_area?.name}</span>
                          {entry.to_user && (
                            <span className="text-slate-400">
                              ({entry.to_user.full_name})
                            </span>
                          )}
                        </div>
                      )}

                      {entry.comment && (
                        <p className="mt-2 text-sm text-slate-500 italic">
                          &ldquo;{entry.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
