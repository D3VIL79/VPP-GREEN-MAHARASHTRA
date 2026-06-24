"use client";

import { motion } from "framer-motion";
import { ArrowRight, Leaf, Shield, Users, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/company_logo.png" alt="Company Logo" className="h-8 w-8 object-contain" />
            <span className="font-heading font-bold text-xl tracking-tight text-primary">VPP Green Maharashtra</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <a href="#impact" className="hover:text-foreground transition-colors">Impact</a>
            <a href="#campaigns" className="hover:text-foreground transition-colors">Campaigns</a>
            <a href="#csr" className="hover:text-foreground transition-colors">CSR</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden md:inline-flex">Log in</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Abstract Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50 -z-10" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] opacity-30 -z-10" />

        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Maharashtra&apos;s Largest Plantation Drive
            </div>
          </motion.div>

          <motion.h1 
            className="text-4xl md:text-6xl font-heading font-extrabold tracking-tight mb-8 leading-[1.2]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              One Student One Tree <span className="text-muted-foreground/50 mx-2 font-light">|</span> One Staff One Tree
            </span>
          </motion.h1>

          <motion.p 
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Join the statewide movement. Manage campaigns, monitor survival with AI, and track your environmental impact on a unified, modern platform.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/register">
              <Button size="lg" className="rounded-full px-8 h-12 w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-base">
                Register Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 w-full sm:w-auto text-base bg-background/50 backdrop-blur-sm">
                View State Dashboard
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section id="impact" className="py-20 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Trees Planted", value: "2.4M+", icon: <Leaf className="h-5 w-5 text-primary" /> },
              { label: "Survival Rate", value: "89%", icon: <Shield className="h-5 w-5 text-success" /> },
              { label: "Active Students", value: "850K+", icon: <Users className="h-5 w-5 text-accent" /> },
              { label: "Districts Covered", value: "36", icon: <MapPin className="h-5 w-5 text-secondary" /> },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-center justify-center p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-3 bg-muted rounded-full mb-4">
                  {stat.icon}
                </div>
                <h3 className="text-3xl font-heading font-bold text-foreground mb-1">{stat.value}</h3>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="about" className="py-32 px-6 relative">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">From planting a sapling to tracking its growth, the platform makes environmental impact transparent and rewarding.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-border -translate-y-1/2 -z-10" />

            {[
              { step: "01", title: "Register", desc: "Sign up via your institution." },
              { step: "02", title: "Plant", desc: "Geo-tag your new tree." },
              { step: "03", title: "Monitor", desc: "Upload periodic photos." },
              { step: "04", title: "Earn", desc: "Get certificates & carbon points." },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-card border border-border p-8 rounded-3xl relative shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl font-black text-primary/10 absolute top-4 right-6">{item.step}</div>
                <h3 className="text-xl font-bold mb-2 relative z-10">{item.title}</h3>
                <p className="text-muted-foreground text-sm relative z-10">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Placeholder */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <Globe className="h-8 w-8 mx-auto mb-4 text-primary/50" />
          <p>© 2026 VPP Green Maharashtra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

