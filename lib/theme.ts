type Theme = 'light' | 'dark' | 'system';

export function getSystemTheme(): Theme {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export async function getTheme(): Promise<Theme> {
  const result = await chrome.storage.local.get('theme');
  return result.theme || 'system';
}

export async function setTheme(theme: Theme): Promise<void> {
  await chrome.storage.local.set({ theme });
  applyTheme(theme);
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const systemTheme = getSystemTheme();
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// 监听系统主题变化
export function watchSystemTheme(): void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  mediaQuery.addEventListener('change', async () => {
    const currentTheme = await getTheme();
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  });
}