import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useEffect, useState } from "react";

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // clipboard blocked (http, permissions): nothing to show
    }
  };

  return (
    <Tooltip title={copied ? "Copied" : "Copy"}>
      <Button
        type="text"
        size="small"
        className={className}
        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
        onClick={copy}
        aria-label="Copy to clipboard"
      />
    </Tooltip>
  );
}
