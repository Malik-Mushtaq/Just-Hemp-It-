import { ShieldCheck, FlaskConical, Truck } from "lucide-react";

const badges = [
  {
    icon: ShieldCheck,
    label: "Secure Payment",
    desc: "256-bit SSL encryption",
  },
  { icon: FlaskConical, label: "Lab Tested", desc: "Third-party verified" },
  { icon: Truck, label: "Fast Shipping", desc: "Free on orders £50+" },
];

const TrustBadges = () => (
  <section className="py-8 border-b">
    <div className="container flex flex-wrap justify-center gap-8 md:gap-16">
      {badges.map(({ icon: Icon, label, desc }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default TrustBadges;
