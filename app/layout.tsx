// FIX: Import React to resolve the "Cannot find namespace 'React'" error for the `React.ReactNode` type.
import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HIM Wellness BI Dashboard',
  description: 'A modern, responsive Business Intelligence (BI) dashboard to visualize key business metrics for orders, CRM, leads, sales, and products. Built with React and Tailwind CSS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}