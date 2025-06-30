import React, { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei'
import { 
  Zap, 
  Code, 
  Users, 
  Brain, 
  Rocket, 
  Shield, 
  Globe, 
  ArrowRight,
  Play,
  Sparkles,
  Bot,
  Cuboid as Cube,
  MessageSquare,
  BarChart3,
  ChevronDown
} from 'lucide-react'
import * as THREE from 'three'

// Animated 3D Orb Component
function AnimatedOrb() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
      meshRef.current.rotation.y += 0.01
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color="#3b82f6"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  )
}

// Hero Section
function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <AnimatedOrb />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center space-x-4 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
            >
              <Cube className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              CodexOrb
            </h1>
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-2xl md:text-3xl text-gray-300 mb-8 font-light"
          >
            Code collaboratively. Visually. Intelligently.
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Experience the future of software development with AI-powered code generation, 
            real-time collaboration, and immersive 3D visualization. Transform your ideas 
            into reality with the speed of thought.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
        >
          <button
            onClick={onGetStarted}
            className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-2"
          >
            <Rocket className="w-5 h-5" />
            <span>Start Building</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="group px-8 py-4 border-2 border-gray-600 text-gray-300 rounded-2xl font-semibold text-lg hover:border-blue-500 hover:text-blue-400 transition-all duration-300 flex items-center space-x-2">
            <Play className="w-5 h-5" />
            <span>Watch Demo</span>
          </button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-gray-400"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Generation",
      description: "Generate production-ready code with Groq's ultra-fast Llama models. From simple functions to complex applications.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Work together seamlessly with live updates, shared sessions, and role-based permissions.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Cube,
      title: "3D Code Visualization",
      description: "See your codebase come alive in immersive 3D space. Understand architecture at a glance.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Powered by Groq's inference engine for instant responses and real-time code analysis.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Built on Supabase with row-level security, authentication, and data encryption.",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Track code health, collaboration metrics, and project insights with intelligent dashboards.",
      color: "from-indigo-500 to-purple-500"
    }
  ]

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Supercharge Your Development
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Experience the next generation of coding tools designed for modern developers
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Demo Section
function DemoSection() {
  const [activeTab, setActiveTab] = useState(0)
  const tabs = [
    { name: 'AI Chat', icon: MessageSquare, color: 'text-blue-500' },
    { name: 'Code Editor', icon: Code, color: 'text-green-500' },
    { name: '3D Visualization', icon: Cube, color: 'text-purple-500' },
    { name: 'Analytics', icon: BarChart3, color: 'text-orange-500' }
  ]

  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 to-blue-900">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            See CodexOrb in Action
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore our powerful features through interactive demonstrations
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-12 space-x-2">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                activeTab === index
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === index ? 'text-gray-900' : tab.color}`} />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Demo Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
        >
          <div className="aspect-video bg-gray-900 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${
                activeTab === 0 ? 'from-blue-500 to-cyan-500' :
                activeTab === 1 ? 'from-green-500 to-emerald-500' :
                activeTab === 2 ? 'from-purple-500 to-pink-500' :
                'from-orange-500 to-red-500'
              } flex items-center justify-center mx-auto mb-6`}>
                {React.createElement(tabs[activeTab].icon, { className: "w-12 h-12 text-white" })}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {tabs[activeTab].name} Demo
              </h3>
              <p className="text-gray-300 mb-6">
                Interactive demo coming soon! Experience the full power of CodexOrb.
              </p>
              <button className="px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                Try It Now
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Stats Section
function StatsSection() {
  const stats = [
    { number: "10x", label: "Faster Development", icon: Zap },
    { number: "99.9%", label: "Uptime Guarantee", icon: Shield },
    { number: "50+", label: "Programming Languages", icon: Code },
    { number: "1M+", label: "Lines Generated", icon: Bot }
  ]

  return (
    <section className="py-24 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-700">
      <div className="max-w-4xl mx-auto text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Coding?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already building the future with CodexOrb
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={onGetStarted}
              className="group px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Start Free Today</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="text-blue-100 text-sm">
              No credit card required • Free forever plan
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Main HomePage Component
export function HomePage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen">
      <HeroSection onGetStarted={onGetStarted} />
      <FeaturesSection />
      <DemoSection />
      <StatsSection />
      <CTASection onGetStarted={onGetStarted} />
    </div>
  )
}