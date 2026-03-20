'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Zap, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import AuthGuard from '@/components/layout/AuthGuard'
import { useRoom } from '@/hooks/room/useRoom'

const schema = z.object({
  roomCode: z.string().length(6, 'Room code must be exactly 6 digits').regex(/^\d+$/, 'Must be numbers only'),
})

export default function JoinRoomPage() {
  const router = useRouter()
  const { detailLoading, detailError, loadRoom, room } = useRoom()

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ roomCode }) => {
    await loadRoom(roomCode)
    // navigate if room found — handled by effect in component
    router.push(`/room/${roomCode}/lobby`)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f0f4ff]">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-16">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-[#1A1A2E] mb-8 transition-colors">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#E94560]/10 flex items-center justify-center mx-auto mb-5">
              <Zap size={28} className="text-[#E94560]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Join a Room</h1>
            <p className="text-gray-500 mb-8">Enter the 6-digit room code from your host</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <input
                  {...register('roomCode')}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full text-center text-3xl font-bold tracking-widest border-2 border-gray-200 rounded-2xl px-4 py-4 text-[#1A1A2E] focus:outline-none focus:border-[#E94560] transition-colors"
                />
                {errors.roomCode && <p className="text-red-500 text-sm mt-2">{errors.roomCode.message}</p>}
                {detailError && <p className="text-red-500 text-sm mt-2">{detailError}</p>}
              </div>
              <button
                type="submit"
                disabled={detailLoading}
                className="w-full bg-[#E94560] hover:bg-[#c73652] disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {detailLoading ? <><Loader2 size={18} className="animate-spin" /> Joining...</> : <><Zap size={18} /> Join Room</>}
              </button>
            </form>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
