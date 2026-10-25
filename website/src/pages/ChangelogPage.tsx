import changelog from "../../../CHANGELOG.md?raw";
import { Markdown } from "../components/Markdown";
import styles from "./ChangelogPage.module.css";

export function ChangelogPage() {
  return (
    <div className={styles.page}>
      <Markdown source={changelog} />
    </div>
  );
}
