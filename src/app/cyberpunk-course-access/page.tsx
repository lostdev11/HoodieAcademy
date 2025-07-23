"use client"

import Component from "../../components/TokenGate"
 
export default function Page() {
  return (
    <Component>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cyan-400 mb-4">Cyberpunk Course Access</h1>
          <p className="text-gray-300">This content is protected by token gate.</p>
        </div>
      </div>
    </Component>
  )
} 