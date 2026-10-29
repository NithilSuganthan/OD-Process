"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Lock, Mail, ArrowRight, Loader2, ScanLine, XCircle, Camera, CheckCircle } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { getSupabaseForRole } from '@/lib/supabase';

const studentClient = getSupabaseForRole('student');

export default function StudentLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [regNo, setRegNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = () => {
    setScanError(null);
    setScanMode(true);
    
    // Allow DOM to render the #reader div first
    setTimeout(async () => {
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("reader", {
             verbose: false
          });
        }
        
        await scannerRef.current.start(
          { facingMode: "environment" },
          { 
            fps: 25, 
            aspectRatio: 1.777778
          },
          async (decodedText) => {
            // On Success - Start the "Stabilize" phase
            if (isCapturing) return; // Prevent multiple triggers
            
            setIsCapturing(true);
            setRegNo(decodedText);
            
            // Progress animation simulation
            let progress = 0;
            const interval = setInterval(() => {
              progress += 5;
              setScanProgress(progress);
              if (progress >= 100) clearInterval(interval);
            }, 50);

            // Wait for "stabilization"
            setTimeout(() => {
              // Capture the frame from the video element
              const video = document.querySelector('#reader video') as HTMLVideoElement;
              if (video) {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(video, 0, 0);
                  setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
                }
              }
              
              // Shutter effect and then stop
              setTimeout(() => {
                stopScanner();
                setIsCapturing(false);
              }, 500);
            }, 1200);
          },
          () => {} // Ignore scan failures
        );
      } catch (err) {
        console.error("Camera access error:", err);
        setScanError("Could not access camera. Check permissions.");
      }
    }, 200);
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear();
        setScanMode(false);
      }).catch((err) => {
        console.error("Failed to stop scanner", err);
        setScanMode(false);
      });
    } else {
      setScanMode(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setScanError(null);
      setIsLoading(true);
      
      try {
        // Create a temporary instance just for file scanning
        const html5QrCode = new Html5Qrcode("reader-hidden", { verbose: false });
        // true = show image on reader element
        const decodedText = await html5QrCode.scanFile(file, true);
        setRegNo(decodedText);
        setScanMode(false);
      } catch (err) {
        console.error("File scan error", err);
        setScanError("Could not detect barcode in the image. Please ensure the barcode is clear and in focus.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setScanError(null);

    try {
      // Authenticate with the email and password the user signed up with
      const { data, error: authError } = await studentClient.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        throw new Error("Invalid email or password. Please check your credentials or register first.");
      }

      // AuthContext will automatically pick up the session via onAuthStateChange
      router.push('/student');
    } catch (err: any) {
      setScanError(err.message || "Authentication failed. Please check your credentials or register.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Hidden div required for html5-qrcode scanFile processing */}
      <div id="reader-hidden" style={{ display: 'none' }}></div>

      <div className="max-w-md w-full bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
            {scanMode ? (
               <ScanLine size={32} className="animate-pulse" />
            ) : (
               <GraduationCap size={32} />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Student Login</h1>
          <p className="text-muted">Welcome back! Please enter your credentials.</p>
        </div>

        {scanMode ? (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-white/10 flex flex-col items-center justify-center mb-6 min-h-[250px] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              {scanError ? (
                <div className="text-center p-6 text-red-400">
                  <XCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{scanError}</p>
                </div>
              ) : capturedImage ? (
                <div className="relative w-full h-full animate-in fade-in zoom-in duration-500">
                  <img src={capturedImage} alt="Captured ID" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                    <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                      <CheckCircle size={14} /> Captured & Verified
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div id="reader" className="w-full"></div>
                  
                  {/* Modern Corner Brackets */}
                  <div className="absolute inset-4 border-2 border-transparent pointer-events-none">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br-lg"></div>
                  </div>

                  {/* Animated Scanning Line */}
                  {!isCapturing && (
                    <div className="absolute inset-x-0 h-0.5 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[scan_2s_ease-in-out_infinite] z-10 pointer-events-none"></div>
                  )}
                  
                  <div className={`absolute inset-0 border-4 ${isCapturing ? 'border-emerald-500/50' : 'border-blue-500/10'} rounded-2xl pointer-events-none transition-colors duration-300`}></div>
                  
                  {isCapturing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px] flex flex-col items-center justify-center p-6 text-center z-20">
                      <div className="relative w-24 h-24 mb-4">
                        <svg className="w-full h-full rotate-[-90deg]">
                          <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
                          <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="276" strokeDashoffset={276 - (276 * scanProgress) / 100} className="text-emerald-500 transition-all duration-100" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Camera className="text-white animate-pulse" size={32} />
                        </div>
                      </div>
                      <h2 className="text-white font-black text-2xl mb-1 tracking-tighter">HOLD STILL</h2>
                      <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest">Stabilizing...</p>
                    </div>
                  )}

                  {/* Shutter Flash Effect */}
                  {isCapturing && scanProgress >= 100 && (
                    <div className="absolute inset-0 bg-white animate-out fade-out duration-300 pointer-events-none z-50"></div>
                  )}
                </>
              )}
            </div>
            
            {!capturedImage && (
              <div className="flex flex-col items-center gap-2 mb-6">
                 <p className="text-center text-sm text-zinc-400 font-medium">
                    {isCapturing ? "Processing secure ID snapshot..." : "Align barcode within the brackets"}
                 </p>
                 {!isCapturing && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                       <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                       <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Searching for ID</span>
                    </div>
                 )}
              </div>
            )}

            <button 
              type="button" 
              onClick={stopScanner}
              className="w-full py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all border border-white/10"
            >
              {capturedImage ? "Back to Login" : "Cancel Live Scan"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in duration-300">
            <div>
              <div className="flex flex-col gap-2 mb-3">
                <label className="block text-sm font-medium text-white/80">Register Number</label>
                
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={startScanner}
                    className="flex-1 text-xs flex justify-center items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-2 rounded-lg"
                  >
                    <ScanLine size={14} /> Live Scan
                  </button>
                  
                  <label className="flex-1 text-xs flex justify-center items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-2 rounded-lg cursor-pointer">
                    <Camera size={14} /> Take Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {scanError && (
                 <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400">{scanError}</p>
                 </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input 
                  type="text" 
                  required 
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="e.g. RA2411008020146"
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-white/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your signup email"
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-white/20"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
               <label className="flex items-center gap-2 text-muted cursor-pointer">
                  <input type="checkbox" className="rounded bg-black/50 border-white/10 text-blue-500 focus:ring-blue-500" />
                  Remember me
               </label>
               <a href="#" className="text-blue-400 hover:text-blue-300">Forgot Password?</a>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setRegNo('RA2411008020146');
                  setEmail('demo.student@smartod.dev');
                  setPassword('demo1234');
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-blue-400 border border-blue-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <span>⚡ Auto-fill Demo Credentials</span>
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Secure Login <ArrowRight size={18} /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
