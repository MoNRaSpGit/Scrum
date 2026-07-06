import { useEffect, useState } from "react";
import { BackendBuildMeta, fetchBackendBuildMeta, FRONTEND_BUILD_INFO } from "../config/build";

export function BuildMetaCard() {
  const [backendMeta, setBackendMeta] = useState<BackendBuildMeta | null>(null);

  useEffect(() => {
    let mounted = true;
    void fetchBackendBuildMeta()
      .then((nextMeta) => {
        if (mounted) {
          setBackendMeta(nextMeta);
        }
      })
      .catch(() => {
        if (mounted) {
          setBackendMeta(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <article style={cardStyle}>
      <strong style={titleStyle}>Build meta</strong>
      <span style={lineStyle}>Frontend: {FRONTEND_BUILD_INFO.version}</span>
      <span style={lineStyle}>Release: {FRONTEND_BUILD_INFO.releaseSha}</span>
      <span style={lineStyle}>Backend: {backendMeta?.version || "sin leer"}</span>
      <span style={lineStyle}>Entorno: {FRONTEND_BUILD_INFO.environment}</span>
    </article>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 8,
  border: "1px solid #dce3f0",
  background: "#ffffff",
  display: "grid",
  gap: 6
};

const titleStyle: React.CSSProperties = {
  color: "#17384a"
};

const lineStyle: React.CSSProperties = {
  color: "#5c7380",
  fontSize: 14
};
