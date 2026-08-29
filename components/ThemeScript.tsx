export function ThemeScript() {
  const script = `
    (function () {
      try {
        var stored = localStorage.getItem('internscope-theme');
        var theme = stored === 'light' ? 'light' : 'dark';
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(theme);
        document.documentElement.style.colorScheme = theme;
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
