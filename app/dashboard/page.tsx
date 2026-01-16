'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Users, Building2, TrendingUp, Clock, ArrowUpRight, ArrowDownRight, Eye, Upload, Send, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import type { DashboardStats, Document } from '@/lib/types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  color: string;
}

function StatCard({ title, value, description, icon: Icon, trend, color }: StatCardProps) {
  return (
    <motion.div variants={item}>
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{value}</div>
          <div className="flex items-center gap-2 mt-1">
            <CardDescription>{description}</CardDescription>
            {trend && (
              <span className={`flex items-center text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend.value}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RecentDocuments({ documents, loading }: { documents: Document[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>No hay documentos recientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc, index) => (
        <motion.div
          key={doc.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {doc.title}
            </p>
            <p className="text-xs text-slate-500">
              {new Date(doc.created_at).toLocaleDateString('es-ES')}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            doc.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            doc.status === 'approved' ? 'bg-green-100 text-green-700' :
            doc.status === 'derived' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {doc.status === 'pending' ? 'Pendiente' :
             doc.status === 'approved' ? 'Aprobado' :
             doc.status === 'derived' ? 'Derivado' :
             doc.status}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

interface ActivityItem {
  id: string;
  action: string;
  user_id: string;
  created_at: string;
  document?: { title: string };
  user?: { full_name: string; avatar_url?: string };
  to_area?: { name: string };
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  console.log('[DashboardPage] Render - profile:', profile?.full_name || 'null', 'company_id:', profile?.company_id || 'null');

  useEffect(() => {
    console.log('[DashboardPage] useEffect triggered - profile?.company_id:', profile?.company_id || 'null');
    
    async function fetchDashboardData() {
      // Profile is guaranteed to exist because DashboardShell handles auth loading
      if (!profile?.company_id) {
        console.log('[DashboardPage] No company_id, skipping fetch');
        return;
      }

      console.log('[DashboardPage] Starting data fetch...');

      try {
        // Fetch documents count
        const { count: totalDocs } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id);

        // Fetch pending documents
        const { count: pendingDocs } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id)
          .eq('status', 'pending');

        // Fetch active users
        const { count: activeUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id)
          .eq('status', 'active');

        // Fetch today's derived documents
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: derivedToday } = await supabase
          .from('document_history')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id)
          .eq('action', 'derived')
          .gte('created_at', today.toISOString());

        setStats({
          totalDocuments: totalDocs || 0,
          pendingDocuments: pendingDocs || 0,
          activeUsers: activeUsers || 0,
          derivedToday: derivedToday || 0,
        });

        // Fetch recent documents
        const { data: docs } = await supabase
          .from('documents')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentDocs(docs || []);

        // Fetch recent activity
        const { data: activity, error: activityError } = await supabase
          .from('document_history')
          .select(`
            id,
            action,
            user_id,
            created_at,
            documents!document_history_document_id_fkey(title),
            users!document_history_user_id_fkey(full_name, avatar_url),
            areas!document_history_to_area_id_fkey(name)
          `)
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false })
          .limit(8);

        if (activityError) {
          console.error('Error fetching activity:', activityError);
        }

        // Transform the data to match ActivityItem interface
        const transformedActivity = (activity || []).map((item: any) => ({
          id: item.id,
          action: item.action,
          user_id: item.user_id,
          created_at: item.created_at,
          document: item.documents,
          user: item.users,
          to_area: item.areas,
        }));

        setRecentActivity(transformedActivity);
      } catch (error) {
        console.error('[DashboardPage] Error fetching dashboard data:', error);
      } finally {
        console.log('[DashboardPage] Fetch complete, setting loading to false');
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [profile?.company_id]);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Total Documentos"
          value={loading ? '-' : stats?.totalDocuments || 0}
          description="En el sistema"
          icon={FileText}
          trend={{ value: 12, positive: true }}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Pendientes"
          value={loading ? '-' : stats?.pendingDocuments || 0}
          description="Por revisar"
          icon={Clock}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatCard
          title="Derivados Hoy"
          value={loading ? '-' : stats?.derivedToday || 0}
          description="Movimientos del día"
          icon={TrendingUp}
          trend={{ value: 8, positive: true }}
          color="bg-gradient-to-br from-green-500 to-emerald-500"
        />
        <StatCard
          title="Usuarios Activos"
          value={loading ? '-' : stats?.activeUsers || 0}
          description="En tu empresa"
          icon={Users}
          color="bg-gradient-to-br from-purple-500 to-violet-500"
        />
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Documentos Recientes
              </CardTitle>
              <CardDescription>
                Los últimos documentos agregados al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentDocuments documents={recentDocs} loading={loading} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Acciones Rápidas
              </CardTitle>
              <CardDescription>
                Accesos directos a funciones comunes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href="/dashboard/upload"
                className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Subir Documento</p>
                  <p className="text-xs text-slate-500">Agregar nuevo archivo</p>
                </div>
              </a>

              {profile?.role === 'admin' && (
                <>
                  <a
                    href="/dashboard/areas"
                    className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Gestionar Áreas</p>
                      <p className="text-xs text-slate-500">Departamentos</p>
                    </div>
                  </a>

                  <a
                    href="/dashboard/users"
                    className="flex items-center gap-4 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Gestionar Usuarios</p>
                      <p className="text-xs text-slate-500">Personal de la empresa</p>
                    </div>
                  </a>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimas acciones realizadas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No hay actividad reciente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const actionConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
                    created: { icon: Upload, color: 'bg-green-100 text-green-600', label: 'subió' },
                    viewed: { icon: Eye, color: 'bg-blue-100 text-blue-600', label: 'visualizó' },
                    derived: { icon: Send, color: 'bg-purple-100 text-purple-600', label: 'derivó' },
                    downloaded: { icon: FileText, color: 'bg-orange-100 text-orange-600', label: 'descargó' },
                    status_changed: { icon: Clock, color: 'bg-yellow-100 text-yellow-600', label: 'cambió estado de' },
                  };
                  
                  const config = actionConfig[activity.action] || { icon: FileText, color: 'bg-slate-100 text-slate-600', label: activity.action };
                  const ActionIcon = config.icon;
                  
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4"
                    >
                      <Avatar className="w-10 h-10 border">
                        <AvatarImage src={activity.user?.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                          {activity.user?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900">
                          <span className="font-medium">{activity.user?.full_name || 'Usuario'}</span>
                          {' '}{config.label}{' '}
                          <span className="font-medium">{activity.document?.title || 'un documento'}</span>
                          {activity.to_area && (
                            <>
                              {' '}a <span className="font-medium">{activity.to_area.name}</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <ActionIcon className="w-4 h-4" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
