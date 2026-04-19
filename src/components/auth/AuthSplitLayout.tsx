import { ReactNode } from "react";
import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";

type AuthHighlight = {
  title: string;
  description: string;
};

interface AuthSplitLayoutProps {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  formEyebrow: string;
  children: ReactNode;
  highlights?: AuthHighlight[];
}

const AuthSplitLayout = ({
  heroEyebrow,
  heroTitle,
  heroDescription,
  formEyebrow,
  children,
  highlights = [],
}: AuthSplitLayoutProps) => (
  <PageTransition>
    <div className="min-h-screen overflow-x-hidden bg-background">
      <AnnouncementBar />
      <Navbar />
      <main className="overflow-hidden px-3 py-6 sm:px-5 sm:py-8 lg:px-8 lg:py-12">
        <div className="mx-auto w-full max-w-[1380px]">
          <div className="relative overflow-hidden rounded-[24px] border border-[#d8cbb4] bg-[#f5efe3] p-2 shadow-[0_28px_90px_-55px_rgba(88,69,29,0.45)] sm:rounded-[32px] sm:p-4 lg:p-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(151,169,75,0.18),transparent_30%)]" />

            <div className="relative grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.75fr)_minmax(380px,0.95fr)] lg:gap-4">
              <section className="hidden rounded-[28px] bg-gradient-to-br from-[#6e5123] via-[#677a34] to-[#95ad3d] p-8 text-[#f9f3e6] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] lg:flex lg:min-h-[720px] lg:flex-col lg:justify-between xl:p-12">
                <div className="max-w-2xl">
                  <span className="inline-flex rounded-full border border-white/30 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#efe5cf]">
                    {heroEyebrow}
                  </span>
                  <h1 className="mt-8 max-w-xl text-4xl font-bold leading-[0.96] tracking-[-0.04em] xl:text-[4rem]">
                    {heroTitle}
                  </h1>
                  <p className="mt-6 max-w-xl text-lg leading-8 text-[#f1e8d5]/88">
                    {heroDescription}
                  </p>
                </div>

                {highlights.length ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {highlights.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-[24px] border border-white/20 bg-white/10 p-5 backdrop-blur-[2px]"
                      >
                        <h2 className="text-lg font-semibold text-[#fff8ec]">
                          {item.title}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-[#f2ead9]/84">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="min-w-0 rounded-[20px] border border-[#decfb5] bg-[#fbf8f1] p-4 shadow-[0_20px_65px_-50px_rgba(80,59,18,0.5)] sm:rounded-[28px] sm:p-7 lg:p-10">
                <span className="block break-words px-2 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#869563] sm:text-[12px] sm:tracking-[0.38em]">
                  {formEyebrow}
                </span>
                <div className="mt-3 min-w-0 sm:mt-4">{children}</div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  </PageTransition>
);

export default AuthSplitLayout;
