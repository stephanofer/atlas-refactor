'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Users,
  FileText,
  X,
} from 'lucide-react';

import { areaSchema, type AreaFormData } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { Area } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function AreasPage() {
  const { profile, loading: authLoading } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [deletingArea, setDeletingArea] = useState<Area | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AreaFormData>({
    resolver: zodResolver(areaSchema),
  });

  const fetchAreas = async () => {
    if (authLoading || !profile?.company_id) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;

      // Get user counts for each area
      const areasWithCounts = await Promise.all(
        (data || []).map(async (area) => {
          const { count: userCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('area_id', area.id);

          const { count: docCount } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('current_area_id', area.id);

          return {
            ...area,
            user_count: userCount || 0,
            document_count: docCount || 0,
          };
        })
      );

      setAreas(areasWithCounts);
    } catch (error) {
      console.error('Error fetching areas:', error);
      toast.error('Error al cargar las áreas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, [profile?.company_id, authLoading]);

  const openCreateDialog = () => {
    setEditingArea(null);
    reset({ name: '', description: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (area: Area) => {
    setEditingArea(area);
    reset({ name: area.name, description: area.description || '' });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (area: Area) => {
    setDeletingArea(area);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: AreaFormData) => {
    if (!profile?.company_id) return;

    setIsSubmitting(true);

    try {
      if (editingArea) {
        // Update existing area
        const { error } = await supabase
          .from('areas')
          .update({
            name: data.name,
            description: data.description,
          })
          .eq('id', editingArea.id);

        if (error) {
          if (error.code === '23505') {
            toast.error('Ya existe un área con ese nombre');
            return;
          }
          throw error;
        }

        toast.success('Área actualizada exitosamente');
      } else {
        // Create new area
        const { error } = await supabase.from('areas').insert({
          company_id: profile.company_id,
          name: data.name,
          description: data.description,
        });

        if (error) {
          if (error.code === '23505') {
            toast.error('Ya existe un área con ese nombre');
            return;
          }
          throw error;
        }

        toast.success('Área creada exitosamente');
      }

      setIsDialogOpen(false);
      reset();
      fetchAreas();
    } catch (error) {
      console.error('Error saving area:', error);
      toast.error('Error al guardar el área');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingArea) return;

    setIsSubmitting(true);

    try {
      // Check if area has documents
      const { count } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('current_area_id', deletingArea.id);

      if (count && count > 0) {
        toast.error('No se puede eliminar', {
          description: 'Esta área tiene documentos asignados.',
        });
        return;
      }

      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', deletingArea.id);

      if (error) throw error;

      toast.success('Área eliminada exitosamente');
      setIsDeleteDialogOpen(false);
      setDeletingArea(null);
      fetchAreas();
    } catch (error) {
      console.error('Error deleting area:', error);
      toast.error('Error al eliminar el área');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAreas = areas.filter(
    (area) =>
      area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if user is admin
  if (profile && profile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Acceso restringido</h2>
          <p className="text-slate-500">Solo los administradores pueden gestionar áreas.</p>
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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Áreas y Departamentos</h1>
          <p className="text-slate-500 mt-1">Gestiona la estructura organizacional de tu empresa</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Área
        </Button>
      </motion.div>

      {/* Search and Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Lista de Áreas</CardTitle>
                <CardDescription>
                  {areas.length} área{areas.length !== 1 ? 's' : ''} registrada{areas.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar áreas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredAreas.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {searchQuery ? 'Sin resultados' : 'No hay áreas creadas'}
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchQuery
                    ? 'Intenta con otro término de búsqueda'
                    : 'Crea tu primera área para comenzar'}
                </p>
                {!searchQuery && (
                  <Button onClick={openCreateDialog} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear área
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Área</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-center">Usuarios</TableHead>
                      <TableHead className="text-center">Documentos</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredAreas.map((area, index) => (
                        <motion.tr
                          key={area.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                          className="group"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600" />
                              </div>
                              <span className="font-medium text-slate-900">{area.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500 max-w-xs truncate">
                            {area.description || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5 text-slate-600">
                              <Users className="w-4 h-4" />
                              <span>{area.user_count}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5 text-slate-600">
                              <FileText className="w-4 h-4" />
                              <span>{area.document_count}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(area)}
                                className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(area)}
                                className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingArea ? 'Editar Área' : 'Nueva Área'}
            </DialogTitle>
            <DialogDescription>
              {editingArea
                ? 'Modifica los datos del área'
                : 'Crea un nuevo departamento para tu empresa'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del área</Label>
              <Input
                id="name"
                placeholder="Ej: Recursos Humanos"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe las funciones de esta área..."
                rows={3}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
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
                    {editingArea ? 'Guardando...' : 'Creando...'}
                  </>
                ) : editingArea ? (
                  'Guardar cambios'
                ) : (
                  'Crear área'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Eliminar Área
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el área{' '}
              <span className="font-medium text-slate-900">{deletingArea?.name}</span>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
