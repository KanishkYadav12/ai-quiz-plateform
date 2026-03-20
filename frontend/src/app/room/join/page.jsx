"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Zap,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Hash,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";

const schema = z.object({
  roomCode: z.string().length(6, "Code must be exactly 6 digits"),
});

export default function JoinRoomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values) => {
    setLoading(true);
    // Fair Play Agreement would normally be here,
    // for now we redirect to lobby which handles connection
    router.push(`/room/${values.roomCode}/lobby`);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-primary)] page-enter">
        <Navbar />
        <main className="max-w-xl px-6 py-20 mx-auto">

          <div className="text-center mb-12">
             <div className="w-20 h-20 rounded-3xl bg-[var(--accent-muted)] text-[var(--accent-primary)] flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Zap size={40} fill="currentColor" />
             </div>
             <h1 className="text-4xl font-black text-[var(--text-primary)] font-display tracking-tight mb-3">Join Competition</h1>
             <p className="text-[var(--text-secondary)] font-medium">Enter the 6-digit code to enter the lobby</p>
          </div>

          <div className="card p-10 bg-[var(--bg-secondary)] border-[var(--border)] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent-primary)] to-transparent" />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-disabled)] flex items-center justify-center gap-2">
                  <Hash size={12} /> Access Code
                </label>
                <input
                  {...register("roomCode")}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl px-4 py-6 text-center text-5xl font-black tracking-[0.3em] text-[var(--text-primary)] placeholder-[var(--bg-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all mono"
                />
                {errors.roomCode && (
                  <p className="text-[var(--error)] text-sm font-bold text-center">
                    {errors.roomCode.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 shadow-xl shadow-[var(--accent-primary)]/20"
              >
                {loading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <Sparkles size={20} fill="currentColor" />
                    Enter Room
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-[var(--border)] grid grid-cols-2 gap-4">
               <div className="flex flex-col items-center text-center gap-2">
                  <ShieldCheck size={20} className="text-[var(--success)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Fair Play Active</span>
               </div>
               <div className="flex flex-col items-center text-center gap-2">
                  <Zap size={20} className="text-[var(--gold)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Real-time Sync</span>
               </div>
            </div>
          </div>

          <p className="text-center mt-12 text-[var(--text-disabled)] text-sm font-medium">
            Waiting for a host? <button onClick={() => router.push('/dashboard')} className="text-[var(--accent-primary)] font-bold hover:underline">Browse Public Rooms</button>
          </p>
        </main>
      </div>
    </AuthGuard>
  );
}
