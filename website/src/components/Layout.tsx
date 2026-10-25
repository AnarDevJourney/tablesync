import { GithubOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { Link, NavLink, Outlet } from "react-router-dom";
import { GITHUB_URL, NPM_NEST_URL, NPM_URL, VERSION } from "../site";
import { useThemeMode } from "../theme";
import { LogoMark } from "./Logo";
import styles from "./Layout.module.css";

const navClass = ({ isActive }: { isActive: boolean }) =>
  [styles.navLink, isActive && styles.navActive].filter(Boolean).join(" ");

export function Layout() {
  const { mode, toggle } = useThemeMode();
  const themeLabel = mode === "dark" ? "Light theme" : "Dark theme";

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand} aria-label="tablesync home">
            <LogoMark />
            <span className={styles.brandName}>tablesync</span>
            <span className={styles.version}>v{VERSION}</span>
          </Link>

          <nav className={styles.nav} aria-label="Main">
            <NavLink to="/docs" className={navClass}>
              Docs
            </NavLink>
            <NavLink to="/changelog" className={navClass}>
              Changelog
            </NavLink>
            <a
              href={NPM_URL}
              className={`${styles.navLink} ${styles.navExternal}`}
              target="_blank"
              rel="noreferrer"
            >
              npm
            </a>
          </nav>

          <div className={styles.actions}>
            <Tooltip title="GitHub">
              <Button
                type="text"
                icon={<GithubOutlined />}
                href={GITHUB_URL}
                target="_blank"
                aria-label="GitHub repository"
              />
            </Tooltip>
            <Tooltip title={themeLabel}>
              <Button
                type="text"
                icon={mode === "dark" ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggle}
                aria-label={themeLabel}
              />
            </Tooltip>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>MIT © Anar Talibov · Built with tablesync, React and Ant Design</span>
          <span className={styles.footerLinks}>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={NPM_URL} target="_blank" rel="noreferrer">
              tablesync
            </a>
            <a href={NPM_NEST_URL} target="_blank" rel="noreferrer">
              tablesync-nest
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
