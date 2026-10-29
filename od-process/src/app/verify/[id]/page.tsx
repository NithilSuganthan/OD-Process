"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, ShieldAlert, XCircle, Loader2, Calendar } from 'lucide-react';

export default function VerifyOD({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyRequest() {
      try {
        const { data, error } = await supabase
          .from('od_requests')
          .select('*, student:students(name, register_no, department)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setRequest(data);
      } catch (err: any) {
        setError('Invalid or non-existent OD Pass.');
      } finally {
        setLoading(false);
      }
    }

    verifyRequest();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] p-6 text-center">
        <XCircle className="text-red-500 w-24 h-24 mb-6" />
        <h1 className="text-3xl font-bold text-white mb-2">Verification Failed</h1>
        <p className="text-muted">{error || 'Could not verify this pass.'}</p>
      </div>
    );
  }

  const isApproved = request.status === 'HODApproved';

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-6 bg-[#09090b]">
      <div className="max-w-md w-full glass-panel overflow-hidden">
        {/* Header */}
        <div className={`p-8 text-center ${isApproved ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          {isApproved ? (
             <ShieldCheck className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
          ) : (
             <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-4" />
          )}
          <h1 className={`text-2xl font-bold ${isApproved ? 'text-emerald-400' : 'text-red-400'}`}>
            {isApproved ? 'Valid OD Pass' : 'Invalid Status'}
          </h1>
          <p className="text-white/70 mt-2 text-sm">
            {isApproved ? 'This student is authorized to leave the campus.' : `This request is currently marked as ${request.status}.`}
          </p>
        </div>

        {/* Details */}
        <div className="p-8 space-y-6">
          <div>
             <label className="text-xs text-muted uppercase tracking-wider">Student Name</label>
             <p className="text-lg font-bold text-white">{Array.isArray(request.student) ? request.student[0]?.name : request.student?.name}</p>
             <p className="text-sm text-white/60">{Array.isArray(request.student) ? request.student[0]?.register_no : request.student?.register_no} • {Array.isArray(request.student) ? request.student[0]?.department : request.student?.department}</p>
          </div>

          <div>
             <label className="text-xs text-muted uppercase tracking-wider">Event Details</label>
             <p className="text-md font-bold text-white">{request.event_title}</p>
             <p className="text-sm text-white/60">{request.event_type}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
             <Calendar className="text-blue-400 w-8 h-8" />
             <div>
                <p className="text-xs text-muted uppercase tracking-wider">Authorized Dates</p>
                <p className="text-sm font-bold text-white">{request.event_date_from} to {request.event_date_to}</p>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 text-center text-xs text-muted">
           Verified dynamically via SmartOD System.<br />
           Pass ID: {request.id.split('-')[0]}
        </div>
      </div>
    </div>
  );
}
