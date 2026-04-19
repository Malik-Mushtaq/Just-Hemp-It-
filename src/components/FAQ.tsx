import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is CBD and how does it work?",
    a: "CBD (cannabidiol) is a natural compound found in hemp plants. It interacts with your body's endocannabinoid system to help maintain balance and overall wellness, without any psychoactive effects.",
  },
  {
    q: "Are your products lab tested?",
    a: "Absolutely. Every product undergoes rigorous third-party lab testing. We publish certificates of analysis (COAs) so you can verify purity, potency, and safety.",
  },
  {
    q: "Will CBD make me feel high?",
    a: "No. Our products contain less than 0.3% THC, which is the legal limit and far too low to produce any psychoactive effects.",
  },
  {
    q: "How should I store my CBD products?",
    a: "Store in a cool, dry place away from direct sunlight. Most products have a shelf life of 12–18 months when stored properly.",
  },
  {
    q: "Do you offer free shipping?",
    a: "Yes! We offer free standard shipping on all orders over £50 within the United Kingdom.",
  },
  {
    q: "What is your return policy?",
    a: "We offer a 30-day satisfaction guarantee. If you're not happy with your purchase, contact us for a full refund or exchange.",
  },
];

const FAQ = () => (
  <section className="py-16">
    <div className="container max-w-2xl">
      <h2 className="text-3xl font-bold text-center mb-2">
        Frequently Asked Questions
      </h2>
      <p className="text-muted-foreground text-center mb-10">
        Everything you need to know about our products
      </p>
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQ;
