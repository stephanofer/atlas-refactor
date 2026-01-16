'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Users,
  Plus,
  Pencil,
  Search,
  Loader2,
  Mail,
  Shield,
  Building2,
  UserCheck,
  UserX,
} from 'lucide-react';

import { userSchema, type UserFormData } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { User, Area, UserRole } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { toast } from 'sonner';

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  user: 'Usuario',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  supervisor: 'bg-blue-100 text-blue-700',
  user: 'bg-slate-100 text-slate-700',
};

export default function UsersPage() {
  const { profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const fetchData = async () => {
    // Wait for auth to be ready
    if (authLoading || !profile?.company_id) return;

    setLoading(true);

    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          area:areas(*)
        `)
        .eq('company_id', profile.company_id)
        .order('full_name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch areas
      const { data: areasData, error: areasError } = await supabase
        .from('areas')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (areasError) throw areasError;
      setAreas(areasData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.company_id, authLoading]);

  const openCreateDialog = () => {
    reset({ fullName: '', email: '', password: '', areaId: undefined, role: 'user' });
    setIsCreateDialogOpen(true);
  };

  const openEditSheet = (user: User) => {
    setSelectedUser(user);
    setIsEditSheetOpen(true);
  };

  const onCreateSubmit = async (data: UserFormData) => {
    if (!profile?.company_id) return;

    setIsSubmitting(true);

    try {
      // Use API route to create user (doesn't affect current session)
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          areaId: data.areaId || null,
          role: data.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Error al crear el usuario');
        return;
      }

      toast.success('Usuario creado exitosamente', {
        description: `Se ha creado la cuenta para ${data.email}`,
      });

      setIsCreateDialogOpen(false);
      reset();
      fetchData();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error al crear el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    // Validate at least one admin remains
    if (selectedUser?.role === 'admin' && newRole !== 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin' && u.status === 'active').length;
      if (adminCount <= 1) {
        toast.error('Debe existir al menos un administrador activo');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Rol actualizado exitosamente');
      fetchData();
      
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Error al actualizar el rol');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUserArea = async (userId: string, areaId: string | null) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ area_id: areaId })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Área actualizada exitosamente');
      fetchData();
      
      if (selectedUser) {
        const newArea = areas.find((a) => a.id === areaId);
        setSelectedUser({ ...selectedUser, area_id: areaId || undefined, area: newArea });
      }
    } catch (error) {
      console.error('Error updating area:', error);
      toast.error('Error al actualizar el área');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'inactive') => {
    // Validate at least one admin remains active
    if (selectedUser?.role === 'admin' && status === 'inactive') {
      const activeAdmins = users.filter((u) => u.role === 'admin' && u.status === 'active').length;
      if (activeAdmins <= 1) {
        toast.error('Debe existir al menos un administrador activo');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Estado actualizado exitosamente');
      fetchData();
      
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, status });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if user is admin
  if (profile && profile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Acceso restringido</h2>
          <p className="text-slate-500">Solo los administradores pueden gestionar usuarios.</p>
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
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
          <p className="text-slate-500 mt-1">Administra el personal de tu empresa</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Lista de Usuarios</CardTitle>
                <CardDescription>
                  {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar usuarios..."
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
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {searchQuery ? 'Sin resultados' : 'No hay usuarios'}
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchQuery
                    ? 'Intenta con otro término de búsqueda'
                    : 'Crea tu primer usuario para comenzar'}
                </p>
                {!searchQuery && (
                  <Button onClick={openCreateDialog} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear usuario
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          className="group cursor-pointer hover:bg-slate-50"
                          onClick={() => openEditSheet(user)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border-2 border-slate-100">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                                  {user.full_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-slate-900">{user.full_name}</p>
                                <p className="text-sm text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.area ? (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Building2 className="w-4 h-4" />
                                <span>{user.area.name}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">Sin asignar</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={roleColors[user.role]}>
                              {roleLabels[user.role]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                user.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : user.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-slate-100 text-slate-700'
                              }
                            >
                              {user.status === 'active'
                                ? 'Activo'
                                : user.status === 'pending'
                                ? 'Pendiente'
                                : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditSheet(user);
                              }}
                              className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
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

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crea una subcuenta para un miembro de tu equipo
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                placeholder="Juan Pérez"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña inicial</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                El usuario podrá cambiar su contraseña después de iniciar sesión
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="areaId">Área</Label>
              <Controller
                name="areaId"
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="user">Usuario</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
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
                    Creando...
                  </>
                ) : (
                  'Crear usuario'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Usuario</SheetTitle>
            <SheetDescription>
              Modifica el rol, área y estado del usuario
            </SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <div className="mt-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-slate-100">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-xl">
                    {selectedUser.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    {selectedUser.full_name}
                  </h3>
                  <p className="text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Role */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-500" />
                  Rol
                </Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => updateUserRole(selectedUser.id, value as UserRole)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="user">Usuario</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {selectedUser.role === 'admin' &&
                    'Control total sobre la empresa y usuarios'}
                  {selectedUser.role === 'supervisor' &&
                    'Puede ver documentos de todas las áreas'}
                  {selectedUser.role === 'user' &&
                    'Acceso limitado a su área asignada'}
                </p>
              </div>

              {/* Area */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  Área asignada
                </Label>
                <Select
                  value={selectedUser.area_id || 'none'}
                  onValueChange={(value) =>
                    updateUserArea(selectedUser.id, value === 'none' ? null : value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <Label>Estado de la cuenta</Label>
                <div className="flex gap-3">
                  <Button
                    variant={selectedUser.status === 'active' ? 'default' : 'outline'}
                    className={
                      selectedUser.status === 'active'
                        ? 'bg-green-600 hover:bg-green-700 flex-1'
                        : 'flex-1'
                    }
                    onClick={() => updateUserStatus(selectedUser.id, 'active')}
                    disabled={isSubmitting}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activo
                  </Button>
                  <Button
                    variant={selectedUser.status === 'inactive' ? 'default' : 'outline'}
                    className={
                      selectedUser.status === 'inactive'
                        ? 'bg-slate-600 hover:bg-slate-700 flex-1'
                        : 'flex-1'
                    }
                    onClick={() => updateUserStatus(selectedUser.id, 'inactive')}
                    disabled={isSubmitting}
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Inactivo
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Additional Info */}
              <div className="space-y-2 text-sm text-slate-500">
                <p>
                  <span className="font-medium">Creado:</span>{' '}
                  {new Date(selectedUser.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
