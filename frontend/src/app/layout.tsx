import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import './glowing-effects.css'
import './performance.css'
import dynamic from 'next/dynamic'
import { Providers } from '../components/Providers'

// تحميل المكونات بشكل ديناميكي لتحسين الأداء
const NightSkyWithMoon = dynamic(() => import('../components/SimpleMoon'), { 
  ssr: false,
  loading: () => null
})
const NavbarWrapper = dynamic(() => import('../components/NavbarWrapper'), {
  ssr: false,
  loading: () => <div style={{ height: '80px' }} /> // placeholder لمنع layout shift
})
const ClientPathCheck = dynamic(() => import('../components/ClientPathCheck'), { 
  ssr: false,
  loading: () => null
})
const PageTransition = dynamic(() => import('../components/PageTransition'), {
  ssr: false,
  loading: () => null
})
const PageLoader = dynamic(() => import('../components/PageLoader'), {
  ssr: false,
  loading: () => null
})

const cairo = Cairo({ 
  subsets: ['latin', 'arabic'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-cairo',
})

export const metadata: Metadata = { 
  title: 'EduFutura - منصة المستقبل التعليمية',
  description: 'منصة تعليمية متطورة تقدم دورات تعليمية وكتب رقمية بتجربة فريدة',
  keywords: 'تعليم, دورات أونلاين, كتب رقمية, منصة تعليمية, تعلم عن بعد',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        {/* تحسين الأداء */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body className={cairo.className} suppressHydrationWarning> 
        <Providers>
          <PageLoader />
          <NavbarWrapper />
          <ClientPathCheck>
            <NightSkyWithMoon />
          </ClientPathCheck>
          <PageTransition>
            <main className="min-h-screen pt-20" style={{ willChange: 'contents' }}> 
              {children} 
            </main>
          </PageTransition>
        </Providers>
      </body>
    </html>
  )
}