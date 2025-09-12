import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, Bot, BrainCircuit, Heart, Mic, AreaChart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image');

  const features = [
    {
      icon: <Bot className="w-8 h-8 text-primary" />,
      title: 'AI-Driven Conversation',
      description: 'Engage in empathetic conversations with our fine-tuned AI, available 24/7.',
    },
    {
      icon: <Heart className="w-8 h-8 text-primary" />,
      title: 'Contextual Mood Assessment',
      description: 'Our AI understands the nuances of your emotional state to provide better support.',
    },
    {
      icon: <BrainCircuit className="w-8 h-8 text-primary" />,
      title: 'Personalized Coping Strategies',
      description: 'Receive AI-generated strategies tailored to your mood and conversation history.',
    },
    {
      icon: <Mic className="w-8 h-8 text-primary" />,
      title: 'Voice-to-Voice Chat',
      description: 'Interact naturally with real-time voice conversations for a more personal connection.',
    },
    {
      icon: <AreaChart className="w-8 h-8 text-primary" />,
      title: 'Progress Tracking',
      description: 'Visualize your mood trends and review your encrypted conversation history on your private dashboard.',
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
      title: 'Secure & Private',
      description: 'Your data is protected with secure authentication and end-to-end encryption.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <Link href="/" className="flex items-center justify-center">
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
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
                  A new era of mental wellness, powered by AI
                </h1>
                <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl mt-4">
                  SEISTA AI is your personal, empathetic companion for navigating life's emotional landscape.
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
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Designed for Your Well-being
                </h2>
                <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to understand your emotions and build resilience, in one private space.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 mt-12">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
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
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-foreground/60">
          © {new Date().getFullYear()} SEISTA AI. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
