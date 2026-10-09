"use client";
import React from 'react';
import { TaskStep } from '@/types/agent';
import { CheckCircle2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
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
  // Vibrant tag colors per tool type
  const getToolTagColor = (tool: string) => {
    switch (tool.toLowerCase()) {
      case 'reasoning_engine':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'web_search':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'system_api':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'summarizer':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="relative space-y-6 pl-8 py-2">
      {/* Colorful vertical timeline bar */}
      <div className="absolute left-[11px] top-3 bottom-3 w-[2.5px] bg-gradient-to-b from-rose-400 via-purple-400 to-indigo-300 rounded-full" />

      {tasks.map((task) => (
        <div key={task.step_id} className="relative group">
          {/* Status Icon Dot */}
          <div className={cn(
            "absolute -left-[27px] top-2.5 w-6 h-6 rounded-full border-2 border-white z-10 flex items-center justify-center transition-all duration-300 shadow-md",
            task.status === 'COMPLETED' && "bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-200",
            task.status === 'IN_PROGRESS' && "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white animate-pulse shadow-indigo-300 ring-4 ring-indigo-100",
            task.status === 'REQUIRES_APPROVAL' && "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-200 ring-4 ring-amber-100",
            task.status === 'PENDING' && "bg-slate-200 text-slate-400 border-slate-100"
          )}>
            {task.status === 'COMPLETED' && <CheckCircle2 size={12} className="text-white" />}
            {task.status === 'IN_PROGRESS' && <Loader2 size={12} className="text-white animate-spin" />}
            {task.status === 'REQUIRES_APPROVAL' && <AlertCircle size={12} className="text-white" />}
          </div>

          {/* Task Card with Vibrant Tinted Backgrounds */}
          <div className={cn(
            "p-5 rounded-2xl border transition-all duration-300",
            task.status === 'COMPLETED' ? "bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50 border-emerald-200/80 shadow-sm" :
            task.status === 'IN_PROGRESS' ? "bg-gradient-to-r from-indigo-50/90 via-purple-50/40 to-white border-indigo-200 shadow-md ring-1 ring-indigo-200" : 
            task.status === 'REQUIRES_APPROVAL' ? "bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white border-amber-200 shadow-md ring-1 ring-amber-300" : 
            "bg-white/90 border-slate-200 hover:border-slate-300 shadow-sm"
          )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                    getToolTagColor(task.tool)
                  )}>
                    {task.tool}
                  </span>
                  {task.risk_level === 'HIGH' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500 text-white shadow-xs">
                      High Risk
                    </span>
                  )}
                </div>
                <h3 className={cn(
                  "text-[15px] font-semibold leading-snug transition-colors",
                  task.status === 'PENDING' ? "text-slate-400" : "text-slate-800"
                )}>
                  {task.title}
                </h3>
                {task.result && (
                  <p className="text-[13px] text-emerald-700 font-medium mt-1 italic flex items-center gap-1">
                    <span>✓</span> "{task.result}"
                  </p>
                )}
              </div>

              {task.status === 'REQUIRES_APPROVAL' && (
                <button 
                  onClick={() => onApprove(task.step_id)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-full text-[14px] font-semibold transition-all shadow-md shadow-amber-200 active:scale-95 shrink-0"
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
