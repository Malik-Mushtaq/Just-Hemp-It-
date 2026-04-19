import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

const Contact = () => (
  <PageTransition>
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />
      <main className="py-16">
        <div className="container max-w-5xl">
          <h1 className="text-3xl font-bold text-center mb-2">Contact Us</h1>
          <p className="text-center text-muted-foreground mb-12">
            We'd love to hear from you. Reach out anytime.
          </p>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Form */}
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <Input placeholder="Your Name" className="rounded-xl h-11" />
                <Input
                  placeholder="Email Address"
                  type="email"
                  className="rounded-xl h-11"
                />
                <Input placeholder="Subject" className="rounded-xl h-11" />
                <Textarea
                  placeholder="Your Message"
                  className="rounded-xl min-h-[120px]"
                />
                <Button className="w-full rounded-xl h-11">Send Message</Button>
              </form>
            </div>

            {/* Info */}
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold mb-4">Get In Touch</h3>
                <div className="space-y-4">
                  {[
                    { icon: Mail, label: "sales@justhempit.co.uk" },
                    { icon: Phone, label: "+44 7521 274859" },
                    {
                      icon: MapPin,
                      label:
                        "Horizon House, 2 Whiting St, Heeley, Sheffield S8 9QR, UK",
                    },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div className="aspect-video rounded-2xl overflow-hidden border">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2381.166428525771!2d-1.474667516603374!3d53.35817634667062!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4879825f8ba13eeb%3A0x1fec6bece0065ffb!2sHorizon%20House%2C%202%20Whiting%20St%2C%20Heeley%2C%20Sheffield%20S8%209QR%2C%20UK!5e0!3m2!1sen!2s!4v1775362245630!5m2!1sen!2s"
                  className="h-full w-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Just Hemp It location map"
                />
              </div>

              {/* Social */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Follow Us</h4>
                <div className="flex gap-3">
                  {[Facebook, Instagram, Twitter].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  </PageTransition>
);

export default Contact;
