import "./globals.css";

export const metadata = {
  title: "Teacher Attendance",
  description: "Geo-verified teacher attendance system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
