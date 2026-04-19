import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

const slides = [
  { image: hero1, title: "Pure. Natural. Powerful.", subtitle: "Discover our premium hemp collection, ethically sourced and lab tested.", cta: "Shop Now" },
  { image: hero2, title: "Elevate Your Wellness", subtitle: "Premium CBD oils crafted for your daily wellness routine.", cta: "Explore CBD" },
  { image: hero3, title: "From Seed to Soul", subtitle: "100% organic hemp products you can trust.", cta: "View Collection" },
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full h-[70vh] min-h-[400px] max-h-[700px] overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
          <div className="absolute inset-0 bg-gradient-to-r from-green-dark/80 via-green-dark/50 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container">
              <div className="max-w-lg space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">{slide.title}</h1>
                <p className="text-lg text-primary-foreground/80">{slide.subtitle}</p>
                <Button size="lg" className="rounded-full text-base px-8">{slide.cta}</Button>
              </div>
            </div>
          </div>
        </div>
      ))}
      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-primary-foreground" : "w-2.5 bg-primary-foreground/40"}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
