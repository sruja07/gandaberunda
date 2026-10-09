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
  return (
    <div className="relative space-y-6 pl-8 py-2">
      {/* Guiding vertical timeline bar */}
      <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-[#ebebeb]" />

      {tasks.map((task) => (
        <div key={task.step_id} className="relative group">
          {/* Status Icon Dot */}
          <div className={cn(
            "absolute -left-[27px] top-2 w-6 h-6 rounded-full border-2 border-white z-10 flex items-center justify-center transition-all duration-300 shadow-sm",
            task.status === 'COMPLETED' && "bg-[#008a05] text-white",
            task.status === 'IN_PROGRESS' && "bg-[#ff385c] text-white animate-pulse",
            task.status === 'REQUIRES_APPROVAL' && "bg-[#e07a00] text-white",
            task.status === 'PENDING' && "bg-[#dddddd] text-[#6a6a6a]"
          )}>
            {task.status === 'COMPLETED' && <CheckCircle2 size={12} className="text-white" />}
            {task.status === 'IN_PROGRESS' && <Loader2 size={12} className="text-white animate-spin" />}
            {task.status === 'REQUIRES_APPROVAL' && <AlertCircle size={12} className="text-white" />}
          </div>

          {/* Task Card - Airbnb Design Principles: 14px rounded md, hairline border, crisp typography */}
          <div className={cn(
            "p-5 rounded-[14px] border transition-all duration-200",
            task.status === 'IN_PROGRESS' ? "bg-[#fff5f7] border-[#ffb3c1] shadow-sm" : 
            task.status === 'REQUIRES_APPROVAL' ? "bg-[#fff9f0] border-[#ffe2b3] shadow-md ring-1 ring-[#ffd188]" : 
            "bg-white border-[#dddddd] hover:border-[#c1c1c1] shadow-[0_2px_6px_rgba(0,0,0,0.04)]"
          )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6a6a6a]">{task.tool}</span>
                  {task.risk_level === 'HIGH' && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff0f0] text-[#c13515] border border-[#ffc4c4]">
                      High Risk
                    </span>
                  )}
                </div>
                <h3 className={cn(
                  "text-[15px] font-semibold leading-snug transition-colors",
                  task.status === 'PENDING' ? "text-[#929292]" : "text-[#222222]"
                )}>
                  {task.title}
                </h3>
                {task.result && (
                  <p className="text-[13px] text-[#6a6a6a] mt-1 font-normal italic">"{task.result}"</p>
                )}
              </div>

              {task.status === 'REQUIRES_APPROVAL' && (
                <button 
                  onClick={() => onApprove(task.step_id)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#ff385c] hover:bg-[#e00b41] text-white rounded-full text-[14px] font-semibold transition-all shadow-sm active:scale-95 shrink-0"
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
