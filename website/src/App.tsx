import { App as AntdApp, ConfigProvider } from "antd";
import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { antdThemeFor, useThemeMode } from "./theme";

// The markdown pages (and their parser) load only when opened
const DocsPage = lazy(() =>
  import("./pages/DocsPage").then((m) => ({ default: m.DocsPage })),
);
const ChangelogPage = lazy(() =>
  import("./pages/ChangelogPage").then((m) => ({ default: m.ChangelogPage })),
);

// New page → top; a #hash → that heading (after the page has rendered)
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const frame = requestAnimationFrame(() =>
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView(),
    );
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}

export function App() {
  const { mode } = useThemeMode();
  return (
    <ConfigProvider theme={antdThemeFor(mode)}>
      <AntdApp>
        <ScrollManager />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route
              path="docs"
              element={
                <Suspense>
                  <DocsPage />
                </Suspense>
              }
            />
            <Route
              path="changelog"
              element={
                <Suspense>
                  <ChangelogPage />
                </Suspense>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AntdApp>
    </ConfigProvider>
  );
}
