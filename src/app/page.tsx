import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, BookUser, Disc3, HeartPulse, ShieldCheck, Swords, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image');

  const features = [
    {
      icon: <BookUser className="w-8 h-8 text-primary" />,
      title: 'Wise Sensei Dialogue',
      description: 'Engage with an AI sensei, providing wisdom and guidance for your ninja way, 24/7.',
    },
    {
      icon: <HeartPulse className="w-8 h-8 text-primary" />,
      title: 'Real-Time Chakra Analysis',
      description: 'The AI continuously assesses your vocal and linguistic patterns to read your emotional chakra.',
    },
    {
      icon: <Swords className="w-8 h-8 text-primary" />,
      title: 'Personalized Jutsu Training',
      description: 'Receive AI-generated emotional regulation techniques (jutsu) tailored to your current state.',
    },
    {
      icon: <Disc3 className="w-8 h-8 text-primary" />,
      title: 'Encrypted Scroll Communication',
      description: 'Interact via a secure, real-time voice channel for seamless and efficient training sessions.',
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: 'Shinobi Progress Analytics',
      description: 'Review your emotional trends and access encrypted mission logs on your private dashboard.',
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary" />,
      title: 'Anbu-Level Security',
      description: 'Your data is secured with advanced authentication and end-to-end encryption, worthy of a Kage.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 border-b border-border/50">
        <Link href="/" className="flex items-center justify-center">
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            href="/login"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Login
          </Link>
          <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Link href="/signup">Start Training</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full pt-24 md:pt-32 lg:pt-40">
          <div className="container px-4 md:px-6 space-y-10 xl:space-y-16">
            <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16 items-center">
              <div>
                <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem] font-headline text-primary/90">
                  Master Your Nindo, Master Yourself
                </h1>
                <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl mt-4">
                  Nindo AI is your personal sensei for mastering emotional chakra and forging your own ninja way.
                </p>
                <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                  <Button asChild size="lg" className="group bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/signup">
                      Begin Your Journey
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                {heroImage && (
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    width={1200}
                    height={800}
                    className="rounded-xl object-cover aspect-[3/2] overflow-hidden opacity-70"
                    data-ai-hint={heroImage.imageHint}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                  Core Jutsus
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Forged for Legendary Shinobi
                </h2>
                <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  A scroll of powerful techniques for chakra analysis and emotional mastery, all within a secure dojo.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 mt-12">
              {features.map((feature, index) => (
                <Card key={index} className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:bg-card transition-colors">
                  <CardHeader className="flex flex-row items-center gap-4">
                    {feature.icon}
                    <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-border/50">
        <p className="text-xs text-foreground/60">
          © {new Date().getFullYear()} Nindo AI. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Scroll of Conduct
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Ninja Privacy Pact
          </Link>
        </nav>
      </footer>
    </div>
  );
}
