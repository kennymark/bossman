import { IconDeviceDesktop, IconDeviceMobile, IconDeviceTablet } from '@tabler/icons-react'

export interface DeviceIconProps {
  deviceType: string | null
  className?: string
}

/** Renders an icon for device type (mobile, tablet, or default desktop). */
export function DeviceIcon({ deviceType, className }: DeviceIconProps) {
  switch (deviceType) {
    case 'mobile':
      return <IconDeviceMobile className={className ?? 'h-4 w-4'} />
    case 'tablet':
      return <IconDeviceTablet className={className ?? 'h-4 w-4'} />
    default:
      return <IconDeviceDesktop className={className ?? 'h-4 w-4'} />
  }
}
