import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

interface AppCardProps {
  title: string
  description: string
  children: React.ReactNode
  className?: string

}
export function AppCard({ title, description, children, className, }: AppCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={className}>{children}</CardContent>
    </Card>
  )
}
