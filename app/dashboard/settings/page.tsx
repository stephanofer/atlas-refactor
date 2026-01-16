'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Building2,
  Shield,
  Lock,
  Loader2,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-zA-Z]/, 'Debe contener al menos una letra')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  user: 'Usuario',
};

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  supervisor: 'bg-blue-100 text-blue-700',
  user: 'bg-slate-100 text-slate-700',
};

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const supabase = createClient();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!profile?.id) return;

    setIsUpdatingProfile(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: data.fullName })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      resetPassword();
      toast.success('Contraseña actualizada exitosamente');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Error al actualizar la contraseña');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">Administra tu cuenta y preferencias</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="size-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tu información de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar & Info */}
            <div className="flex items-center gap-4">
              <Avatar className="size-20 border-2 border-muted">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-semibold">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{profile?.full_name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-4" />
                  {profile?.email}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={roleColors[profile?.role || 'user']}>
                    <Shield className="size-3 mr-1" />
                    {roleLabels[profile?.role || 'user']}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Profile Form */}
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    placeholder="Tu nombre completo"
                    {...registerProfile('fullName')}
                  />
                  {profileErrors.fullName && (
                    <p className="text-sm text-red-500">{profileErrors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    El email no puede ser modificado
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-sm">
                    <Building2 className="size-4 text-muted-foreground" />
                    {profile?.company?.name || 'Sin empresa'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Área</Label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-sm">
                    <Building2 className="size-4 text-muted-foreground" />
                    {profile?.area?.name || 'Sin área asignada'}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="size-4 mr-2" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Password Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="size-5" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña de acceso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...registerPassword('currentPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-500">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...registerPassword('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-500">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword('confirmPassword')}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isUpdatingPassword}
                  variant="outline"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Lock className="size-4 mr-2" />
                      Cambiar contraseña
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
