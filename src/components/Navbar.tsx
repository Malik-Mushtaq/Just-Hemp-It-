import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/lib/api/category";
import { BlogItem, searchBlogs } from "@/lib/api/blog";
import { ProductItem, searchProducts } from "@/lib/api/product";
import {
  Search,
  ShoppingCart,
  Menu,
  ChevronDown,
  UserCircle2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import logo from "@/assets/logo.png";

type SearchScope = "products" | "blogs";

type NavItem = {
  label: string;
  href: string;
  isRoute?: boolean;
  children?: string[];
};

const navLinks: NavItem[] = [
  { label: "Home", href: "/", isRoute: true },
  { label: "Products", href: "/products", isRoute: true },
  {
    label: "Categories",
    href: "#categories",
    children: [],
  },
  { label: "Blogs", href: "/blog", isRoute: true },
  { label: "About Us", href: "/about", isRoute: true },
  { label: "Contact Us", href: "/contact", isRoute: true },
];

const resolveSearchScope = (pathname: string): SearchScope =>
  pathname.startsWith("/blog") ? "blogs" : "products";

const getSearchPath = (scope: SearchScope, query: string) => {
  const route = scope === "blogs" ? "/blog" : "/products";
  return `${route}?q=${encodeURIComponent(query)}`;
};

const toProductSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const getProductDetailPath = (product: ProductItem) =>
  `/product/${toProductSlug(product.product_name)}`;

const getBlogDetailPath = (blog: BlogItem) =>
  `/blog/${encodeURIComponent(blog.slug)}`;

const getAccountDisplayName = (
  user:
    | {
        first_name?: string;
        last_name?: string;
      }
    | null
    | undefined,
) => {
  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "My Account";
};

const isNavLinkActive = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchScope, setSearchScope] = useState<SearchScope>("products");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [desktopSuggestionsOpen, setDesktopSuggestionsOpen] = useState(false);
  const [mobileSuggestionsOpen, setMobileSuggestionsOpen] = useState(false);

  const desktopSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const { totalItems, setIsOpen } = useCart();
  const accountDisplayName = getAccountDisplayName(user);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";

    setSearchScope(resolveSearchScope(location.pathname));
    setSearchValue(q);
    setDesktopSuggestionsOpen(false);
    setMobileSuggestionsOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchValue(searchValue.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchValue]);

  useEffect(() => {
    if (!mobileOpen) {
      setMobileSuggestionsOpen(false);
    }
  }, [mobileOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(target)
      ) {
        setDesktopSuggestionsOpen(false);
      }

      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(target)
      ) {
        setMobileSuggestionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const dynamicNavLinks = navLinks.map((link) => {
    if (link.label === "Categories") {
      return {
        ...link,
        children: categoriesData?.categories?.map((c) => c.category_name) ?? [],
      };
    }

    return link;
  });

  const desktopLeftNavLinks = dynamicNavLinks.slice(0, 3);
  const desktopRightNavLinks = dynamicNavLinks.slice(3);

  const normalizedTypedValue = searchValue.trim();
  const isSuggestionsOpen = desktopSuggestionsOpen || mobileSuggestionsOpen;
  const shouldFetchSuggestions =
    debouncedSearchValue.length >= 2 && isSuggestionsOpen;

  const productSuggestionsQuery = useQuery({
    queryKey: ["navbar-search", "products", debouncedSearchValue],
    queryFn: () =>
      searchProducts({
        q: debouncedSearchValue,
        page: 1,
        limit: 6,
      }),
    enabled: shouldFetchSuggestions && searchScope === "products",
    staleTime: 30 * 1000,
  });

  const blogSuggestionsQuery = useQuery({
    queryKey: ["navbar-search", "blogs", debouncedSearchValue],
    queryFn: () =>
      searchBlogs({
        q: debouncedSearchValue,
        status: "active",
        page: 1,
        limit: 6,
      }),
    enabled: shouldFetchSuggestions && searchScope === "blogs",
    staleTime: 30 * 1000,
  });

  const productSuggestions = productSuggestionsQuery.data?.products || [];
  const blogSuggestions = blogSuggestionsQuery.data?.blogs || [];

  const suggestionsLoading =
    searchScope === "products"
      ? productSuggestionsQuery.isFetching
      : blogSuggestionsQuery.isFetching;

  const suggestionsError =
    searchScope === "products"
      ? productSuggestionsQuery.isError
      : blogSuggestionsQuery.isError;

  const handleLogout = () => {
    setMobileOpen(false);
    logout({ reason: "manual" });
  };

  const handleSuggestionSelect = (path: string, label: string) => {
    setSearchValue(label);
    setDesktopSuggestionsOpen(false);
    setMobileSuggestionsOpen(false);
    setMobileOpen(false);
    navigate(path);
  };

  const submitSearch = (
    event: FormEvent<HTMLFormElement>,
    source: "desktop" | "mobile",
  ) => {
    event.preventDefault();

    if (!normalizedTypedValue) {
      return;
    }

    setDesktopSuggestionsOpen(false);
    setMobileSuggestionsOpen(false);

    navigate(getSearchPath(searchScope, normalizedTypedValue));

    if (source === "mobile") {
      setMobileOpen(false);
    }
  };

  const renderSuggestions = () => {
    if (!normalizedTypedValue) {
      return (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          Start typing to search.
        </p>
      );
    }

    if (normalizedTypedValue.length < 2) {
      return (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          Type at least 2 characters.
        </p>
      );
    }

    if (suggestionsLoading) {
      return (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          Finding related {searchScope === "products" ? "products" : "blogs"}
          ...
        </p>
      );
    }

    if (suggestionsError) {
      return (
        <p className="px-3 py-2 text-xs text-destructive">
          Could not load suggestions right now.
        </p>
      );
    }

    if (searchScope === "products") {
      if (!productSuggestions.length) {
        return (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            No related products found.
          </p>
        );
      }

      return (
        <div className="grid gap-1">
          {productSuggestions.map((product) => (
            <button
              key={product.id}
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-muted transition-colors"
              onClick={() =>
                handleSuggestionSelect(
                  getProductDetailPath(product),
                  product.product_name,
                )
              }
            >
              {product.main_img ? (
                <img
                  src={product.main_img}
                  alt={product.product_name}
                  className="h-9 w-9 rounded object-cover border"
                />
              ) : (
                <div className="h-9 w-9 rounded border bg-muted flex items-center justify-center text-xs">
                  P
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">
                  {product.product_name}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {product.category_name || "Product"}
                </p>
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (!blogSuggestions.length) {
      return (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          No related blogs found.
        </p>
      );
    }

    return (
      <div className="grid gap-1">
        {blogSuggestions.map((blog) => (
          <button
            key={blog.slug}
            type="button"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-muted transition-colors"
            onClick={() =>
              handleSuggestionSelect(getBlogDetailPath(blog), blog.name)
            }
          >
            {blog.image ? (
              <img
                src={blog.image}
                alt={blog.name}
                className="h-9 w-9 rounded object-cover border"
              />
            ) : (
              <div className="h-9 w-9 rounded border bg-muted flex items-center justify-center text-[10px]">
                BLOG
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{blog.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {blog.description || "Blog post"}
              </p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderDesktopNavItem = (link: NavItem) => (
    <div key={link.label} className="relative group">
      {link.isRoute ? (
        <Link
          to={link.href}
          className="text-[13px] font-medium tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1.5px] after:bottom-[-3px] after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 group-hover:after:scale-x-100 group-hover:after:origin-bottom-left flex items-center gap-1"
        >
          {link.label}
        </Link>
      ) : (
        <a
          href={link.href}
          className="text-[13px] font-medium tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1.5px] after:bottom-[-3px] after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 group-hover:after:scale-x-100 group-hover:after:origin-bottom-left flex items-center gap-1"
        >
          {link.label}
          {link.children && <ChevronDown className="h-3 w-3" />}
        </a>
      )}
      {link.children && link.children.length > 0 && (
        <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="bg-card border rounded-md shadow-lg p-3 min-w-[180px] grid gap-0.5">
            {link.children.map((cat) => (
              <Link
                key={cat}
                to={`/products?category=${encodeURIComponent(cat)}`}
                className="text-xs py-1.5 px-3 rounded hover:bg-muted transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background shadow-sm">
        {/* Top row: search | logo | actions */}
        <div className="container flex items-center justify-between h-20">
          {/* Search - left */}
          <div className="hidden lg:block w-80" ref={desktopSearchRef}>
            <div className="relative">
              <form
                onSubmit={(event) => submitSearch(event, "desktop")}
                className="flex items-center rounded-full border border-muted bg-card/50 p-1 shadow-sm transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
              >
                <label
                  htmlFor="navbar-search-scope-desktop"
                  className="sr-only"
                >
                  Search scope
                </label>
                <select
                  id="navbar-search-scope-desktop"
                  value={searchScope}
                  onChange={(event) => {
                    setSearchScope(event.target.value as SearchScope);
                    setDesktopSuggestionsOpen(true);
                  }}
                  className="h-7 rounded-full bg-transparent px-2 text-[11px] font-semibold uppercase tracking-wide text-foreground/80 outline-none"
                >
                  <option value="products">Products</option>
                  <option value="blogs">Blogs</option>
                </select>

                <div className="mx-1 h-4 w-px bg-border" />

                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchValue}
                    onFocus={() => {
                      setDesktopSuggestionsOpen(true);
                      setMobileSuggestionsOpen(false);
                    }}
                    onChange={(event) => {
                      setSearchValue(event.target.value);
                      setDesktopSuggestionsOpen(true);
                    }}
                    placeholder={
                      searchScope === "blogs"
                        ? "Search blog posts..."
                        : "Search products..."
                    }
                    className="h-7 border-0 bg-transparent pl-8 pr-2 text-xs rounded-none focus-visible:ring-0"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  className="h-7 rounded-full px-3 text-xs"
                  disabled={!normalizedTypedValue}
                >
                  Search
                </Button>
              </form>

              {desktopSuggestionsOpen ? (
                <div className="absolute left-0 right-0 mt-2 z-[70] rounded-xl border bg-popover p-2 shadow-xl">
                  <div className="px-2 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    Related {searchScope === "products" ? "Products" : "Blogs"}
                  </div>
                  {renderSuggestions()}
                </div>
              ) : null}
            </div>
          </div>

          {/* Logo - desktop overlaps both rows */}
          <Link
            to="/"
            className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-1 z-[60]"
          >
            <img
              src={logo}
              alt="Just Hemp It"
              className="h-32 w-auto rounded"
            />
          </Link>

          {/* Logo - mobile center */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 lg:hidden z-10"
          >
            <img
              src={logo}
              alt="Just Hemp It"
              className="h-12 w-auto rounded"
            />
          </Link>

          {/* Actions - right */}
          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 rounded-full border border-[#d9cdb7] bg-[#fffdf7] px-4 py-2 text-sm font-medium text-[#5a4b3a] shadow-sm transition-colors hover:border-[#c9b68d] hover:bg-[#f8f2e6]"
                >
                  <UserCircle2 className="h-4 w-4 text-[#75614d]" />
                  <span>{accountDisplayName}</span>
                </Link>
                <button
                  type="button"
                  className="text-xs font-medium text-foreground/70 hover:text-foreground transition-colors px-2"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/retailer-login"
                  className="text-xs font-medium text-foreground/70 hover:text-foreground transition-colors px-2"
                >
                  Retailer Signin
                </Link>
                <Button
                  size="sm"
                  className="rounded-full h-7 text-xs px-4"
                  asChild
                >
                  <Link to="/wholesale-login">Wholesaler Signin</Link>
                </Button>
              </>
            )}
            <button className="relative p-1.5" onClick={() => setIsOpen(true)}>
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          <button
            className="lg:hidden p-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation row */}
        <nav className="hidden lg:flex items-center justify-center gap-10 border-t py-2">
          <div className="flex items-center gap-7">
            {desktopLeftNavLinks.map(renderDesktopNavItem)}
          </div>

          <div className="w-40" aria-hidden="true" />

          <div className="flex items-center gap-7">
            {desktopRightNavLinks.map(renderDesktopNavItem)}
          </div>
        </nav>

      </header>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[86vw] max-w-[390px] border-r border-[#ddd4c2] bg-[#f8f4ec] p-0 text-[#6f5f4c] [&>button]:right-4 [&>button]:top-5 [&>button]:opacity-90"
        >
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-[#ddd4c2] px-5 py-5 text-left">
              <SheetTitle className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6a8341]">
                Menu
              </SheetTitle>
              <SheetDescription className="pt-1 text-sm text-[#7b6b57]">
                Browse pages and search products
              </SheetDescription>
            </SheetHeader>

            <div
              className="flex-1 overflow-y-auto px-5 py-6"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.75rem)" }}
            >
              <div ref={mobileSearchRef} className="space-y-4">
                <form
                  onSubmit={(event) => submitSearch(event, "mobile")}
                  className="space-y-3"
                >
                  <label
                    htmlFor="navbar-search-scope-mobile"
                    className="sr-only"
                  >
                    Search scope
                  </label>
                  <select
                    id="navbar-search-scope-mobile"
                    value={searchScope}
                    onChange={(event) => {
                      setSearchScope(event.target.value as SearchScope);
                      setMobileSuggestionsOpen(true);
                    }}
                    className="h-12 w-full rounded-full border border-[#ede5d8] bg-white px-5 text-sm text-[#5f5344] outline-none transition focus:border-[#c8b995]"
                  >
                    <option value="products">All Products</option>
                    <option value="blogs">Blogs</option>
                  </select>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#897a65]" />
                    <Input
                      value={searchValue}
                      onFocus={() => {
                        setMobileSuggestionsOpen(true);
                        setDesktopSuggestionsOpen(false);
                      }}
                      onChange={(event) => {
                        setSearchValue(event.target.value);
                        setMobileSuggestionsOpen(true);
                      }}
                      placeholder="Search products"
                      className="h-12 rounded-full border-[#ede5d8] bg-white pl-11 pr-4 text-sm text-[#5f5344] placeholder:text-[#9b8f7f] focus-visible:ring-1 focus-visible:ring-[#c8b995]"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    className="h-11 w-full rounded-2xl bg-[#69863d] text-sm font-semibold text-white hover:bg-[#5f7938]"
                    disabled={!normalizedTypedValue}
                  >
                    Search
                  </Button>
                </form>

                {mobileSuggestionsOpen ? (
                  <div className="rounded-[1.25rem] border border-[#e5dccf] bg-white p-2 shadow-sm">
                    <div className="px-2 pb-1 text-[11px] uppercase tracking-wide text-[#8d7d69]">
                      Related {searchScope === "products" ? "Products" : "Blogs"}
                    </div>
                    {renderSuggestions()}
                  </div>
                ) : null}
              </div>

              <div className="my-6 h-px bg-[#ddd4c2]" />

              <nav className="space-y-1" aria-label="Mobile navigation">
                {dynamicNavLinks.map((link) => {
                  const active =
                    link.isRoute &&
                    isNavLinkActive(location.pathname, link.href);

                  return (
                    <div key={link.label}>
                      {link.isRoute ? (
                        <Link
                          to={link.href}
                          className={`block rounded-full px-4 py-3 text-[1.02rem] uppercase tracking-[0.28em] transition-colors ${
                            active
                              ? "bg-[#efeadf] font-medium text-[#6a8341]"
                              : "text-[#6e6255] hover:bg-[#f1ebdf]"
                          }`}
                          onClick={() => setMobileOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="block rounded-full px-4 py-3 text-[1.02rem] uppercase tracking-[0.28em] text-[#6e6255] transition-colors hover:bg-[#f1ebdf]"
                          onClick={() => !link.children && setMobileOpen(false)}
                        >
                          {link.label}
                        </a>
                      )}

                      {link.children && link.children.length > 0 ? (
                        <div className="mt-1 space-y-1 pl-4">
                          {link.children.map((cat) => (
                            <Link
                              key={cat}
                              to={`/products?category=${encodeURIComponent(cat)}`}
                              className="block rounded-full px-4 py-2 text-sm text-[#8a7d6c] transition-colors hover:bg-[#f1ebdf]"
                              onClick={() => setMobileOpen(false)}
                            >
                              {cat}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </nav>

              <div className="mt-8 h-px bg-[#ddd4c2]" />

              {isAuthenticated ? (
                <div className="space-y-3 pt-5">
                  <Link
                    to="/dashboard"
                    className="flex h-12 items-center gap-2 rounded-full border border-[#d9cdb7] bg-white px-4 text-sm font-medium text-[#6b5d4f] shadow-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    <UserCircle2 className="h-4 w-4 text-[#75614d]" />
                    <span className="truncate">{accountDisplayName}</span>
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-12 w-full rounded-full border-[#e4d9c7] bg-[#efe8dc] text-sm font-medium text-[#6b5d4f] hover:bg-[#e7dece]"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-12 w-full rounded-full border-[#d9cdb7] bg-white text-[#6b5d4f] hover:bg-[#f7f2e8]"
                    asChild
                  >
                    <Link
                      to="/retailer-login"
                      onClick={() => setMobileOpen(false)}
                    >
                      Retailer Signin
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    className="h-12 w-full rounded-full bg-[#69863d] text-white hover:bg-[#5f7938]"
                    asChild
                  >
                    <Link
                      to="/wholesale-login"
                      onClick={() => setMobileOpen(false)}
                    >
                      Wholesaler Signin
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      {/* Spacer for fixed header */}
      <div className="h-[108px] lg:h-[146px]" />
    </>
  );
};

export default Navbar;
