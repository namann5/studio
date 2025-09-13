import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, Bot, HeartPulse, Lock, ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image');

  const features = [
    {
      icon: <Bot className="w-8 h-8 text-primary" />,
      title: 'Intelligent Conversation Engine',
      description: 'Engage with a supportive AI trained on adolescent communication styles for dynamic, adaptive dialogue.',
    },
    {
      icon: <HeartPulse className="w-8 h-8 text-primary" />,
      title: 'Real-Time Sentiment Analysis',
      description: 'Our engine assesses emotional indicators in real-time to understand the user\'s state.',
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary" />,
      title: 'Multi-Layer Safety Framework',
      description: 'Risk assessment algorithms with automated escalation to crisis hotlines when needed.',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      title: 'Adaptive Learning System',
      description: 'Our algorithms continuously improve response quality based on engagement patterns and outcome metrics.',
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: 'Crisis Prevention Analytics',
      description: 'Predictive modeling identifies at-risk users, enabling proactive intervention earlier than traditional methods.',
    },
    {
      icon: <Lock className="w-8 h-8 text-primary" />,
      title: 'HIPAA-Compliant Security',
      description: 'Your data is secured with end-to-end encryption and a zero-knowledge architecture.',
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
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full pt-24 md:pt-32 lg:pt-40">
          <div className="container px-4 md:px-6 space-y-10 xl:space-y-16">
            <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16 items-center">
              <div>
                <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem] font-headline">
                  A Safe Space to Talk and Grow
                </h1>
                <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl mt-4">
                  YouthMind AI is a next-generation mental wellness platform providing intelligent, confidential support for adolescents.
                </p>
                <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                  <Button asChild size="lg" className="group">
                    <Link href="/signup">
                      Start Your Journey
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
                    className="rounded-xl object-cover aspect-[3/2] overflow-hidden"
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
                  Core Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Built for Modern Mental Wellness
                </h2>
                <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform integrates cutting-edge AI with a multi-layer safety framework to provide effective and secure support.
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
          © {new Date().getFullYear()} YouthMind AI. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
