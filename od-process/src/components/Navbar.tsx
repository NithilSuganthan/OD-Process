"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Menu, X, ChevronDown, User as UserIcon, LogOut } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Student Portal", path: "/student" },
    { name: "Faculty Portal", path: "/faculty" },
    { name: "HOD Dashboard", path: "/hod" },
  ];

  // Smart Auth Mock based on route
  const getActiveUser = () => {
    if (pathname.startsWith('/student')) {
      return { name: "Priya Sharma", role: "Student (22CS101)", avatar: "https://ui-avatars.com/api/?name=Priya+Sharma&background=random" };
    }
    if (pathname.startsWith('/faculty')) {
      return { name: "Alan Turing", role: "Class Advisor", avatar: "https://ui-avatars.com/api/?name=Alan+Turing&background=random" };
    }
    if (pathname.startsWith('/hod')) {
      return { name: "Dr. Ada Lovelace", role: "HOD - CSE", avatar: "https://ui-avatars.com/api/?name=Dr+Ada+Lovelace&background=random" };
    }
    return null; // Not logged in
  };

  const activeUser = getActiveUser();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-black/60 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/50"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center shadow-glow group-hover:shadow-[0_0_25px_rgba(139,92,246,0.8)] transition-all duration-300">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 tracking-tight">
            Smart<span className="text-accent-secondary">OD</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Auth / Action button */}
        <div className="hidden md:flex items-center">
          {activeUser ? (
             <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full cursor-pointer hover:bg-white/10 transition-all group">
                <img src={activeUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                <div className="flex flex-col">
                   <span className="text-xs font-bold text-white leading-tight">{activeUser.name}</span>
                   <span className="text-[10px] text-muted leading-tight">{activeUser.role}</span>
                </div>
                <ChevronDown size={14} className="text-muted group-hover:text-white ml-1" />
             </div>
          ) : (
             <Link href="/login" className="btn btn-primary !px-6 !py-2.5 !text-sm">
               Demo Login
             </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white/80 hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#09090b]/95 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
          {activeUser && (
             <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                <img src={activeUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full" />
                <div className="flex flex-col">
                   <span className="text-sm font-bold text-white leading-tight">{activeUser.name}</span>
                   <span className="text-xs text-accent-primary leading-tight">{activeUser.role}</span>
                </div>
             </div>
          )}
          
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-base font-medium transition-all ${
                  isActive
                    ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/30"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          
          {!activeUser && (
            <Link href="/login" className="btn btn-primary w-full mt-4 !py-3 flex justify-center">
              Demo Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
