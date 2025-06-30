import React, { useRef, useMemo, Suspense, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Box, Line, Sphere, Environment, PerspectiveCamera, Html } from '@react-three/drei'
import { useAppStore } from '../store/useAppStore'
import * as THREE from 'three'
import { motion } from 'framer-motion'

interface NodeProps {
  position: [number, number, number]
  file: any
  onClick: () => void
  isSelected: boolean
}

function CodeNode({ position, file, onClick, isSelected }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  const color = useMemo(() => {
    if (file.health_score >= 80) return '#10b981' // emerald-500
    if (file.health_score >= 60) return '#f59e0b' // amber-500
    return '#ef4444' // red-500
  }, [file.health_score])

  const scale = useMemo(() => {
    const baseScale = 1
    const healthMultiplier = file.health_score / 100
    return baseScale + (healthMultiplier * 0.5)
  }, [file.health_score])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      meshRef.current.rotation.y += 0.005
      
      if (isSelected) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2
      } else {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05
      }
    }
  })

  return (
    <group position={position}>
      <Box
        ref={meshRef}
        args={[scale, scale, scale]}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
        scale={hovered ? 1.2 : 1}
      >
        <meshStandardMaterial 
          color={color} 
          metalness={0.8}
          roughness={0.2}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </Box>
      
      {/* Floating particles around healthy files */}
      {file.health_score >= 80 && (
        <>
          {[...Array(5)].map((_, i) => (
            <Sphere key={i} args={[0.02]} position={[
              Math.sin(i * 2) * 2,
              Math.cos(i * 2) * 2,
              Math.sin(i) * 2
            ]}>
              <meshBasicMaterial color="#10b981" />
            </Sphere>
          ))}
        </>
      )}
      
      <Text
        position={[0, -scale - 0.8, 0]}
        fontSize={0.3}
        color={isSelected ? '#3b82f6' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {file.filename}
      </Text>
      
      {/* Health indicator */}
      <Text
        position={[0, -scale - 1.2, 0]}
        fontSize={0.2}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {file.health_score.toFixed(0)}%
      </Text>
      
      {/* Tooltip on hover */}
      {hovered && (
        <Html position={[0, scale + 1, 0]} center>
          <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-sm border border-white/20">
            <div className="font-semibold">{file.filename}</div>
            <div className="text-xs opacity-75">Language: {file.language}</div>
            <div className="text-xs opacity-75">Health: {file.health_score.toFixed(0)}%</div>
            <div className="text-xs opacity-75">Lines: {file.content.split('\n').length}</div>
          </div>
        </Html>
      )}
    </group>
  )
}

function ConnectionLine({ start, end, strength = 1 }: { 
  start: [number, number, number], 
  end: [number, number, number],
  strength?: number 
}) {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ], [start, end])

  return (
    <Line
      points={points}
      color={`rgba(59, 130, 246, ${0.2 * strength})`}
      lineWidth={2 * strength}
      dashed={strength < 0.5}
      dashSize={0.1}
      gapSize={0.05}
    />
  )
}

function CameraController() {
  const { camera } = useThree()
  
  useFrame((state) => {
    // Smooth camera movement
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 2
    camera.position.z = 10 + Math.cos(state.clock.elapsedTime * 0.1) * 2
    camera.lookAt(0, 0, 0)
  })
  
  return null
}

function Scene() {
  const { codeFiles } = useAppStore()
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const nodePositions = useMemo(() => {
    if (codeFiles.length === 0) return []
    
    return codeFiles.map((_, index) => {
      const angle = (index / codeFiles.length) * Math.PI * 2
      const radius = Math.max(4, codeFiles.length * 0.8)
      const height = (Math.random() - 0.5) * 3
      
      return [
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      ] as [number, number, number]
    })
  }, [codeFiles])

  const connections = useMemo(() => {
    const connections: Array<{
      start: [number, number, number], 
      end: [number, number, number],
      strength: number
    }> = []
    
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        const file1 = codeFiles[i]
        const file2 = codeFiles[j]
        
        // Create stronger connections between files of same language
        const sameLanguage = file1.language === file2.language
        const healthSimilarity = 1 - Math.abs(file1.health_score - file2.health_score) / 100
        
        let connectionStrength = 0.3
        if (sameLanguage) connectionStrength += 0.4
        connectionStrength += healthSimilarity * 0.3
        
        if (connectionStrength > 0.5 || Math.random() > 0.7) {
          connections.push({
            start: nodePositions[i],
            end: nodePositions[j],
            strength: connectionStrength
          })
        }
      }
    }
    
    return connections
  }, [nodePositions, codeFiles])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
      <spotLight 
        position={[0, 20, 0]} 
        angle={0.3} 
        penumbra={1} 
        intensity={0.8}
        color="#10b981"
        castShadow
      />
      
      {/* Environment */}
      <Environment preset="night" />
      
      {/* Nodes */}
      {codeFiles.map((file, index) => (
        <CodeNode
          key={file.id}
          position={nodePositions[index]}
          file={file}
          isSelected={selectedFile === file.id}
          onClick={() => setSelectedFile(selectedFile === file.id ? null : file.id)}
        />
      ))}
      
      {/* Connections */}
      {connections.map((connection, index) => (
        <ConnectionLine
          key={index}
          start={connection.start}
          end={connection.end}
          strength={connection.strength}
        />
      ))}
      
      {/* Central core */}
      {codeFiles.length > 0 && (
        <Sphere args={[0.5]} position={[0, 0, 0]}>
          <meshStandardMaterial 
            color="#3b82f6" 
            metalness={1}
            roughness={0}
            emissive="#1e40af"
            emissiveIntensity={0.2}
          />
        </Sphere>
      )}
      
      {/* Floating text */}
      {codeFiles.length > 0 && (
        <Text
          position={[0, -3, 0]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          CodexOrb Universe
        </Text>
      )}
      
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        minDistance={5}
        maxDistance={20}
        autoRotate={codeFiles.length === 0}
        autoRotateSpeed={0.5}
      />
      
      {codeFiles.length === 0 && <CameraController />}
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-white text-lg">Loading 3D Universe...</div>
        <div className="text-gray-400 text-sm mt-2">Preparing your code visualization</div>
      </div>
    </div>
  )
}

export function CodeSculpture() {
  const { codeFiles, currentSession } = useAppStore()
  const [showControls, setShowControls] = useState(true)

  if (!currentSession) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-center">
          <motion.div 
            className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-4">
            3D Code Universe
          </h3>
          <p className="text-gray-300 text-lg">
            Join a session to see your code come to life in 3D space
          </p>
        </div>
      </div>
    )
  }

  if (codeFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
        <div className="text-center">
          <motion.div 
            className="w-32 h-32 border-4 border-dashed border-gray-400 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ 
              rotate: [0, 360],
              borderColor: ['#9ca3af', '#3b82f6', '#8b5cf6', '#9ca3af']
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-4">
            Empty Universe
          </h3>
          <p className="text-gray-300 text-lg mb-2">
            Generate some code to populate your 3D space
          </p>
          <p className="text-gray-400 text-sm">
            Each file becomes a node in your code universe
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-900 relative overflow-hidden">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas 
          camera={{ position: [0, 5, 10], fov: 60 }}
          shadows
          gl={{ antialias: true, alpha: false }}
        >
          <Scene />
        </Canvas>
      </Suspense>
      
      {/* Controls Panel */}
      <motion.div 
        className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-xl p-4 text-white border border-white/20"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: showControls ? 1 : 0.3, x: 0 }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <h4 className="font-semibold mb-3 text-lg">3D Universe Controls</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Healthy Code (80%+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Warning (60-79%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Issues (&lt;60%)</span>
          </div>
          <hr className="border-white/20 my-3" />
          <div className="text-xs text-gray-300 space-y-1">
            <div>🖱️ Click & drag to rotate</div>
            <div>🔍 Scroll to zoom</div>
            <div>📦 Click nodes to select</div>
            <div>🔗 Lines show relationships</div>
          </div>
        </div>
      </motion.div>

      {/* Stats Panel */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-xl p-4 text-white border border-white/20">
        <h4 className="font-semibold mb-2">Universe Stats</h4>
        <div className="text-sm space-y-1">
          <div>Files: {codeFiles.length}</div>
          <div>Avg Health: {(codeFiles.reduce((sum, f) => sum + f.health_score, 0) / codeFiles.length).toFixed(0)}%</div>
          <div>Languages: {[...new Set(codeFiles.map(f => f.language))].join(', ')}</div>
        </div>
      </div>
    </div>
  )
}