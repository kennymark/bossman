// Helper function to merge styles
export const mergeStyles = (baseStyle: React.CSSProperties, customStyle?: React.CSSProperties) => ({
  ...baseStyle,
  ...customStyle,
})

export const colors = {
  background: {
    white: '#ffffff',
    secondary: '#f8fafc',
  },
  text: {
    primary: '#181818',
    secondary: '#64748b',
  },
  link: {
    primary: '#1d489e',
  },
  border: {
    primary: '#e2e8f0',
  },
  footer: {
    background: '#fefefe',
    text: '#202020',
    width: '100%',
  },
}

// Base styles
export const baseStyles = {
  body: {
    fontFamily:
      '"Plus Jakarta Sans",system-ui, -apple-system, BlinkMacSystemFont, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    backgroundColor: colors.background.white,
  },
  baseContainer: {
    margin: '0 auto',
    maxWidth: '960px',
    padding: '30px 18px',
    backgroundColor: colors.background.white,
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  },

  heading: {
    fontSize: '20px',
    lineHeight: '25px',
    fontWeight: '800',
    marginBottom: '20px',
    color: colors.text.primary,
  },

  subheading: {
    fontSize: '18px',
    lineHeight: '25px',
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: '20px',
  },

  text: {
    fontSize: '16px',
    lineHeight: '25px',
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: '20px',
  },
  link: {
    color: colors.link.primary,
    fontSize: '16px',
    lineHeight: '25.2px',
    fontWeight: '500',
    textDecoration: 'underline',
  },
  button: {
    backgroundColor: colors.link.primary,
    color: colors.background.white,
    padding: '10px 20px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  hr: {
    borderColor: colors.border.primary,
    margin: '20px 0',
  },
  list: {
    paddingLeft: '20px',
    marginBottom: '16px',
  },
  listItem: {
    marginBottom: '8px',
    fontSize: '16px',
    lineHeight: '25.2px',
    fontWeight: '500',
    color: colors.text.primary,
  },
  image: {
    maxWidth: '100%',
    height: 'auto',
    marginBottom: '16px',
  },
  section: {
    margin: '20px 0',
  },
  column: {
    padding: '0 10px',
  },
}

// Footer component
export const footerStyles = {
  footer: {
    backgroundColor: colors.footer.background,
    marginTop: '57px',
    margin: '0px auto',
    width: '100%',
  },
  container: {
    padding: '24px',
    maxWidth: '100%',
    margin: '0px auto',
  },
  text: {
    color: colors.footer.text,
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '18.2px',
    margin: '0px',
    marginBottom: '0px',
  },
  link: {
    color: colors.footer.text,
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '18.2px',
  },
}

export const baseTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

export const baseHeaderStyle: React.CSSProperties = {
  backgroundColor: colors.background.secondary,
  padding: '12px',
  textAlign: 'left',
  fontSize: '14px',
  fontWeight: '600',
  color: colors.text.secondary,
  borderBottom: `1px solid ${colors.border.primary}`,
}

export const baseCellStyle: React.CSSProperties = {
  padding: '12px',
  fontSize: '14px',
  color: colors.text.primary,
  borderBottom: `1px solid ${colors.border.primary}`,
}
