/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { BlogIndex } from "./pages/BlogIndex";
import { BlogCategory } from "./pages/BlogCategory";
import { Post } from "./pages/Post";
import { About } from "./pages/About";
import { Photography } from "./pages/Photography";
import { Search } from "./pages/Search";
import { ScrollToTop } from "./components/ScrollToTop";

function LegacySlugRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={slug ? `/blog/${slug}` : "/blog"} replace />;
}

function CategoryShortcutRedirect() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug || slug === "all") return <Navigate to="/blog" replace />;
  if (slug === "sam") return <Navigate to="/blog/category/ai" replace />;
  if (slug === "ui-ux-guides") return <Navigate to="/blog/category/ui-ux" replace />;
  return <Navigate to={`/blog/category/${slug}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <Routes>
        {/* Canonical Blog & Portfolio Routes */}
        <Route path="/" element={<BlogIndex />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/category/sam" element={<Navigate to="/blog/category/ai" replace />} />
        <Route path="/blog/category/ui-ux-guides" element={<Navigate to="/blog/category/ui-ux" replace />} />
        <Route path="/blog/category/:slug" element={<BlogCategory />} />
        <Route path="/blog/ux-guide" element={<Post forcedSlug="ux-guide" />} />
        <Route path="/blog/ux-guide/:slug" element={<Post />} />
        <Route path="/blog/:slug" element={<Post />} />

        {/* Category Shorthand Redirects */}
        <Route path="/category/:slug" element={<CategoryShortcutRedirect />} />

        {/* Reusable Portfolio & Studio Routes */}
        <Route path="/work" element={<Photography />} />
        <Route path="/photography" element={<Photography />} />
        <Route path="/about" element={<About />} />
        <Route path="/search" element={<Search />} />

        {/* Clean Redirects for Legacy & Doc Aliases */}
        <Route path="/essays" element={<Navigate to="/blog" replace />} />
        <Route path="/essays/:slug" element={<LegacySlugRedirect />} />
        <Route path="/post/:slug" element={<LegacySlugRedirect />} />
        <Route path="/ai" element={<Navigate to="/blog/category/ai" replace />} />
        <Route path="/sam" element={<Navigate to="/blog/category/ai" replace />} />
        <Route path="/docs/sam" element={<Navigate to="/blog/category/ai" replace />} />
        <Route path="/docs/sam/:slug" element={<LegacySlugRedirect />} />
        <Route path="/design" element={<Navigate to="/blog/category/design-systems" replace />} />
        <Route path="/ux-guide" element={<Navigate to="/blog/ux-guide" replace />} />

        <Route path="*" element={<Navigate to="/blog" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
