import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link } from '@inertiajs/react'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Mail,
  Newspaper,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  UsersRound,
} from 'lucide-react'
import { PublicLayout } from '@/components/layouts/public'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HStack } from '@/components/ui/hstack'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { Stack } from '@/components/ui/stack'

export default function Home(props: SharedProps) {
  const isLoggedIn = Boolean(props.isLoggedIn)

  return (
    <PublicLayout>
      <Head title='Home' />

      <section className='relative overflow-hidden'>
        <div className='absolute inset-0 -z-10 bg-gradient-to-b from-primary/15 via-background to-background' />
        <div className='pointer-events-none absolute -top-24 left-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl' />
        <div className='pointer-events-none absolute -top-36 -left-24 -z-10 h-[360px] w-[360px] rounded-full bg-accent/20 blur-3xl' />

        <div className='max-w-screen-xl mx-auto px-6 py-14 sm:py-20'>
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={10} className='lg:items-center'>
            <Stack spacing={6}>
              <HStack spacing={2} wrap>
                <Badge variant='secondary' className='gap-1'>
                  <Sparkles className='h-3.5 w-3.5' />
                  Starter template
                </Badge>
                <Badge variant='outline'>AdonisJS + Inertia + React</Badge>
                <Badge variant='outline'>shadcn/ui (base-ui)</Badge>
              </HStack>

              <h1 className='text-4xl font-bold tracking-tight sm:text-5xl'>
                Ship faster with a production-ready foundation
              </h1>
              <p className='text-muted-foreground text-base sm:text-lg max-w-2xl'>
                Auth, teams, notifications, auditing, 2FA, and a blog — wired up with clean UI
                components and sensible defaults so you can focus on your product.
              </p>

              <HStack spacing={3} className='flex-col sm:flex-row sm:items-center'>
                {isLoggedIn ? (
                  <>
                    <Button size='lg' leftIcon={<ShieldCheck className='h-4 w-4' />} asChild>
                      <Link href='/dashboard'>Open dashboard</Link>
                    </Button>
                    <Button
                      size='lg'
                      variant='outline'
                      leftIcon={<Newspaper className='h-4 w-4' />}
                      asChild>
                      <Link href='/blog'>Read the blog</Link>
                    </Button>
                  </>
                ) : (
                  <Button size='lg' rightIcon={<ArrowRight className='h-4 w-4' />} asChild>
                    <Link href='/login'>Sign in</Link>
                  </Button>
                )}
              </HStack>

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={4} className='pt-2'>
                <Stat label='Security-first' value='2FA + sessions' />
                <Stat label='Team-ready' value='Invites + roles' />
                <Stat label='Admin tools' value='Blog + users' />
              </SimpleGrid>
            </Stack>

            <div className='relative'>
              <Card className='overflow-hidden'>
                <CardHeader className='pb-3'>
                  <HStack justify='between' align='center'>
                    <Stack spacing={0.5}>
                      <CardTitle className='text-base'>Preview</CardTitle>
                      <CardDescription>What you get out of the box.</CardDescription>
                    </Stack>
                    <Badge variant='secondary' className='gap-1'>
                      <Rocket className='h-3.5 w-3.5' />
                      Ready
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardContent>
                  <Stack spacing={4}>
                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={3}>
                      <MiniMetric title='Users' value='1,284' icon={<Users className='h-4 w-4' />} />
                      <MiniMetric
                        title='Teams'
                        value='86'
                        icon={<UsersRound className='h-4 w-4' />}
                      />
                      <MiniMetric
                        title='Activity'
                        value='9.3k'
                        icon={<Activity className='h-4 w-4' />}
                      />
                    </SimpleGrid>

                    <div className='rounded-lg border border-border bg-muted/30 p-4'>
                      <Stack spacing={3}>
                        <HStack spacing={2} wrap>
                          <Badge variant='outline'>Email verification</Badge>
                          <Badge variant='outline'>2FA</Badge>
                          <Badge variant='outline'>Audits</Badge>
                          <Badge variant='outline'>Notifications</Badge>
                        </HStack>
                        <Stack spacing={2}>
                          <LineItem title='Invite teammates to your workspace' />
                          <LineItem title='Track sessions and revoke access' />
                          <LineItem title='Publish blog posts with tags & authors' />
                        </Stack>
                      </Stack>
                    </div>
                  </Stack>
                </CardContent>
              </Card>
              <div className='pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl' />
            </div>
          </SimpleGrid>
        </div>
      </section>

      <section className='max-w-screen-xl mx-auto px-6 pb-6 sm:pb-10'>
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <FeatureCard
            icon={<ShieldCheck className='h-4 w-4' />}
            title='Security by default'
            description='Email verification, sessions, and 2FA built-in.'
            bullets={['Password reset', 'Session revoke', 'Two-factor auth']}
          />
          <FeatureCard
            icon={<UsersRound className='h-4 w-4' />}
            title='Teams that ship'
            description='Create teams, invite members, accept via join page.'
            bullets={['Invites by email', 'Owner/member roles', 'Member directory']}
          />
          <FeatureCard
            icon={<Newspaper className='h-4 w-4' />}
            title='Blog system'
            description='Posts with cover, tags, category, and dedicated authors.'
            bullets={['Admin CRUD', 'Slugify', 'Public blog pages']}
          />
          <FeatureCard
            icon={<Activity className='h-4 w-4' />}
            title='Auditing & activity'
            description='Track important actions for security and compliance.'
            bullets={['Audits table', 'Admin user activity', 'IP/user-agent capture']}
          />
          <FeatureCard
            icon={<Sparkles className='h-4 w-4' />}
            title='Clean UI primitives'
            description='shadcn/ui components for fast, consistent UI.'
            bullets={['Reusable Button', 'Dialogs & popovers', 'Data tables']}
          />
          <FeatureCard
            icon={<Mail className='h-4 w-4' />}
            title='Contact'
            description='A contact form that posts to the API and sends email.'
            bullets={['Contact page', 'Validation', 'Email notification']}
          />
        </SimpleGrid>
      </section>

      <section className='max-w-screen-xl mx-auto px-6 pb-16'>
        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing={6}>
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
              <CardDescription>Everything important, one click away.</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={3}>
                <Button variant='outline' leftIcon={<Newspaper className='h-4 w-4' />} asChild>
                  <Link href='/blog'>Blog</Link>
                </Button>
                <Button variant='outline' leftIcon={<Mail className='h-4 w-4' />} asChild>
                  <Link href='/contact'>Contact</Link>
                </Button>
                {isLoggedIn ? (
                  <Button variant='outline' asChild>
                    <Link href='/settings'>Settings</Link>
                  </Button>
                ) : (
                  <Button variant='outline' asChild>
                    <Link href='/login'>Sign in</Link>
                  </Button>
                )}
              </SimpleGrid>
            </CardContent>
          </Card>

          <Card className='relative overflow-hidden'>
            <div className='pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl' />
            <CardHeader>
              <CardTitle>Production-ready</CardTitle>
              <CardDescription>Start with real features, then customize.</CardDescription>
            </CardHeader>
            <CardContent>
              <Stack spacing={3} className='text-sm text-muted-foreground'>
                <ChecklistItem>Auth + email verification</ChecklistItem>
                <ChecklistItem>Teams + invitations</ChecklistItem>
                <ChecklistItem>In-app notifications</ChecklistItem>
                <ChecklistItem>Auditing</ChecklistItem>
                <ChecklistItem>Two-factor auth</ChecklistItem>
                <ChecklistItem>Blog + admin portal</ChecklistItem>
                <div className='pt-2'>
                  <Button className='w-full' asChild rightIcon={<ArrowRight className='h-4 w-4' />}>
                    <Link href={isLoggedIn ? '/blog/manage' : '/login'}>Manage blog</Link>
                  </Button>
                </div>
              </Stack>
            </CardContent>
          </Card>
        </SimpleGrid>

        <div className='mt-10'>
          <Card className='overflow-hidden'>
            <div className='relative'>
              <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-background to-accent/10' />
              <CardContent className='relative p-8 sm:p-10'>
                <HStack
                  spacing={6}
                  justify='between'
                  align='center'
                  className='flex-col lg:flex-row'>
                  <Stack spacing={2}>
                    <div className='text-2xl font-bold tracking-tight'>Ready to build?</div>
                    <div className='text-muted-foreground'>
                      Start with the full stack — then ship your product faster.
                    </div>
                  </Stack>
                  <HStack spacing={3} className='flex-col sm:flex-row'>
                    {isLoggedIn ? (
                      <Button size='lg' asChild rightIcon={<ArrowRight className='h-4 w-4' />}>
                        <Link href='/dashboard'>Open dashboard</Link>
                      </Button>
                    ) : (
                      <Button size='lg' asChild rightIcon={<ArrowRight className='h-4 w-4' />}>
                        <Link href='/login'>Sign in</Link>
                      </Button>
                    )}
                  </HStack>
                </HStack>
              </CardContent>
            </div>
          </Card>
        </div>
      </section>
    </PublicLayout>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-lg border border-border bg-card p-4'>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='mt-1 font-semibold'>{value}</div>
    </div>
  )
}

function MiniMetric({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className='rounded-lg border border-border bg-card p-3'>
      <HStack justify='between' align='center'>
        <div className='text-xs text-muted-foreground'>{title}</div>
        <div className='text-muted-foreground'>{icon}</div>
      </HStack>
      <div className='mt-2 text-lg font-semibold'>{value}</div>
    </div>
  )
}

function LineItem({ title }: { title: string }) {
  return (
    <HStack spacing={2} align='start' className='text-sm'>
      <CheckCircle2 className='h-4 w-4 text-primary mt-0.5 shrink-0' />
      <span className='text-muted-foreground'>{title}</span>
    </HStack>
  )
}

function ChecklistItem({ children }: { children: string }) {
  return (
    <HStack spacing={2} align='start'>
      <CheckCircle2 className='h-4 w-4 text-primary mt-0.5 shrink-0' />
      <span>{children}</span>
    </HStack>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  bullets,
}: {
  icon: React.ReactNode
  title: string
  description: string
  bullets: string[]
}) {
  return (
    <Card className='h-full'>
      <CardHeader>
        <Stack spacing={2}>
          <HStack spacing={2} align='center'>
            <span className='text-primary'>{icon}</span>
            <CardTitle className='text-base'>{title}</CardTitle>
          </HStack>
          <CardDescription>{description}</CardDescription>
        </Stack>
      </CardHeader>
      <CardContent>
        <Stack spacing={2} className='text-sm text-muted-foreground'>
          {bullets.map((b) => (
            <HStack key={b} spacing={2} align='start'>
              <span className='mt-2 h-1 w-1 rounded-full bg-muted-foreground/60' />
              <span>{b}</span>
            </HStack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
