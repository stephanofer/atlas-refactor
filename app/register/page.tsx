'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la cuenta');
      }

      toast.success('Cuenta creada exitosamente', {
        description: 'Ya puedes iniciar sesión con tus credenciales.',
      });

      router.push('/login?registered=true');
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta';
      
      if (errorMessage.includes('ya está registrado')) {
        toast.error('Este email ya está registrado');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>

        <Card className="border-0 shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-1 pb-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex items-center justify-center mb-4"
            >
              <Image src="/logo.svg" alt="ATLAS" width={56} height={56} className="rounded-2xl shadow-lg shadow-blue-600/25" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-center text-slate-900">
              Crear cuenta de administrador
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              Registra tu empresa y comienza a gestionar documentos
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="companyName" className="text-slate-700">
                  Nombre de la empresa
                </Label>
                <Input
                  id="companyName"
                  placeholder="Mi Empresa S.A."
                  {...register('companyName')}
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
                {errors.companyName && (
                  <p className="text-sm text-red-500">{errors.companyName.message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="fullName" className="text-slate-700">
                  Nombre completo
                </Label>
                <Input
                  id="fullName"
                  placeholder="Juan Pérez"
                  {...register('fullName')}
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500">{errors.fullName.message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-slate-700">
                  Email corporativo
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@empresa.com"
                  {...register('email')}
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="text-slate-700">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className="h-11 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="confirmPassword" className="text-slate-700">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className="h-11 pr-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </motion.div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-600/25 transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  'Crear cuenta'
                )}
              </Button>

              <p className="text-sm text-slate-600 text-center">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Inicia sesión
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-xs text-slate-500 text-center mt-6"
        >
          Al registrarte, aceptas nuestros{' '}
          <Link href="#" className="text-blue-600 hover:underline">
            Términos de Servicio
          </Link>{' '}
          y{' '}
          <Link href="#" className="text-blue-600 hover:underline">
            Política de Privacidad
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
