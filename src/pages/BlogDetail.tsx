import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, Loader } from "lucide-react";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { getBlogBySlug, getBlogs } from "@/lib/api/blog";
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

const BlogDetail = () => {
  const { slug } = useParams();
  const blogQuery = useQuery({
    queryKey: ["blog", slug],
    queryFn: () => getBlogBySlug(slug || ""),
    enabled: Boolean(slug),
    retry: 1,
  });

  const relatedBlogsQuery = useQuery({
    queryKey: ["blogs", "related", slug],
    queryFn: () =>
      getBlogs({
        page: 1,
        limit: 6,
        status: "active",
      }),
    enabled: Boolean(slug),
    retry: 1,
  });

  const blog = blogQuery.data?.blog;
  const related = (relatedBlogsQuery.data?.blogs || [])
    .filter((item) => item.slug !== slug)
    .slice(0, 3);

  const contentParagraphs = (blog?.description || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (blogQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <div className="container py-20 text-center">
          <Loader className="h-8 w-8 text-primary mx-auto animate-spin mb-4" />
          <p className="text-muted-foreground">Loading blog article...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (blogQuery.isError) {
    const isNotFoundError =
      blogQuery.error instanceof ApiError && blogQuery.error.status === 404;

    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <div className="container py-20 text-center max-w-xl">
          <AlertCircle className="h-14 w-14 mx-auto text-destructive/60 mb-4" />
          <h1 className="text-2xl font-bold mb-3">
            {isNotFoundError ? "Blog Not Found" : "Unable to load blog"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isNotFoundError
              ? "The article you are looking for does not exist."
              : blogQuery.error instanceof ApiError
                ? blogQuery.error.message
                : "Please try again in a moment."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {!isNotFoundError ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => blogQuery.refetch()}
              >
                Retry
              </Button>
            ) : null}
            <Button asChild>
              <Link to="/blog">Back to Blog</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Blog Not Found</h1>
          <Link to="/blog" className="text-primary hover:underline">
            Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <main className="container py-12 max-w-3xl mx-auto">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <div className="h-64 md:h-80 bg-gradient-to-br from-primary/15 to-accent/15 rounded-xl overflow-hidden flex items-center justify-center mb-8">
            {blog.image ? (
              <img
                src={blog.image}
                alt={blog.name}
                className="h-full w-full "
              />
            ) : (
              <span className="text-4xl font-semibold text-primary/50">
                BLOG
              </span>
            )}
          </div>

          <span className="text-sm text-muted-foreground">
            {formatBlogDate(blog.created_at)}
          </span>
          <h1 className="text-3xl font-bold mt-2 mb-6">{blog.name}</h1>

          <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed space-y-4">
            {contentParagraphs.length ? (
              contentParagraphs.map((paragraph, index) => (
                <p key={`${blog.slug}-${index}`}>{paragraph}</p>
              ))
            ) : (
              <p>No description available for this article yet.</p>
            )}
          </div>

          <div className="mt-16 border-t pt-10">
            <h2 className="text-xl font-bold mb-6">Related Articles</h2>
            {relatedBlogsQuery.isLoading ? (
              <div className="rounded-xl border bg-card px-5 py-8 text-sm text-muted-foreground">
                Loading related articles...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {related.map((relatedBlog) => (
                  <Link
                    key={relatedBlog.slug}
                    to={`/blog/${relatedBlog.slug}`}
                    className="group bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="h-32 bg-gradient-to-br from-primary/15 to-accent/15 overflow-hidden flex items-center justify-center">
                      {relatedBlog.image ? (
                        <img
                          src={relatedBlog.image}
                          alt={relatedBlog.name}
                          className="h-full w-full "
                        />
                      ) : (
                        <span className="text-xs font-semibold text-primary/50">
                          BLOG
                        </span>
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                        {relatedBlog.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        Read More <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default BlogDetail;
