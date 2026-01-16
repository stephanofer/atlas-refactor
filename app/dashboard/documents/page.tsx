'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Clock,
  User,
  Building2,
  ChevronRight,
  Upload,
  Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { Document } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  in_review: { label: 'En revisión', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  derived: { label: 'Derivado', color: 'bg-purple-100 text-purple-700' },
  archived: { label: 'Archivado', color: 'bg-slate-100 text-slate-700' },
};

const priorityColors: Record<string, string> = {
  low: 'border-l-slate-300',
  normal: 'border-l-blue-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-500',
};

function DocumentCard({ document }: { document: Document }) {
  return (
    <Link href={`/dashboard/documents/${document.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className={`
          group bg-white rounded-xl border border-slate-200 p-4 cursor-pointer
          transition-all duration-200 hover:shadow-md hover:border-slate-300
          border-l-4 ${priorityColors[document.priority]}
        `}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
            <FileText className="w-6 h-6 text-slate-500 group-hover:text-blue-600 transition-colors" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                {document.title}
              </h3>
              <Badge className={statusLabels[document.status]?.color || 'bg-slate-100 text-slate-700'}>
                {statusLabels[document.status]?.label || document.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {document.current_area?.name || 'Sin área'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDistanceToNow(new Date(document.created_at), { 
                  addSuffix: true,
                  locale: es 
                })}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className="text-xs">
                {document.file_type.toUpperCase()}
              </Badge>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
        </div>
      </motion.div>
    </Link>
  );
}

export default function DocumentsPage() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState('all');
  const supabase = createClient();

  useEffect(() => {
    async function fetchDocuments() {
      if (!profile?.company_id) return;

      try {
        let query = supabase
          .from('documents')
          .select(`
            *,
            current_area:areas!documents_current_area_id_fkey(*),
            current_user:users!documents_current_user_id_fkey(id, full_name, avatar_url),
            creator:users!documents_created_by_fkey(id, full_name, avatar_url)
          `)
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false });

        // Apply tab filter
        if (currentTab === 'inbox') {
          query = query.or(`current_user_id.eq.${profile.id},and(current_area_id.eq.${profile.area_id},current_user_id.is.null)`);
        } else if (currentTab === 'sent') {
          query = query.eq('created_by', profile.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        setDocuments(data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [profile?.company_id, profile?.id, profile?.area_id, currentTab]);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
          <p className="text-slate-500 mt-1">Gestiona y rastrea todos tus documentos</p>
        </div>
        <Link href="/dashboard/upload">
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25">
            <Upload className="w-4 h-4 mr-2" />
            Subir Documento
          </Button>
        </Link>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="all" className="data-[state=active]:bg-white">
              Todos
            </TabsTrigger>
            <TabsTrigger value="inbox" className="data-[state=active]:bg-white">
              Mi bandeja
            </TabsTrigger>
            <TabsTrigger value="sent" className="data-[state=active]:bg-white">
              Enviados
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {Object.entries(statusLabels).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Documents List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchQuery || statusFilter !== 'all'
                  ? 'Sin resultados'
                  : 'No hay documentos'}
              </h3>
              <p className="text-slate-500 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Sube tu primer documento para comenzar'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link href="/dashboard/upload">
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Subir documento
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <DocumentCard document={doc} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
