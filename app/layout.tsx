import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Amazing Kitchen — Chinese Food in Tracy, CA",
  description: "Family-run Chinese kitchen at 2211 N Tracy Blvd in Tracy, California.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
