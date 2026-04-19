import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getBlogs } from "@/lib/api/blog";
import { ApiError } from "@/lib/api/client";

const formatBlogDate = (value?: string) => {
  if (!value) {
    return "Recently";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const BlogSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const blogsQuery = useQuery({
    queryKey: ["blogs", "home", 1, 10],
    queryFn: () =>
      getBlogs({
        page: 1,
        limit: 10,
        status: "active",
      }),
    retry: 1,
  });

  const blogs = blogsQuery.data?.blogs || [];

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    ref?.addEventListener("scroll", checkScroll);
    return () => ref?.removeEventListener("scroll", checkScroll);
  }, [blogs.length]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-14 bg-beige">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-1">Latest Blogs</h2>
        <p className="text-muted-foreground text-center mb-10">
          Tips, news & insights from the hemp world
        </p>

        {blogsQuery.isError ? (
          <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                {blogsQuery.error instanceof ApiError
                  ? blogsQuery.error.message
                  : "Unable to load latest blogs right now."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => blogsQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : null}

        <div className="relative group">
          {/* Left Arrow */}
          <Button
            variant="outline"
            size="icon"
            className={`absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur shadow-lg border-border/50 transition-opacity ${canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Right Arrow */}
          <Button
            variant="outline"
            size="icon"
            className={`absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur shadow-lg border-border/50 transition-opacity ${canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          >
            {blogsQuery.isLoading
              ? Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={`blog-loading-${index}`}
                    className="snap-start shrink-0 w-[260px] bg-card rounded-xl overflow-hidden border shadow-sm"
                  >
                    <div className="h-44 bg-muted/50 animate-pulse" />
                    <div className="p-5 space-y-2">
                      <div className="h-3 w-20 bg-muted/50 rounded animate-pulse" />
                      <div className="h-4 w-full bg-muted/50 rounded animate-pulse" />
                      <div className="h-4 w-4/5 bg-muted/50 rounded animate-pulse" />
                    </div>
                  </div>
                ))
              : blogs.map((blog) => (
                  <Link
                    key={blog.slug}
                    to={`/blog/${blog.slug}`}
                    className="snap-start shrink-0 w-[260px] group bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="h-44 bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center overflow-hidden">
                      {blog.image ? (
                        <img
                          src={blog.image}
                          alt={blog.name}
                          className="h-full w-full "
                        />
                      ) : (
                        <span className="text-xl font-semibold text-primary/50">
                          BLOG
                        </span>
                      )}
                    </div>
                    <div className="p-5 space-y-2">
                      <span className="text-xs text-muted-foreground">
                        {formatBlogDate(blog.created_at)}
                      </span>
                      <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors truncate">
                        {blog.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {blog.description || "Read the full blog post."}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-1">
                        Read More <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
          </div>
        </div>

        {!blogsQuery.isLoading && !blogs.length ? (
          <p className="text-center text-sm text-muted-foreground mt-6">
            No blogs available right now.
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default BlogSection;
