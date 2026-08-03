import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // הקישורים הקצרים לא נאספים למנועי חיפוש
  async headers() {
    return [
      {
        source: "/:slug",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
