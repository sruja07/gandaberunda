"use client";
import React from 'react';
import { TaskStep } from '@/types/agent';
import { CheckCircle2, Circle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimelineProps {
  tasks: TaskStep[];
  onApprove: (id: string) => void;
}

export default function TaskTimeline({ tasks, onApprove }: TimelineProps) {
  return (
    <div className="relative space-y-8 pl-8 py-4">
      {/* The guiding vertical line */}
      <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800" />

      {tasks.map((task) => (
        <div key={task.step_id} className="relative group">
          {/* Status Icon Dot */}
          <div className={cn(
            "absolute -left-7 top-1 w-6 h-6 rounded-full border-4 border-white dark:border-slate-950 z-10 flex items-center justify-center transition-all duration-500",
            task.status === 'COMPLETED' && "bg-emerald-500",
            task.status === 'IN_PROGRESS' && "bg-blue-500 animate-pulse",
            task.status === 'REQUIRES_APPROVAL' && "bg-amber-500",
            task.status === 'PENDING' && "bg-slate-300 dark:bg-slate-700"
          )}>
            {task.status === 'COMPLETED' && <CheckCircle2 size={10} className="text-white" />}
            {task.status === 'IN_PROGRESS' && <Loader2 size={10} className="text-white animate-spin" />}
            {task.status === 'REQUIRES_APPROVAL' && <AlertCircle size={10} className="text-white" />}
          </div>

          {/* Task Card */}
          <div className={cn(
            "p-5 rounded-2xl border transition-all duration-300",
            task.status === 'IN_PROGRESS' ? "bg-blue-50 border-blue-200 shadow-sm" : 
            task.status === 'REQUIRES_APPROVAL' ? "bg-amber-50 border-amber-200 shadow-md ring-1 ring-amber-300" : 
            "bg-white border-slate-200 hover:border-slate-300",
            "dark:bg-slate-900 dark:border-slate-800"
          )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{task.tool}</span>
                  {task.risk_level === 'HIGH' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">High Risk</span>
                  )}
                </div>
                <h3 className={cn(
                  "font-medium transition-colors",
                  task.status === 'PENDING' ? "text-slate-400" : "text-slate-900 dark:text-white"
                )}>
                  {task.title}
                </h3>
                {task.result && (
                  <p className="text-sm text-slate-500 mt-1 italic">"{task.result}"</p>
                )}
              </div>

              {task.status === 'REQUIRES_APPROVAL' && (
                <button 
                  onClick={() => onApprove(task.step_id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-all active:scale-95"
                >
                  Approve <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
