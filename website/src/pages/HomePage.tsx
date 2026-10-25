import {
  AppstoreOutlined,
  ArrowRightOutlined,
  CloudServerOutlined,
  ColumnWidthOutlined,
  DatabaseOutlined,
  GithubOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { Link } from "react-router-dom";
import { CodeBlock } from "../components/CodeBlock";
import { CopyButton } from "../components/CopyButton";
import { DemoTable } from "../demo/DemoTable";
import { GITHUB_URL } from "../site";
import styles from "./HomePage.module.css";

const INSTALL = "npm install tablesync";

const FEATURES = [
  {
    icon: <CloudServerOutlined />,
    title: "Saved per user, on your server",
    text: "Column order, visibility, widths, pins, density and view follow each user to every browser and device.",
  },
  {
    icon: <DatabaseOutlined />,
    title: "Backend included",
    text: "A NestJS + TypeORM module with validation and per-user isolation — or three small REST endpoints in any stack.",
  },
  {
    icon: <ColumnWidthOutlined />,
    title: "Shaped in place",
    text: "Drag a header to reorder, drag its edge to resize, double-click to reset. A settings drawer does the rest.",
  },
  {
    icon: <AppstoreOutlined />,
    title: "Six views, live previews",
    text: "Classic, striped, grid, minimal, cards and status accent — each preview drawn from the user's own columns.",
  },
  {
    icon: <ThunderboltOutlined />,
    title: "Instant, then saved",
    text: "Changes show at once and are saved in the background, in order. A failed save rolls back to what is stored.",
  },
  {
    icon: <GlobalOutlined />,
    title: "Fits your app",
    text: "Follows your Ant Design theme in light and dark, and takes every text from your i18n library.",
  },
];

const FRONTEND = `
import {
  createRestStorage,
  DataTable,
  TableSyncProvider,
} from "tablesync";
import "tablesync/styles.css";

const storage = createRestStorage({
  baseUrl: "/api/table-settings",
});

export function UsersPage({ users }) {
  return (
    <TableSyncProvider storage={storage}>
      <DataTable
        tableKey="users"
        columns={columns}
        data={users}
        rowKey="id"
      />
    </TableSyncProvider>
  );
}`;

const BACKEND = `
import {
  TableSyncModule,
  TableSyncSettings,
} from "tablesync-nest";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      entities: [TableSyncSettings /* , … */],
    }),
    TableSyncModule.forRoot({
      path: "api/table-settings",
      // read the user from your auth guard
      getUserId: (req) => req.user?.id,
    }),
  ],
})
export class AppModule {}`;

export function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Open source · MIT · React + Ant Design</span>
        <h1 className={styles.title}>
          Tables that remember
          <br />
          how each user likes them
        </h1>
        <p className={styles.lead}>
          Users reorder, hide, resize and pin columns, and pick a density and a look.
          tablesync saves it <strong>per user, on your server</strong> — frontend and
          backend included.
        </p>
        <div className={styles.ctas}>
          <Link to="/docs">
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              iconPlacement="end"
            >
              Get started
            </Button>
          </Link>
          <Button
            size="large"
            icon={<GithubOutlined />}
            href={GITHUB_URL}
            target="_blank"
          >
            GitHub
          </Button>
          <div className={styles.install}>
            <code>
              <span className={styles.prompt}>$</span> {INSTALL}
            </code>
            <CopyButton text={INSTALL} />
          </div>
        </div>
      </section>

      <section className={styles.demoSection} aria-labelledby="demo-title">
        <div className={styles.demoHeader}>
          <h2 id="demo-title" className={styles.sectionTitle}>
            Try it
          </h2>
          <p className={styles.sectionText}>
            Drag a header, resize a column, open ⚙ to pin columns or switch the view —
            then reload the page. This demo saves to your browser; in your app it saves to
            your API.
          </p>
        </div>
        <div className={styles.demoCard}>
          <DemoTable />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="features-title">
        <h2 id="features-title" className={styles.sectionTitle}>
          Why tablesync
        </h2>
        <div className={styles.features}>
          {FEATURES.map((feature) => (
            <article key={feature.title} className={styles.feature}>
              <span className={styles.featureIcon}>{feature.icon}</span>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureText}>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="how-title">
        <h2 id="how-title" className={styles.sectionTitle}>
          Two packages, a few lines each
        </h2>
        <div className={styles.code}>
          <div>
            <h3 className={styles.codeTitle}>
              <span className={styles.step}>1</span> Frontend — <code>tablesync</code>
            </h3>
            <CodeBlock code={FRONTEND} title="UsersPage.tsx" />
          </div>
          <div>
            <h3 className={styles.codeTitle}>
              <span className={styles.step}>2</span> Backend — <code>tablesync-nest</code>
            </h3>
            <CodeBlock code={BACKEND} title="app.module.ts" />
          </div>
        </div>
        <p className={styles.note}>
          No NestJS? Any backend works: implement{" "}
          <Link to="/docs#backend-anything-else-rest-contract">three REST endpoints</Link>
          , or keep settings in <code>localStorage</code> with no backend at all.
        </p>
      </section>

      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Ready to give your users their own tables?</h2>
        <Link to="/docs">
          <Button type="primary" size="large">
            Read the docs
          </Button>
        </Link>
      </section>
    </>
  );
}
