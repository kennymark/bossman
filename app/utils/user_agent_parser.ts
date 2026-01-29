/**
 * Simple user agent parser to extract browser, OS, and device type
 */
export function parseUserAgent(userAgent: string | null): {
  browser: string | null
  os: string | null
  deviceType: string | null
} {
  if (!userAgent) {
    return { browser: null, os: null, deviceType: null }
  }

  const ua = userAgent.toLowerCase()

  // Detect browser
  let browser: string | null = null
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome'
  } else if (ua.includes('firefox')) {
    browser = 'Firefox'
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari'
  } else if (ua.includes('edg')) {
    browser = 'Edge'
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera'
  } else if (ua.includes('msie') || ua.includes('trident')) {
    browser = 'Internet Explorer'
  }

  // Detect OS
  let os: string | null = null
  if (ua.includes('windows')) {
    os = 'Windows'
  } else if (ua.includes('mac os') || ua.includes('macos')) {
    os = 'macOS'
  } else if (ua.includes('linux')) {
    os = 'Linux'
  } else if (ua.includes('android')) {
    os = 'Android'
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS'
  }

  // Detect device type
  let deviceType: string | null = null
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'mobile'
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet'
  } else {
    deviceType = 'desktop'
  }

  return { browser, os, deviceType }
}
