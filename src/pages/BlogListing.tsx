import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PageTransition from "@/components/PageTransition";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BlogStatusFilter, getBlogs, searchBlogs } from "@/lib/api/blog";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

const BLOGS_PER_PAGE = 6;

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

const BlogListing = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get("q") || "").trim();
  const isSearchMode = Boolean(searchQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BlogStatusFilter>("active");

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const blogsQuery = useQuery({
    queryKey: [
      "blogs",
      isSearchMode ? "search" : "listing",
      searchQuery,
      currentPage,
      BLOGS_PER_PAGE,
      statusFilter,
    ],
    queryFn: () =>
      isSearchMode
        ? searchBlogs({
            q: searchQuery,
            page: currentPage,
            limit: BLOGS_PER_PAGE,
            status: statusFilter,
          })
        : getBlogs({
            page: currentPage,
            limit: BLOGS_PER_PAGE,
            status: statusFilter,
          }),
    placeholderData: (previousData) => previousData,
    retry: 1,
  });

  const visibleBlogs = blogsQuery.data?.blogs || [];
  const totalPages = Math.max(blogsQuery.data?.totalPages || 1, 1);

  const blogListErrorMessage =
    blogsQuery.error instanceof ApiError
      ? blogsQuery.error.message
      : "Unable to load blog posts right now.";

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <main className="container py-12">
          <h1 className="text-3xl font-bold text-center mb-2">Our Blog</h1>
          <p className="text-muted-foreground text-center mb-2">
            Tips, news and insights from the hemp world
          </p>
          {isSearchMode ? (
            <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>
                Showing results for
                <span className="font-medium text-foreground">
                  {` "${searchQuery}"`}
                </span>
              </span>
              <Button variant="link" className="h-auto p-0 text-sm" asChild>
                <Link to="/blog">Clear search</Link>
              </Button>
            </div>
          ) : (
            <div className="mb-6" />
          )}

          <div className="flex justify-end mb-6">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as BlogStatusFilter)
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="all">All</option>
              </select>
            </label>
          </div>

          {blogsQuery.isError && !visibleBlogs.length ? (
            <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>{blogListErrorMessage}</p>
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

          {blogsQuery.isLoading && !visibleBlogs.length ? (
            <div className="rounded-xl border bg-card px-5 py-8 text-sm text-muted-foreground">
              Loading blog posts...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleBlogs.map((blog) => (
                <Link
                  key={blog.slug}
                  to={`/blog/${blog.slug}`}
                  className="group bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="h-48 bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center overflow-hidden">
                    {blog.image ? (
                      <img
                        src={blog.image}
                        alt={blog.name}
                        className="h-full w-full "
                      />
                    ) : (
                      <span className="text-3xl font-semibold text-primary/50">
                        BLOG
                      </span>
                    )}
                  </div>
                  <div className="p-5 space-y-2">
                    <span className="text-xs text-muted-foreground">
                      {formatBlogDate(blog.created_at)}
                    </span>
                    <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors">
                      {blog.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {blog.description || "Read the full article for details."}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-1">
                      Read More <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!blogsQuery.isLoading && !visibleBlogs.length ? (
            <div className="rounded-xl border bg-card px-5 py-8 text-sm text-muted-foreground mt-6">
              {isSearchMode
                ? "No blogs found for this search."
                : "No blogs found for the selected filter."}
            </div>
          ) : null}

          {totalPages > 1 ? (
            <div className="mt-10">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrentPage((previousPage) =>
                          Math.max(1, previousPage - 1),
                        );
                      }}
                      className={
                        currentPage === 1 || blogsQuery.isFetching
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1,
                  ).map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        size="default"
                        isActive={currentPage === pageNumber}
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage(pageNumber);
                        }}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrentPage((previousPage) =>
                          Math.min(totalPages, previousPage + 1),
                        );
                      }}
                      className={
                        currentPage === totalPages || blogsQuery.isFetching
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default BlogListing;
