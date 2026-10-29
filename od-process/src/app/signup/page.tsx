"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Shield, GraduationCap, Mail, Lock, ArrowRight, Loader2, CheckCircle, XCircle, Camera, ScanLine, RotateCcw, Barcode } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<'student' | 'faculty'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Barcode Scanning State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isIDVerified, setIsIDVerified] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    idNumber: ''
  });

  const startScanner = async () => {
    if (!formData.idNumber) {
      setError("Please enter your Register Number first.");
      return;
    }

    setIsScannerOpen(true);
    setScannedResult(null);
    setIsIDVerified(false);
  };

  const stopScanner = async () => {
    setIsScannerOpen(false);
  };

  const handleScanSuccess = (decodedText: string) => {
    setScannedResult(decodedText);
    const normalizedScanned = decodedText.trim().toUpperCase();
    const normalizedInput = formData.idNumber.trim().toUpperCase();

    if (normalizedScanned.includes(normalizedInput) || normalizedInput.includes(normalizedScanned)) {
      setIsIDVerified(true);
      setError(null);
      stopScanner();
    } else {
      setError(`ID Mismatch! Card shows "${decodedText}", but you entered "${formData.idNumber}".`);
      stopScanner();
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isIDVerified) {
      setError("Please scan your ID card barcode to verify your identity.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const table = role === 'student' ? 'students' : 'faculty';
      const { data: masterEntry, error: masterError } = await supabase
        .from(table)
        .select('id, name')
        .eq(role === 'student' ? 'register_no' : 'employee_id', formData.idNumber)
        .single();

      if (masterError || !masterEntry) {
        throw new Error(`The ${role === 'student' ? 'Register Number' : 'Faculty Email'} was not found in the institution's official record.`);
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: role,
          internalId: masterEntry.id
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Registration failed');

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-xl w-full bg-[#0a0a0a] border border-white/5 p-10 rounded-3xl relative z-10 shadow-2xl">

        {success ? (
          <div className="text-center py-10 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Account Verified!</h1>
            <p className="text-zinc-400 mb-8">Barcode verified. Identity confirmed. Redirecting to login...</p>
            <Loader2 className="animate-spin text-emerald-500 mx-auto" size={32} />
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-3">Join Smart OD</h1>
              <p className="text-zinc-500">Secure institutional account creation.</p>
            </div>

            <div className="flex p-1 bg-white/5 rounded-2xl mb-8 gap-1">
              <button
                onClick={() => { setRole('student'); setIsIDVerified(false); }}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${role === 'student' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-400 hover:text-white'}`}
              >
                <GraduationCap size={18} /> Student
              </button>
              <button
                onClick={() => { setRole('faculty'); setIsIDVerified(false); }}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${role === 'faculty' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-zinc-400 hover:text-white'}`}
              >
                <Shield size={18} /> Faculty
              </button>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input
                    type="text" required placeholder="Full Name" value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
                    {role === 'student' ? 'Register Number' : 'Official Email'}
                  </label>
                  <input
                    type="text" required placeholder={role === 'student' ? 'e.g. 22CS101' : 'faculty@univ.edu'}
                    value={formData.idNumber}
                    onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* BARCODE SCAN SECTION FOR ALL ROLES */}
              <div className="p-1 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 border border-white/5 overflow-hidden">
                {!isScannerOpen && !isIDVerified && (
                  <button
                    type="button" onClick={startScanner}
                    className="w-full py-8 flex flex-col items-center gap-3 text-blue-400 hover:bg-white/5 transition-all"
                  >
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                      <Barcode size={24} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">Scan ID Barcode to Verify</span>
                  </button>
                )}

                {isScannerOpen && (
                  <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                    <div className="absolute inset-0">
                      <Scanner
                        onScan={(result) => handleScanSuccess(result[0].rawValue)}
                        onError={(error) => console.log(error)}
                        formats={['qr_code', 'code_128', 'code_39', 'ean_13']}
                      />
                    </div>
                    <div className="absolute inset-0 border-2 border-blue-500/30 rounded-2xl m-4 pointer-events-none z-10">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-32 border-2 border-blue-500 rounded-lg animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
                      </div>
                    </div>
                    <button
                      type="button" onClick={stopScanner}
                      className="absolute bottom-4 left-1/2 -translate-x-[calc(50%+60px)] px-6 py-2 bg-black/50 hover:bg-black/80 text-white rounded-full font-bold text-xs z-20 backdrop-blur-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="button" 
                      onClick={() => {
                        setIsIDVerified(true);
                        setError(null);
                        stopScanner();
                      }}
                      className="absolute bottom-4 left-1/2 translate-x-[calc(-50%+60px)] px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-xs z-20 shadow-lg"
                    >
                      Bypass Scan (Demo)
                    </button>
                  </div>
                )}

                {isIDVerified && (
                  <div className="py-6 flex flex-col items-center justify-center animate-in zoom-in">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle size={32} />
                    </div>
                    <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm">ID Verified via Barcode</p>
                    <p className="text-xs text-white/50 mt-1">Ready to create account</p>
                    <button type="button" onClick={() => setIsIDVerified(false)} className="mt-3 text-[10px] text-white/30 hover:text-white underline">Rescan?</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Account Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type="email" required placeholder="you@univ.edu" value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type="password" required placeholder="••••••••" value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
                  <XCircle size={18} /> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !isIDVerified}
                className={`w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isLoading || !isIDVerified ? 'bg-zinc-800 text-zinc-500' :
                    role === 'student' ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_10px_20px_rgba(37,99,235,0.2)]' :
                      'bg-emerald-600 hover:bg-emerald-500 shadow-[0_10px_20px_rgba(16,185,129,0.2)]'
                  }`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Create Secure Account <ArrowRight size={20} /></>}
              </button>

              <div className="text-center pt-4">
                <p className="text-zinc-500 text-sm">
                  Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Log in here</Link>
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
