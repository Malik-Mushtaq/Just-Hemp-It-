import { Leaf, Shield, FlaskConical, Heart, Truck, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

const values = [
  { icon: Leaf, title: "100% Natural", desc: "Organically grown hemp, free from pesticides and harmful chemicals." },
  { icon: Shield, title: "Quality First", desc: "Every product meets our strict quality standards before reaching you." },
  { icon: Heart, title: "Wellness Focused", desc: "We're dedicated to helping you live a balanced, healthier life." },
];

const About = () => (
  <PageTransition>
  <div className="min-h-screen bg-background">
    <AnnouncementBar />
    <Navbar />
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-20 md:py-28">
        <div className="container text-center max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">From Seed to Soul</h1>
          <p className="text-muted-foreground leading-relaxed">We believe in the power of nature. Just Hemp It was born from a passion for pure, potent, and responsibly sourced hemp products that elevate everyday wellness.</p>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-16">
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <div className="aspect-[4/3] bg-gradient-to-br from-primary/15 to-accent/15 rounded-2xl flex items-center justify-center">
            <span className="text-8xl">🌱</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed">Founded in Portland, Oregon, Just Hemp It started with a simple mission: make premium hemp products accessible to everyone. We work directly with local farmers who share our commitment to organic, sustainable cultivation.</p>
            <p className="text-muted-foreground leading-relaxed">From seed selection to final packaging, we oversee every step to ensure you receive only the finest hemp-derived products. Our team of experts carefully crafts each product with your wellness in mind.</p>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 bg-beige">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-2">Our Mission & Values</h2>
          <p className="text-muted-foreground mb-10 max-w-lg mx-auto">Guided by integrity, transparency, and a deep respect for nature.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lab Tested */}
      <section className="py-16">
        <div className="container">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 max-w-3xl mx-auto">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FlaskConical className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">Lab Tested & Certified</h3>
              <p className="text-muted-foreground text-sm mb-4">Every product is independently tested for potency, purity, and safety. We publish full COA reports so you always know what's inside.</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {[
                  { icon: Award, label: "GMP Certified" },
                  { icon: FlaskConical, label: "Third-Party Tested" },
                  { icon: Truck, label: "Fast & Secure" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-primary" /> {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-beige text-center">
        <div className="container max-w-lg">
          <h2 className="text-2xl font-bold mb-3">Ready to Elevate Your Wellness?</h2>
          <p className="text-muted-foreground mb-6">Explore our curated collection of premium hemp products.</p>
          <Button asChild className="rounded-full px-8 h-12">
            <Link to="/products">Shop Now</Link>
          </Button>
        </div>
      </section>
    </main>
    <Footer />
  </div>
  </PageTransition>
);

export default About;
