import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GLASS RUN 01 | 유리 복도 추격전",
  description: "색색의 기둥과 유리벽 사이를 달려 투명 유리문으로 탈출하는 모바일 추격 게임",
  openGraph: {
    title: "GLASS RUN 01",
    description: "유리벽을 피해 복도 끝 투명문까지 달려라.",
    images: [{ url: "/og.png", width: 1744, height: 909, alt: "GLASS RUN 01 모바일 추격 게임" }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "GLASS RUN 01", description: "유리벽을 피해 복도 끝 투명문까지 달려라.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
