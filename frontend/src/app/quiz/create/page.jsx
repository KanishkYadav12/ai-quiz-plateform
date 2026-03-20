"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Brain,
  Sparkles,
  Trophy,
  Users,
  Target,
  ChevronRight,
  Loader2,
  BookOpen,
  Zap,
  Hash,
} from "lucide-react";
import { useQuiz } from "@/hooks/quiz/useQuiz";
import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/layout/AuthGuard";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  topic: z.string().min(2, "Topic must be at least 2 characters"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  totalQuestions: z.string(),
  timePerQuestion: z.string(),
});

export default function CreateQuizPage() {
  const { generate, createLoading } = useQuiz();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      difficulty: "medium",
      totalQuestions: "10",
      timePerQuestion: "30",
    },
  });

  const onSubmit = (values) => {
    generate({
      ...values,
      totalQuestions: parseInt(values.totalQuestions),
      timePerQuestion: parseInt(values.timePerQuestion),
    });
  };

  const currentDifficulty = watch("difficulty");

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--bg-primary)] page-enter">
        <Navbar />
        <main className="max-w-5xl mx-auto px-6 py-12">
          {createLoading && (
            <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)]/90 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-3xl bg-[var(--accent-primary)] flex items-center justify-center shadow-2xl shadow-[var(--accent-primary)]/40 animate-bounce">
                  <Brain size={48} className="text-white" />
                </div>
                <div className="absolute inset-0 w-24 h-24 rounded-3xl border-4 border-[var(--accent-primary)] animate-ping opacity-20" />
              </div>
              <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2 font-display tracking-tight">AI is crafting your quiz...</h2>
              <p className="text-[var(--text-secondary)] font-medium animate-pulse">Generating questions, options, and explanations</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Column: Context & Preview */}
            <div className="space-y-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-muted)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/10 text-[10px] font-black uppercase tracking-widest mb-6">
                   <Sparkles size={12} fill="currentColor" /> AI Powered Generation
                </div>
                <h1 className="text-5xl font-black text-[var(--text-primary)] leading-[1.1] font-display tracking-tighter mb-6">
                  Turn any topic into a <span className="text-[var(--accent-primary)]">live competition.</span>
                </h1>
                <p className="text-lg text-[var(--text-secondary)] font-medium leading-relaxed">
                  Our advanced AI engine creates high-quality, balanced questions instantly. Just type a topic and let the magic happen.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="card p-6 bg-[var(--bg-secondary)] border-[var(--border)]">
                   <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                      <Target size={20} />
                   </div>
                   <h3 className="font-bold text-[var(--text-primary)] mb-1">Precise Difficulty</h3>
                   <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Questions tailored to your chosen expertise level.</p>
                </div>
                <div className="card p-6 bg-[var(--bg-secondary)] border-[var(--border)]">
                   <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4">
                      <Users size={20} />
                   </div>
                   <h3 className="font-bold text-[var(--text-primary)] mb-1">Multiplayer Ready</h3>
                   <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Invite up to 20 players for real-time live sessions.</p>
                </div>
              </div>

              <div className="card p-8 bg-[var(--bg-tertiary)]/50 border-[var(--border)] border-dashed">
                 <div className="flex items-center gap-4 text-[var(--text-disabled)] italic font-medium">
                    <BookOpen size={24} />
                    &quot;JavaScript asynchronous patterns and event loops...&quot;
                 </div>
              </div>
            </div>

            {/* Right Column: The Form */}
            <div className="card p-10 bg-[var(--bg-secondary)] border-[var(--border)] shadow-2xl relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[var(--accent-primary)] opacity-5 blur-3xl pointer-events-none" />

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Title */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] flex items-center gap-2">
                    <Hash size={12} /> Quiz Title
                  </label>
                  <input
                    {...register("title")}
                    placeholder="e.g. Modern JavaScript Challenge"
                    className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl px-6 py-4 text-lg font-bold text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                  />
                  {errors.title && <p className="text-[var(--error)] text-xs font-bold pl-2">{errors.title.message}</p>}
                </div>

                {/* Topic */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] flex items-center gap-2">
                    <Zap size={12} /> Subject / Topic
                  </label>
                  <input
                    {...register("topic")}
                    placeholder="e.g. Web Development, History, Cricket"
                    className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl px-6 py-4 text-lg font-bold text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                  />
                  {errors.topic && <p className="text-[var(--error)] text-xs font-bold pl-2">{errors.topic.message}</p>}
                </div>

                {/* Difficulty */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)] flex items-center gap-2">
                    Expertise Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["easy", "medium", "hard"].map((level) => (
                      <label
                        key={level}
                        className={`cursor-pointer group relative overflow-hidden flex items-center justify-center p-4 rounded-2xl border-2 transition-all font-black uppercase text-[10px] tracking-widest ${
                          currentDifficulty === level
                            ? level === "easy" ? "bg-[var(--success-muted)] border-[var(--success)] text-[var(--success)]"
                              : level === "medium" ? "bg-[var(--warning-muted)] border-[var(--warning)] text-[var(--warning)]"
                              : "bg-[var(--error-muted)] border-[var(--error)] text-[var(--error)]"
                            : "bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-disabled)] hover:border-[var(--text-secondary)]"
                        }`}
                      >
                        <input
                          {...register("difficulty")}
                          type="radio"
                          value={level}
                          className="sr-only"
                        />
                        {level}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Number of Questions */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Questions</label>
                    <select
                      {...register("totalQuestions")}
                      className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl px-4 py-3 font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all appearance-none"
                    >
                      {[5, 10, 15, 20].map((v) => (
                        <option key={v} value={v}>{v} Questions</option>
                      ))}
                    </select>
                  </div>

                  {/* Time Per Question */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-disabled)]">Timer (Sec)</label>
                    <select
                      {...register("timePerQuestion")}
                      className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl px-4 py-3 font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all appearance-none"
                    >
                      {[15, 20, 30, 45, 60].map((v) => (
                        <option key={v} value={v}>{v} Seconds</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 shadow-xl shadow-[var(--accent-primary)]/30 group"
                >
                  <Sparkles size={20} fill="currentColor" className="group-hover:rotate-12 transition-transform" />
                  Generate Quiz with AI
                  <ChevronRight size={20} />
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
