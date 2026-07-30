import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "마지막 종례 | 모바일 방탈출",
  description: "휴대폰의 터치, 기울기, 흔들기, 소리와 진동을 활용해 학교를 탈출하세요.",
  openGraph: {
    title: "마지막 종례",
    description: "휴대폰을 들고 12분 안에 학교를 탈출하세요.",
    images: [{ url: "/og.png", width: 1744, height: 909, alt: "마지막 종례 모바일 학교 방탈출" }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "마지막 종례",
    description: "휴대폰을 들고 12분 안에 학교를 탈출하세요.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
