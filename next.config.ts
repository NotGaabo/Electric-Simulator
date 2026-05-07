import type { NextConfig } from "next";

const allowedDevOrigins = [
  "localhost",
  "127.0.0.1",
  "10.0.0.214",
].filter((value): value is string => Boolean(value));

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: Array.from(new Set(allowedDevOrigins)),
};

export default nextConfig;
