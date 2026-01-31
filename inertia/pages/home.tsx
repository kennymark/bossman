import type { SharedProps } from '@adonisjs/inertia/types'
import { Head, Link } from '@inertiajs/react'
import {
  ArrowRight,
  Bell,
  Building2,
  Database,
  FileText,
  Layers,
  LayoutDashboard,
  Newspaper,
  Settings,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { PublicLayout } from '@/components/layouts/public'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HStack } from '@/components/ui/hstack'
import { SimpleGrid } from '@/components/ui/simplegrid'
import { Stack } from '@/components/ui/stack'

export default function Home(props: SharedProps) {
  const isLoggedIn = Boolean(props.isLoggedIn)

  return (
    <PublicLayout>
      <Head title='Togetha Admin' />

      <section className='relative overflow-hidden'>
        <div className='absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background' />
        <div className='pointer-events-none absolute -top-24 left-1/2 -z-10 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl' />
        <div className='pointer-events-none absolute -top-32 -left-20 -z-10 h-[320px] w-[320px] rounded-full bg-accent/15 blur-3xl' />

        <div className='max-w-screen-xl mx-auto px-6 py-14 sm:py-20'>
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={10} className='lg:items-center'>
            <Stack spacing={6}>
              <h1 className='text-4xl font-bold tracking-tight sm:text-5xl'>Togetha Admin</h1>
              <p className='text-muted-foreground text-base sm:text-lg max-w-xl'>
                The admin app for Togetha. Manage customers, leases, properties, teams, push
                notifications, backups, and more from one place.
              </p>

              <HStack spacing={3} className='flex-col sm:flex-row sm:items-center'>
                {isLoggedIn ? (
                  <Button size='lg' rightIcon={<ArrowRight className='h-4 w-4' />} asChild>
                    <Link href='/dashboard'>Open dashboard</Link>
                  </Button>
                ) : (
                  <Button size='lg' rightIcon={<ArrowRight className='h-4 w-4' />} asChild>
                    <Link href='/login'>Sign in</Link>
                  </Button>
                )}
                <Button size='lg' variant='outline' asChild>
                  <a href='https://togetha.co.uk' target='_blank' rel='noopener noreferrer'>
                    togetha.co.uk
                  </a>
                </Button>
              </HStack>

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={4} className='pt-2'>
                <Stat label='Dashboard' value='Analytics & activity' />
                <Stat label='Customers & orgs' value='Leases & properties' />
                <Stat label='Teams & blog' value='Push & backups' />
              </SimpleGrid>
            </Stack>

            <div className='relative'>
              <Card className='overflow-hidden'>
                <CardHeader className='pb-3'>
                  <Stack spacing={0.5}>
                    <CardTitle className='text-base'>What you can do</CardTitle>
                    <CardDescription>Core admin features in one app.</CardDescription>
                  </Stack>
                </CardHeader>
                <CardContent>
                  <Stack spacing={4}>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={3}>
                      <MiniLink
                        href='/dashboard'
                        title='Dashboard'
                        description='Stats, charts, recent activity'
                        icon={<LayoutDashboard className='h-4 w-4' />}
                      />
                      <MiniLink
                        href='/orgs'
                        title='Customers'
                        description='Orgs, leases, properties'
                        icon={<Building2 className='h-4 w-4' />}
                      />
                      <MiniLink
                        href='/leases'
                        title='Leases'
                        description='Payments & activity'
                        icon={<FileText className='h-4 w-4' />}
                      />
                      <MiniLink
                        href='/properties'
                        title='Properties'
                        description='Leaseable entities'
                        icon={<Layers className='h-4 w-4' />}
                      />
                      <MiniLink
                        href='/teams'
                        title='Teams'
                        description='Members & invitations'
                        icon={<UsersRound className='h-4 w-4' />}
                      />
                      <MiniLink
                        href='/push-notifications'
                        title='Push notifications'
                        description='OneSignal, schedule or now'
                        icon={<Bell className='h-4 w-4' />}
                      />
                      <MiniLink
                        href='/db-backups'
                        title='Backups'
                        description='Database backup history'
                        icon={<Database className='h-4 w-4' />}
                      />
                      <MiniLink
                        href='/blog/manage'
                        title='Blog'
                        description='Posts, categories, tags'
                        icon={<Newspaper className='h-4 w-4' />}
                      />
                    </SimpleGrid>
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
            icon={<LayoutDashboard className='h-4 w-4' />}
            title='Dashboard'
            description='Overview of users, tenancies, and activity with growth charts.'
            bullets={['Stats & metrics', 'Growth charts', 'Recent activity']}
          />
          <FeatureCard
            icon={<Building2 className='h-4 w-4' />}
            title='Customers & orgs'
            description='Manage organisations with multi-step creation and detail views.'
            bullets={['Org list & create', 'Leases & properties', 'Activity tabs']}
          />
          <FeatureCard
            icon={<FileText className='h-4 w-4' />}
            title='Leases & properties'
            description='Leases with payments and activity; properties with leases.'
            bullets={['Lease detail tabs', 'Payments', 'Leaseable entities']}
          />
          <FeatureCard
            icon={<UsersRound className='h-4 w-4' />}
            title='Teams'
            description='Team management and invitations with join flow.'
            bullets={['Invites by email', 'Roles', 'Member directory']}
          />
          <FeatureCard
            icon={<Bell className='h-4 w-4' />}
            title='Push notifications'
            description='Send push notifications via OneSignal to Togetha users.'
            bullets={['Target by role', 'Schedule or send now', 'Title, description, image']}
          />
          <FeatureCard
            icon={<ShieldCheck className='h-4 w-4' />}
            title='Security & settings'
            description='Auth, 2FA, sessions, and account settings.'
            bullets={['Two-factor auth', 'Sessions', 'Profile & password']}
          />
        </SimpleGrid>
      </section>

      <section className='max-w-screen-xl mx-auto px-6 pb-16'>
        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing={6}>
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
              <CardDescription>Jump to the main areas of the admin.</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={3}>
                <Button
                  variant='outline'
                  leftIcon={<LayoutDashboard className='h-4 w-4' />}
                  asChild>
                  <Link href='/dashboard'>Dashboard</Link>
                </Button>
                <Button variant='outline' leftIcon={<Building2 className='h-4 w-4' />} asChild>
                  <Link href='/orgs'>Customers</Link>
                </Button>
                <Button variant='outline' leftIcon={<Newspaper className='h-4 w-4' />} asChild>
                  <Link href='/blog'>Blog</Link>
                </Button>
                {isLoggedIn ? (
                  <Button variant='outline' leftIcon={<Settings className='h-4 w-4' />} asChild>
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
              <CardTitle>Togetha</CardTitle>
              <CardDescription>Visit the main product.</CardDescription>
            </CardHeader>
            <CardContent>
              <Stack spacing={3} className='text-sm text-muted-foreground'>
                <p>
                  Togetha Admin is the backend for Togetha — property and tenancy management for
                  landlords, agencies, and tenants.
                </p>
                <Button className='w-full' asChild rightIcon={<ArrowRight className='h-4 w-4' />}>
                  <a href='https://togetha.co.uk' target='_blank' rel='noopener noreferrer'>
                    Go to togetha.co.uk
                  </a>
                </Button>
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
                    <div className='text-2xl font-bold tracking-tight'>
                      {isLoggedIn ? 'Back to work' : 'Ready to sign in?'}
                    </div>
                    <div className='text-muted-foreground'>
                      {isLoggedIn
                        ? 'Open the dashboard to manage Togetha.'
                        : 'Sign in to access Togetha Admin.'}
                    </div>
                  </Stack>
                  <Button size='lg' asChild rightIcon={<ArrowRight className='h-4 w-4' />}>
                    <Link href={isLoggedIn ? '/dashboard' : '/login'}>
                      {isLoggedIn ? 'Open dashboard' : 'Sign in'}
                    </Link>
                  </Button>
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

function MiniLink({
  href,
  title,
  description,
  icon,
}: {
  href: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className='flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50'>
      <div className='text-muted-foreground'>{icon}</div>
      <div className='min-w-0'>
        <div className='font-medium text-sm'>{title}</div>
        <div className='text-xs text-muted-foreground truncate'>{description}</div>
      </div>
    </Link>
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
              <span className='mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60' />
              <span>{b}</span>
            </HStack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
