'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  FileText,
  Mail,
  Clock,
  AlertTriangle,
  FileX,
  Target,
  Eye,
  Zap,
  Upload,
  RefreshCw,
  History,
  Users,
  Lock,
  BarChart3,
  Play,
  Check,
  ArrowRight,
  Star,
  Twitter,
  Linkedin,
  Github,
  ChevronRight,
  Shield,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

// Animated section wrapper
function AnimatedSection({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeInUp}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// Navbar
function Navbar() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="ATLAS" width={36} height={36} className="rounded-xl shadow-lg shadow-blue-600/20 h-10 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Características
            </a>
            <a href="#demo" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Demo
            </a>
            <a href="#testimonials" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Testimonios
            </a>
            <Link href="/pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Precios
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25">
                Comenzar gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </motion.header>
  );
}

// Hero Section
function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen pt-32 pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-50" />
      <motion.div
        style={{ y, opacity }}
        className="absolute top-20 -left-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
      />
      <motion.div
        style={{ y, opacity }}
        className="absolute bottom-20 -right-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-6"
            >
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                Nueva versión disponible
              </Badge>
              <span className="text-sm text-slate-500">v2.0 con más funciones</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
              Gestiona tus documentos{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                sin correos ni caos
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
              ATLAS centraliza, rastrea y asegura cada documento empresarial. 
              Elimina los correos perdidos y obtén trazabilidad completa en un solo lugar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl shadow-blue-600/25 text-base h-12 px-8">
                  Comenzar gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8">
                <Play className="w-4 h-4 mr-2" />
                Ver demo
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-6 mt-10"
            >
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                100% Seguro
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-blue-600" />
                </div>
                Ahorra 10hrs/semana
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                  <Eye className="w-3 h-3 text-purple-600" />
                </div>
                Trazabilidad completa
              </div>
            </motion.div>
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="relative"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-200 overflow-hidden">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md px-3 py-1.5 text-sm text-slate-500 border border-slate-200">
                    atlas.app/dashboard
                  </div>
                </div>
              </div>
              
              {/* Dashboard content preview */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
                    <div className="h-3 w-24 bg-slate-100 rounded" />
                  </div>
                  <div className="h-10 w-28 bg-blue-600 rounded-lg" />
                </div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3">
                      <div className="h-3 w-12 bg-slate-200 rounded mb-2" />
                      <div className="h-6 w-16 bg-slate-300 rounded" />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg" />
                      <div className="flex-1">
                        <div className="h-3 w-40 bg-slate-200 rounded mb-2" />
                        <div className="h-2 w-24 bg-slate-100 rounded" />
                      </div>
                      <div className="h-6 w-16 bg-green-100 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Documento aprobado</p>
                  <p className="text-xs text-slate-500">hace 2 minutos</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">+127 documentos</p>
                  <p className="text-xs text-slate-500">este mes</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Problem Section
function ProblemSection() {
  const problems = [
    { icon: Mail, title: 'Documentos perdidos', description: 'Archivos importantes enterrados en cadenas de correo interminables' },
    { icon: Clock, title: 'Horas buscando', description: 'Tiempo valioso desperdiciado buscando la versión correcta' },
    { icon: AlertTriangle, title: 'Sin control', description: 'Imposible saber quién aprobó qué y cuándo' },
    { icon: FileX, title: 'Errores costosos', description: 'Documentos duplicados y procesos manuales propensos a errores' },
  ];

  return (
    <AnimatedSection className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            variants={fadeInUp}
            className="text-3xl sm:text-4xl font-bold text-slate-900"
          >
            ¿Te suena familiar?
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Los problemas de gestión documental afectan a empresas de todos los tamaños
          </motion.p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <problem.icon className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-1">
                      {problem.title}
                    </h3>
                    <p className="text-slate-600">{problem.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// Solution Section
function SolutionSection() {
  const steps = [
    { label: 'Recepción', color: 'bg-blue-500' },
    { label: 'Revisión', color: 'bg-purple-500' },
    { label: 'Aprobación', color: 'bg-green-500' },
    { label: 'Archivo', color: 'bg-slate-500' },
  ];

  const benefits = [
    { icon: Target, title: 'Centralización total', description: 'Todos los documentos en un solo lugar accesible' },
    { icon: Eye, title: 'Trazabilidad completa', description: 'Historial detallado de cada acción' },
    { icon: Zap, title: 'Automatización inteligente', description: 'Flujos de trabajo optimizados' },
  ];

  return (
    <AnimatedSection className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-blue-100 text-blue-700 mb-4">La solución</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            ATLAS ordena tu flujo de punta a punta
          </h2>
        </div>

        {/* Flow diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-4 mb-16 overflow-x-auto pb-4"
        >
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, type: 'spring' }}
                className={`px-6 py-3 rounded-full ${step.color} text-white font-medium shadow-lg`}
              >
                {step.label}
              </motion.div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-6 h-6 text-slate-300 mx-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </motion.div>

        {/* Benefits */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={scaleIn}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
                <benefit.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{benefit.title}</h3>
              <p className="text-slate-600">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    { icon: Upload, title: 'Sube y comparte', description: 'Documentos instantáneamente disponibles para tu equipo' },
    { icon: RefreshCw, title: 'Deriva con trazabilidad', description: 'Envía documentos con historial automático de acciones' },
    { icon: History, title: 'Historial completo', description: 'Cada visualización, descarga y cambio registrado' },
    { icon: Users, title: 'Gestión de equipo', description: 'Roles y permisos personalizados por usuario' },
    { icon: Lock, title: 'Seguridad garantizada', description: 'Encriptación y aislamiento de datos por empresa' },
    { icon: BarChart3, title: 'Reportes en tiempo real', description: 'Métricas y estadísticas de tu gestión documental' },
  ];

  return (
    <AnimatedSection id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-purple-100 text-purple-700 mb-4">Características</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Todo lo que necesitas para gestionar documentos
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Herramientas potentes diseñadas para simplificar tu flujo de trabajo
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-4 group-hover:from-blue-100 group-hover:to-purple-100 transition-colors">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// Demo Section
function DemoSection() {
  return (
    <AnimatedSection id="demo" className="py-24 bg-slate-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 mb-4">
            Vista previa
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Mira ATLAS en acción
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Descubre cómo simplificar tu gestión documental en minutos
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>

            {/* Video placeholder */}
            <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors"
              >
                <Play className="w-8 h-8 text-white ml-1" />
              </motion.button>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// Social Proof Section
function SocialProofSection() {
  const testimonials = [
    {
      quote: 'Reducimos el tiempo de aprobación de facturas en un 70%. ATLAS transformó nuestra operación.',
      author: 'María González',
      role: 'Gerente de Finanzas',
      company: 'TechCorp SA',
    },
    {
      quote: 'Por fin tenemos visibilidad completa de cada documento. No más correos perdidos.',
      author: 'Carlos Ruiz',
      role: 'Director de Operaciones',
      company: 'Logística Plus',
    },
    {
      quote: 'La implementación fue rápida y el equipo lo adoptó de inmediato. Muy intuitivo.',
      author: 'Ana Martínez',
      role: 'Jefa de Administración',
      company: 'Grupo Industrial',
    },
  ];

  const companies = [
    { name: 'TechCorp', industry: 'Tecnología' },
    { name: 'Logística Plus', industry: 'Transporte' },
    { name: 'Grupo Industrial', industry: 'Manufactura' },
    { name: 'Banca Nacional', industry: 'Finanzas' },
    { name: 'Farma Salud', industry: 'Farmacéutica' },
    { name: 'Construcciones MR', industry: 'Construcción' },
  ];

  return (
    <AnimatedSection id="testimonials" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Empresas que confían en ATLAS
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Más de 200 empresas ya optimizaron su gestión documental
          </p>
        </div>


        {/* Testimonials */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="border-0 shadow-lg h-full">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{testimonial.author}</p>
                      <p className="text-sm text-slate-500">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// CTA Section
function CTASection() {
  return (
    <AnimatedSection className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Comienza a organizar tu empresa hoy
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
            Sin tarjeta de crédito • 5 minutos de setup • Soporte incluido
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl text-lg h-14 px-10">
                Crear cuenta gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-14 px-10">
                Ver planes y precios
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// Footer
function Footer() {
  const footerLinks = {
    Producto: [
      { label: 'Características', href: '#features' },
      { label: 'Precios', href: '/pricing' },
      { label: 'Demo', href: '#demo' },
    ],
    Recursos: [
      { label: 'Documentación', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Tutoriales', href: '#' },
    ],
    Empresa: [
      { label: 'Sobre nosotros', href: '#' },
      { label: 'Contacto', href: '#' },
    ],
    Legal: [
      { label: 'Privacidad', href: '#' },
      { label: 'Términos', href: '#' },
    ],
  };

  return (
    <footer className="bg-slate-900 text-slate-400 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.svg" alt="ATLAS" width={36} height={36} className="rounded-xl" />
              <span className="font-bold text-xl text-white">ATLAS</span>
            </Link>
            <p className="text-sm mb-6">
              Gestión documental empresarial moderna y segura.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="py-8 border-b border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-white mb-1">Suscríbete a nuestro newsletter</h4>
              <p className="text-sm">Recibe actualizaciones y consejos de productividad</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                type="email"
                placeholder="tu@email.com"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button className="bg-blue-600 hover:bg-blue-700">Suscribir</Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>© 2026 ATLAS. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Datos protegidos con encriptación AES-256</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Page Component
export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <DemoSection />
      <SocialProofSection />
      <CTASection />
      <Footer />
    </main>
  );
}
