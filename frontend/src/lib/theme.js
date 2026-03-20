'use client'

export const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'

  const storedTheme = localStorage.getItem('theme')
  if (storedTheme) return storedTheme

  const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return userPrefersDark ? 'dark' : 'light'
}

export const setThemeOnHtml = (theme) => {
  if (typeof window === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}
