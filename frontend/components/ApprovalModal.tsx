import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Edit3, ShieldAlert, Code2 } from 'lucide-react';

export interface ActionPayload {
    [key: string]: string | number | boolean | object | null;
}

export interface ApprovalModalProps {
    isOpen: boolean;
    stepId: string;
    actionTitle: string;
    toolName: string;
    payload: ActionPayload;
    riskLevel?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    onApprove: (stepId: string, updatedPayload: ActionPayload) => Promise<void>;
    onReject: (stepId: string, reason: string) => Promise<void>;
    onClose?: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
    isOpen,
    stepId,
    actionTitle,
    toolName,
    payload,
    riskLevel = 'HIGH',
    onApprove,
    onReject,
    onClose,
}) => {
    const [editedPayload, setEditedPayload] = useState<string>(
        JSON.stringify(payload, null, 2)
    );
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [riskConfirmed, setRiskConfirmed] = useState<boolean>(false);
    const [rejectionReason, setRejectionReason] = useState<string>('');
    const [showRejectInput, setShowRejectInput] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleApprove = async () => {
        if (!riskConfirmed) {
            setError('Please acknowledge and confirm the risk before executing.');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            let parsedPayload: ActionPayload;
            try {
                parsedPayload = JSON.parse(editedPayload);
            } catch (e) {
                setError('Invalid JSON format in payload editor.');
                setIsSubmitting(false);
                return;
            }

            const response = await fetch('http://localhost:8000/api/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step_id: stepId,
                    action: 'APPROVE',
                    payload: parsedPayload,
                    confirmed_at: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Execution failed with status: ${response.status}`);
            }

            await onApprove(stepId, parsedPayload);
        } catch (err: any) {
            setError(err.message || 'Failed to submit approval trigger to backend.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!showRejectInput) {
            setShowRejectInput(true);
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const response = await fetch('http://localhost:8000/api/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    step_id: stepId,
                    action: 'REJECT',
                    reason: rejectionReason || 'User rejected action execution',
                    rejected_at: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Rejection trigger failed with status: ${response.status}`);
            }

            await onReject(stepId, rejectionReason);
        } catch (err: any) {
            setError(err.message || 'Failed to send rejection signal to backend.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-amber-200 tracking-wide">
                                Human Approval Required for High-Impact Action
                            </h3>
                            <p className="text-xs text-amber-400/80 font-mono">
                                Breakpoint Intercept • Execution Paused
                            </p>
                        </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
                        {riskLevel} RISK
                    </span>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-mono uppercase text-slate-400">Target Action</span>
                                <h4 className="text-base font-medium text-slate-100">{actionTitle}</h4>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-mono uppercase text-slate-400">Tool Executable</span>
                                <p className="text-sm font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50 inline-block mt-0.5">
                                    {toolName}()
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Code2 className="w-4 h-4 text-slate-400" />
                                Proposed Execution Payload
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                {isEditing ? 'View Formatted Diff' : 'Edit Payload Parameters'}
                            </button>
                        </div>

                        {isEditing ? (
                            <textarea
                                value={editedPayload}
                                onChange={(e) => setEditedPayload(e.target.value)}
                                className="w-full h-44 bg-slate-950 border border-indigo-500/50 rounded-lg p-3 font-mono text-xs text-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        ) : (
                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-2 max-h-48 overflow-y-auto">
                                {Object.entries(payload).map(([key, value]) => (
                                    <div key={key} className="flex justify-between border-b border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
                                        <span className="text-slate-400 font-medium">{key}:</span>
                                        <span className="text-slate-200 text-right max-w-xs truncate">
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {showRejectInput && (
                        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                            <label className="text-xs text-red-400 font-medium">Reason for Rejection / Modification Request:</label>
                            <input
                                type="text"
                                placeholder="e.g., Target address incorrect, cancel workflow execution..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full bg-slate-950 border border-red-500/40 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                    )}

                    <div className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <input
                            type="checkbox"
                            id="confirm-risk"
                            checked={riskConfirmed}
                            onChange={(e) => {
                                setRiskConfirmed(e.target.checked);
                                if (error) setError(null);
                            }}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                        />
                        <label htmlFor="confirm-risk" className="text-xs text-slate-300 cursor-pointer select-none">
                            I have verified the payload parameters and explicitly authorize the backend to perform this high-impact action.
                        </label>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs text-slate-400 hover:text-slate-200 font-medium"
                    >
                        Cancel & Inspect Timeline
                    </button>

                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={handleReject}
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-red-500/50 hover:bg-red-500/10 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                            <XCircle className="w-4 h-4" />
                            {showRejectInput ? 'Confirm Rejection' : 'Reject Action'}
                        </button>

                        <button
                            type="button"
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {isSubmitting ? 'Resuming Execution...' : 'Approve & Execute'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};