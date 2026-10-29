"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, ShieldCheck, Zap, BarChart3, ChevronRight, 
  ArrowRight, Globe, MessageCircle, Briefcase, Mail,
  GraduationCap, BookOpen, Shield, Server, Bot
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">
      {/* Header / Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)]">
              <Bot size={24} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                SmartOD
              </span>
              <span className="text-[10px] text-indigo-400 font-bold tracking-[0.2em] uppercase">
                AI powered
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#portals" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Portals</a>
            <a href="#about" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">About</a>
          </div>

          <Link 
            href="/login"
            className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-all flex items-center gap-2 group"
          >
            Get Started <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                <Sparkles size={14} /> Next Gen OD Management
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
                Streamline Your <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">
                  Academic Freedom
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-zinc-400 max-w-xl leading-relaxed">
                The most advanced AI-powered On-Duty management system for SRMIST. 
                Formalize requests, detect fraud, and track approvals in real-time with unprecedented precision.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/login"
                  className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-[0_0_30px_rgba(79,70,229,0.4)] flex items-center gap-2 group"
                >
                  Enter Portal <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="#features"
                  className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all flex items-center gap-2"
                >
                  See Features
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#050505] bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-zinc-500 font-medium">
                  Trusted by <span className="text-white font-bold">10,000+</span> students & faculty
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="/hero-ai.png" 
                  alt="SmartOD Dashboard" 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for the Future of Education</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">
              Our platform leverages cutting-edge AI to automate and secure the entire OD request lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="text-indigo-400" size={32} />,
                title: "AI Formalization",
                desc: "Convert casual explanations into professional, formal OD requests with our advanced language models."
              },
              {
                icon: <ShieldCheck className="text-emerald-400" size={32} />,
                title: "Fraud Detection",
                desc: "Real-time AI analysis of request patterns and evidence to ensure system integrity and reduce abuse."
              },
              {
                icon: <BarChart3 className="text-violet-400" size={32} />,
                title: "Real-time Analytics",
                desc: "Comprehensive dashboards for HODs and Faculty to track attendance trends and department stats."
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all hover:-translate-y-2 group">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="py-24 bg-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/5 blur-[120px]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Choose Your Portal</h2>
              <p className="text-zinc-400">
                Access your personalized workspace designed specifically for your role in the SRMIST ecosystem.
              </p>
            </div>
            <Link href="/login" className="text-indigo-400 font-bold flex items-center gap-2 hover:text-indigo-300 transition-colors">
              View All Portals <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: "Students", role: "Student", icon: <GraduationCap />, color: "from-blue-500 to-indigo-500", path: "/login/student" },
              { title: "Faculty", role: "Faculty", icon: <BookOpen />, color: "from-emerald-500 to-teal-500", path: "/login/faculty" },
              { title: "Head of Dept", role: "HOD", icon: <Shield />, color: "from-purple-500 to-violet-500", path: "/login/hod" },
              { title: "Admin", role: "Admin", icon: <Server />, color: "from-red-500 to-orange-500", path: "/login/admin" }
            ].map((portal, i) => (
              <Link 
                href={portal.path} 
                key={i}
                className="group relative p-8 rounded-3xl bg-[#0a0a0a] border border-white/5 overflow-hidden transition-all hover:-translate-y-2"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${portal.color} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity`}></div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${portal.color} flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform shadow-lg`}>
                  {React.cloneElement(portal.icon as React.ReactElement<any>, { size: 28 })}
                </div>
                <h3 className="text-xl font-bold mb-1">{portal.title}</h3>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">{portal.role} Access</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: "Requests Processed", value: "250K+" },
              { label: "AI Accuracy", value: "99.2%" },
              { label: "Active Users", value: "15K+" },
              { label: "Uptime", value: "99.9%" }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-500 font-bold uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Bot size={24} className="text-white" />
                </div>
                <span className="text-2xl font-bold">SmartOD</span>
              </div>
              <p className="text-zinc-500 max-w-sm mb-8 leading-relaxed">
                Revolutionizing academic administration at SRMIST through intelligent automation and secure digital workflows.
              </p>
              <div className="flex gap-4">
                {[MessageCircle, Globe, Briefcase, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-all">
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI Analysis</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">University</h4>
              <ul className="space-y-4 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-white transition-colors">SRMIST Home</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Academic Calendar</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Student Portal</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-zinc-600 font-medium">
              © 2026 SRMIST Ramapuram. Built with excellence for the next generation of engineers.
            </p>
            <div className="flex gap-8 text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
              <a href="#" className="hover:text-zinc-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-zinc-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-zinc-400 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
