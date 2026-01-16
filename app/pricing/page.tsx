'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, Zap, Shield, Users, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: '$0',
      description: 'Perfecto para comenzar',
      features: [
        '5 usuarios incluidos',
        '100 documentos',
        '1 GB de almacenamiento',
        'Soporte por email',
        'Historial básico',
      ],
      cta: 'Comenzar gratis',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$49',
      description: 'Para equipos en crecimiento',
      features: [
        '25 usuarios incluidos',
        'Documentos ilimitados',
        '50 GB de almacenamiento',
        'Soporte prioritario',
        'Historial completo',
        'API access',
        'Integraciones avanzadas',
        'Reportes personalizados',
      ],
      cta: 'Comenzar prueba gratis',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Para grandes organizaciones',
      features: [
        'Usuarios ilimitados',
        'Documentos ilimitados',
        'Almacenamiento ilimitado',
        'Soporte 24/7 dedicado',
        'SLA garantizado',
        'On-premise disponible',
        'SSO / SAML',
        'Auditoría avanzada',
        'Administrador de cuenta',
      ],
      cta: 'Contactar ventas',
      popular: false,
    },
  ];

  const faqs = [
    {
      question: '¿Puedo cambiar de plan en cualquier momento?',
      answer: 'Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplican inmediatamente.',
    },
    {
      question: '¿Hay algún costo de implementación?',
      answer: 'No, todos nuestros planes incluyen la implementación sin costo adicional. Nuestro equipo te ayudará a configurar todo.',
    },
    {
      question: '¿Qué métodos de pago aceptan?',
      answer: 'Aceptamos todas las tarjetas de crédito principales, transferencias bancarias y facturación empresarial.',
    },
    {
      question: '¿Ofrecen descuentos por pago anual?',
      answer: 'Sí, ofrecemos 20% de descuento en todos los planes cuando pagas anualmente.',
    },
  ];

  const benefits = [
    { icon: Zap, title: 'Setup en minutos', description: 'Configuración rápida sin necesidad de técnicos' },
    { icon: Shield, title: 'Seguridad garantizada', description: 'Encriptación AES-256 y cumplimiento normativo' },
    { icon: Users, title: 'Soporte incluido', description: 'Equipo dedicado para ayudarte siempre' },
    { icon: Clock, title: 'Sin contratos', description: 'Cancela cuando quieras, sin penalidades' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="ATLAS" width={36} height={36} className="rounded-xl" />
              <span className="font-bold text-xl text-slate-900">ATLAS</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-600">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  Comenzar gratis
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      {/* Hero */}
      <section className="pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-blue-100 text-blue-700 mb-4">Precios transparentes</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Planes que se adaptan a tu empresa
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Sin costos ocultos. Sin sorpresas. Comienza gratis y escala cuando lo necesites.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -5 }}
                className="relative"
              >
                <Card className={`h-full ${plan.popular ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/10' : 'border-slate-200'}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      Más popular
                    </Badge>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="pt-4">
                      <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                      {plan.price !== 'Custom' && <span className="text-slate-500">/mes</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-600">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={plan.price === 'Custom' ? '#contact' : '/register'} className="block">
                      <Button 
                        className={`w-full ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' 
                            : ''
                        }`}
                        variant={plan.popular ? 'default' : 'outline'}
                      >
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Todos los planes incluyen
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {benefits.map((benefit, index) => (
              <motion.div key={index} variants={fadeInUp} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{benefit.title}</h3>
                <p className="text-sm text-slate-600">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Preguntas frecuentes
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                    <p className="text-slate-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              ¿Listo para transformar tu gestión documental?
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Únete a cientos de empresas que ya confían en ATLAS para gestionar sus documentos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl">
                  Comenzar gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Hablar con ventas
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="ATLAS" width={32} height={32} className="rounded-lg" />
              <span className="font-bold text-lg text-white">ATLAS</span>
            </Link>
            <p className="text-sm">© 2026 ATLAS. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
