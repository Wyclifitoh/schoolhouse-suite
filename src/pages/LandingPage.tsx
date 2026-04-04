import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap, Wallet, ClipboardList, Users, BookOpen, Package,
  MessageSquare, BarChart3, Bus, Shield, Smartphone, Cloud, ChevronRight,
  Check, Star, ArrowRight, School, Menu, X,
} from "lucide-react";
import { useState } from "react";

const modules = [
  { icon: GraduationCap, title: "Admissions", desc: "Streamlined student enrollment with guardian linking, sibling detection, and document management." },
  { icon: Wallet, title: "Fee Collection", desc: "Comprehensive fee structures, M-Pesa integration, automated receipts, and balance tracking." },
  { icon: ClipboardList, title: "Examinations", desc: "Exam scheduling, marks entry, automated grading, rank reports, and report cards." },
  { icon: Users, title: "Human Resource", desc: "Staff directory, attendance, leave management, payroll, and department administration." },
  { icon: BookOpen, title: "Academics", desc: "Classes, streams, subjects, timetables, homework, and teacher-subject allocation." },
  { icon: BarChart3, title: "Reports", desc: "Finance, student, attendance, exam reports with PDF/CSV export capabilities." },
  { icon: Package, title: "Inventory & POS", desc: "Stock management, point-of-sale, categories, and transaction tracking." },
  { icon: MessageSquare, title: "Communication", desc: "SMS notifications, fee reminders, notice board, and parent-teacher messaging." },
  { icon: Bus, title: "Transport", desc: "Route management, vehicle tracking, transport fee allocation, and driver assignment." },
  { icon: Shield, title: "Role-Based Access", desc: "Granular permissions for admins, teachers, finance officers, parents, and students." },
  { icon: Smartphone, title: "M-Pesa Payments", desc: "STK Push, C2B payments, automated reconciliation, and real-time confirmations." },
  { icon: Cloud, title: "Cloud-Based", desc: "Access from anywhere, automatic backups, multi-school support, and 99.9% uptime." },
];

const benefits = [
  { role: "School Owners", items: ["Real-time financial oversight", "Multi-branch management", "Audit trail for accountability", "Revenue analytics dashboard"] },
  { role: "Bursars & Accountants", items: ["Automated fee collection", "M-Pesa reconciliation", "Expense tracking", "Financial reports on demand"] },
  { role: "Teachers", items: ["Digital marks entry", "Attendance tracking", "Homework management", "Timetable access"] },
  { role: "Parents", items: ["Fee balance visibility", "Payment receipts via SMS", "Student performance tracking", "Direct communication channel"] },
];

const faqs = [
  { q: "How long does onboarding take?", a: "Most schools are fully onboarded within 1-2 days. We help you import existing student data, fee structures, and staff records." },
  { q: "Does CHUO support M-Pesa payments?", a: "Yes. CHUO integrates with Safaricom M-Pesa via STK Push and C2B APIs for real-time fee collection and automated reconciliation." },
  { q: "Can I manage multiple schools?", a: "Absolutely. CHUO is built as a multi-tenant system, allowing you to manage multiple schools from a single admin account." },
  { q: "Is my school data secure?", a: "Yes. All data is encrypted at rest and in transit. We implement role-based access control and maintain comprehensive audit logs." },
  { q: "What reports can I generate?", a: "Finance reports, student reports, attendance reports, exam reports, HR reports, and more — all exportable as PDF or CSV." },
  { q: "Do parents and students get their own portal?", a: "Yes. Parents can view fee balances, payment history, and student performance. Students can access their grades and timetables." },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <School className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-[0.15em] text-foreground">CHUO</span>
              <p className="text-[10px] text-muted-foreground leading-none">School Management System</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#modules" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Modules</a>
            <a href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Benefits</a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/login">Login</Link></Button>
            <Button asChild><Link to="/login">Request Demo <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/60 bg-background px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#modules" className="block text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Modules</a>
            <a href="#benefits" className="block text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Benefits</a>
            <a href="#faq" className="block text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" asChild className="flex-1"><Link to="/login">Login</Link></Button>
              <Button asChild className="flex-1"><Link to="/login">Request Demo</Link></Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-0 px-4 py-1.5 text-sm font-semibold">
            🇰🇪 Built for Kenyan Schools
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto">
            The Complete School
            <span className="gradient-text"> Management Platform</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Manage admissions, fee collection, M-Pesa payments, examinations, attendance, and school operations — all from one secure, cloud-based system.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-13 px-8 text-base font-semibold shadow-lg shadow-primary/25" asChild>
              <Link to="/login">Start Free Demo <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-8 text-base font-semibold" asChild>
              <a href="#modules">Explore Modules</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required · Free 30-day trial · Full support</p>
        </div>
      </section>

      {/* Why CHUO */}
      <section id="features" className="py-20 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Why Schools Choose <span className="gradient-text">CHUO</span></h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">Purpose-built for the Kenyan education system with features that address real school management challenges.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Smartphone, title: "M-Pesa Integration", desc: "Accept fees via STK Push and Paybill with instant SMS receipts to parents." },
              { icon: Shield, title: "Multi-Tenant Security", desc: "Each school's data is completely isolated with role-based access control." },
              { icon: BarChart3, title: "Real-Time Reports", desc: "Financial, academic, and operational reports generated instantly." },
              { icon: Cloud, title: "Cloud-Based Access", desc: "Access your school data from anywhere, on any device, at any time." },
            ].map(f => (
              <Card key={f.title} className="glass-card-hover group">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/15 transition-colors">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-base font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Complete School <span className="gradient-text">Modules</span></h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">Everything you need to run your school efficiently — from enrollment to graduation.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {modules.map(m => (
              <Card key={m.title} className="glass-card-hover group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <m.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold">{m.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Built for <span className="gradient-text">Everyone</span></h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">Every stakeholder benefits from a well-managed school system.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map(b => (
              <Card key={b.role} className="glass-card-hover">
                <CardContent className="p-6">
                  <h3 className="text-base font-bold mb-4">{b.role}</h3>
                  <ul className="space-y-2.5">
                    {b.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Trusted by <span className="gradient-text">Schools</span></h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">Hear from school administrators who have transformed their operations with CHUO.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: "Principal, Nairobi Academy", quote: "CHUO has streamlined our fee collection process. M-Pesa integration alone saved us 20 hours per week in manual reconciliation." },
              { name: "Bursar, Highland School", quote: "The financial reports are comprehensive and accurate. I can generate any report for the board meeting in under a minute." },
              { name: "Head Teacher, Kisumu Primary", quote: "Managing 800+ students was chaotic before CHUO. Now our admissions, attendance, and exams run seamlessly." },
            ].map((t, i) => (
              <Card key={i} className="glass-card-hover">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">{[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-warning text-warning" />)}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{t.quote}"</p>
                  <p className="text-sm font-bold text-foreground">— {t.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-card/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Frequently Asked <span className="gradient-text">Questions</span></h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Card key={i} className="glass-card cursor-pointer" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">{faq.q}</h3>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                  </div>
                  {openFaq === i && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">Ready to Transform Your School?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">Join hundreds of schools across Kenya using CHUO to streamline operations and improve outcomes.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-13 px-8 text-base font-semibold shadow-lg shadow-primary/25" asChild>
              <Link to="/login">Get Started Today <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-8 text-base font-semibold" asChild>
              <a href="mailto:info@chuo.co.ke">Contact Sales</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <School className="h-4.5 w-4.5" />
                </div>
                <span className="text-lg font-black tracking-[0.15em]">CHUO</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Complete school management platform built for Kenyan and African schools.</p>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#modules" className="hover:text-foreground transition-colors">Modules</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:info@chuo.co.ke" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:support@chuo.co.ke" className="hover:text-foreground transition-colors">support@chuo.co.ke</a></li>
                <li><a href="tel:+254700000000" className="hover:text-foreground transition-colors">+254 700 000 000</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border/60 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} CHUO School Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
