'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Settings,
  LogOut,
  Bell,
  ChevronsUpDown,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/documents', label: 'Documentos', icon: FileText },
];

const adminNavItems = [
  { href: '/dashboard/areas', label: 'Áreas', icon: Building2 },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users },
];

function AppSidebar() {
  const pathname = usePathname();
  const { profile, signOut, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const isSupervisor = profile?.role === 'supervisor';

  const handleSignOut = async () => {
    console.log('Starting signOut...');
    setIsSigningOut(true);
    try {
      await signOut();
      console.log('SignOut successful, redirecting...');
      // Use window.location for a hard redirect to clear all state
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
      // Still try to redirect even on error
      window.location.href = '/login';
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex items-center justify-center overflow-hidden">
                  <Image 
                    src="/logo.svg" 
                    alt="ATLAS" 
                    width={24} 
                    height={24}
                    className="h-10 w-auto"
                  />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(isAdmin || isSupervisor) && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dashboard/settings'}
                  tooltip="Configuración"
                >
                  <Link href="/dashboard/settings">
                    <Settings className="size-4" />
                    <span>Configuración</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            {loading ? (
              <div className="flex items-center gap-3 px-2 py-1.5">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5 group-data-[collapsible=icon]:hidden">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="size-8 border border-sidebar-border">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col gap-0.5 leading-none text-left group-data-[collapsible=icon]:hidden">
                      <span className="font-medium text-sm truncate">
                        {profile?.full_name || 'Usuario'}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {profile?.role || 'user'}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="top"
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <Settings className="mr-2 size-4" />
                      Configuración
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    {isSigningOut ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Cerrando sesión...
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 size-4" />
                        Cerrar sesión
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function DashboardHeader() {
  const { profile } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-medium text-foreground truncate">
          Bienvenido, {profile?.full_name?.split(' ')[0] || 'Usuario'}
        </h1>
        <p className="text-xs text-muted-foreground truncate">
          {profile?.company?.name || 'Tu empresa'}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative inline-flex items-center justify-center size-9 rounded-md hover:bg-accent transition-colors">
            <Bell className="size-4 text-muted-foreground" />
            <Badge className="absolute -top-1 -right-1 size-4 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white">
              3
            </Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-4 text-center text-sm text-muted-foreground">
            No tienes notificaciones nuevas
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { loading, profile } = useAuth();

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // If not loading and no profile, user is not authenticated
  if (!profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
