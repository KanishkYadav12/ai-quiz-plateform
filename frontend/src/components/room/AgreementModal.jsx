'use client'
import { useState, useEffect } from 'react'
import { ShieldCheck, CheckCircle2, AlertTriangle, X } from 'lucide-react'

export default function FairPlayModal({ isOpen, onConfirm, onCancel }) {
  const [agreed, setAgreed] = useState(false)

  if (!isOpen) return null

  const rules = [
    "Play honestly without external help",
    "Not switch browser tabs during the quiz",
    "Not use search engines or AI tools during gameplay",
    "Stay in the quiz until it ends",
    "Accept that leaving mid-game = disqualification",
    "Your score will be permanently recorded"
  ]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-md" onClick={onCancel} />

      <div className="card w-full max-w-lg bg-[var(--bg-secondary)] border-[var(--border)] shadow-2xl relative z-10 overflow-hidden animate-[fadeSlideUp_0.3s_ease]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--success)]" />

        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-[var(--accent-muted)] text-[var(--accent-primary)] flex items-center justify-center">
                  <ShieldCheck size={24} />
               </div>
               <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Fair Play Agreement</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Integrity commitment</p>
               </div>
            </div>
            <button onClick={onCancel} className="text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-6 mb-8">
             <p className="text-sm font-medium text-[var(--text-secondary)] mb-6">By joining this quiz room, you agree to:</p>
             <ul className="space-y-4">
                {rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-[var(--success)] mt-0.5 shrink-0" />
                    <span className="text-sm font-bold text-[var(--text-primary)]">{rule}</span>
                  </li>
                ))}
             </ul>
          </div>

          <div className="flex flex-col gap-4">
             <button
                onClick={onConfirm}
                className="btn-primary w-full py-4 text-sm font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-primary)]/20"
             >
                <ShieldCheck size={18} />
                I Agree & Enter Room
             </button>
             <button
                onClick={onCancel}
                className="w-full py-3 text-xs font-bold text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-all"
             >
                Decline & Go Back
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
