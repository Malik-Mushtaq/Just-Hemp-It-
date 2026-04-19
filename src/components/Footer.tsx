import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="bg-green-dark text-primary-foreground">
    <div className="container py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {/* Brand */}
      <div className="space-y-4">
        <img src={logo} alt="Just Hemp It" className="h-14 w-auto rounded" />
        <p className="text-sm text-primary-foreground/70 leading-relaxed">
          Premium hemp & CBD products, ethically sourced and rigorously tested.
          Elevate your wellness naturally.
        </p>
        <div className="flex gap-3">
          {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
            <a
              key={i}
              href="#"
              className="h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h4 className="font-semibold mb-4">Quick Links</h4>
        <ul className="space-y-2 text-sm text-primary-foreground/70">
          {[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: "About Us", href: "/about" },
            { label: "Contact Us", href: "/contact" },
            { label: "FAQ", href: "/#faq" },
          ].map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="hover:text-primary-foreground transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Categories */}
      <div>
        <h4 className="font-semibold mb-4">Categories</h4>
        <ul className="space-y-2 text-sm text-primary-foreground/70">
          {[
            "Resin Premium",
            "Concentrates",
            "CBD Pen",
            "Pre-Rolled",
            "CBD Vape",
          ].map((c) => (
            <li key={c}>
              <a
                href="#categories"
                className="hover:text-primary-foreground transition-colors"
              >
                {c}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Contact */}
      <div>
        <h4 className="font-semibold mb-4">Contact Us</h4>
        <ul className="space-y-2 text-sm text-primary-foreground/70">
          <li>📧 sales@justhempit.co.uk</li>
          <li>📞 +44 7521 274859</li>
          <li>📍 Horizon House, 2 Whiting St, Heeley, Sheffield S8 9QR, UK</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-primary-foreground/10 py-4">
      <p className="text-center text-xs text-primary-foreground/50">
        © 2026 Just Hemp It. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
