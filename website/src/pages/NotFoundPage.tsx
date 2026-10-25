import { Button } from "antd";
import { Link } from "react-router-dom";
import styles from "./ChangelogPage.module.css";

export function NotFoundPage() {
  return (
    <div className={`${styles.page} ${styles.notFound}`}>
      <h1>Page not found</h1>
      <p>There is nothing at this address.</p>
      <Link to="/">
        <Button type="primary">Back to the home page</Button>
      </Link>
    </div>
  );
}
