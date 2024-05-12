import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import PWABadge from "~/components/PWABadge";
import { PWAAssets } from "~/components/PWAAssets";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <PWAAssets />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <PWABadge />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
