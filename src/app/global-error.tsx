"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "20px",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            backgroundColor: "#f9fafb",
          }}
        >
          <div
            style={{
              maxWidth: "500px",
              textAlign: "center",
              backgroundColor: "white",
              padding: "48px 32px",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          >
            <h1
              style={{
                fontSize: "2.25rem",
                fontWeight: "700",
                marginBottom: "1rem",
                color: "#dc2626",
              }}
            >
              Oops! Something went wrong
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                color: "#6b7280",
                marginBottom: "2rem",
                lineHeight: "1.75",
              }}
            >
              We&apos;re sorry for the inconvenience. Our team has been automatically notified and
              we&apos;re working to fix the issue.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: "500",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "white",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  fontWeight: "500",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
              >
                Go Home
              </button>
            </div>
            {error.digest && (
              <p
                style={{
                  marginTop: "2rem",
                  fontSize: "0.875rem",
                  color: "#9ca3af",
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
