function initColorTheme() {
  const root = document.documentElement;
  const previewBg = document.getElementById('previewBackground');
  const previewBtn = document.getElementById('previewButton');

  const themeRadios = document.querySelectorAll('input[name="theme"]');
  const accentRadios = document.querySelectorAll('input[name="accentPreset"]');

  const bgColorPicker = document.getElementById('bgColorPicker');
  const textColorPicker = document.getElementById('textColorPicker');
  const accentColorPicker = document.getElementById('accentColorPicker');
  const resetBtn = document.getElementById('resetThemeBtn');
  const customContainer = document.getElementById('customColorContainer');

  // Load saved settings
  const saved = JSON.parse(localStorage.getItem('themeSettings')) || {};

  function applyTheme(settings) {
    if (settings.theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
      root.style.setProperty('--bg-color', '#fff');
      root.style.setProperty('--text-color', '#000');
    } else if (settings.theme === 'dark') {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      root.style.setProperty('--bg-color', '#222');
      root.style.setProperty('--text-color', '#eee');
    } else if (settings.theme === 'custom') {
      document.body.classList.remove('light-theme', 'dark-theme');
      root.style.setProperty('--bg-color', settings.bg || '#ffffff');
      root.style.setProperty('--text-color', settings.text || '#000000');
    }

    root.style.setProperty('--accent-color', settings.accent || '#3498db');
    root.style.setProperty('--accent-color-dark', darkenColor(settings.accent || '#3498db'));

    // Update preview
    previewBg.style.backgroundColor = getComputedStyle(root).getPropertyValue('--bg-color');
    previewBtn.style.backgroundColor = getComputedStyle(root).getPropertyValue('--accent-color');
    previewBtn.style.color = getComputedStyle(root).getPropertyValue('--text-color');

    // Update main section buttons text color
    updateMainButtonsColor();
  }

  // New function to update main buttons' text color dynamically
  function updateMainButtonsColor() {
    const btnIds = ['btnTheme', 'btnUserMgmt', 'btnBackup'];
    btnIds.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.style.color = getComputedStyle(root).getPropertyValue('--text-color').trim();
      }
    });
  }

  function saveTheme() {
    const selectedTheme = document.querySelector('input[name="theme"]:checked')?.value;
    const selectedAccent = document.querySelector('input[name="accentPreset"]:checked')?.value || accentColorPicker.value;

    const settings = {
      theme: selectedTheme,
      accent: selectedAccent,
      bg: bgColorPicker.value,
      text: textColorPicker.value
    };
    localStorage.setItem('themeSettings', JSON.stringify(settings));
    applyTheme(settings);
  }

  themeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const theme = radio.value;
      customContainer.style.display = theme === 'custom' ? 'block' : 'none';
      saveTheme();
    });
  });

  accentRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      accentColorPicker.value = radio.value;
      saveTheme();
    });
  });

  [bgColorPicker, textColorPicker, accentColorPicker].forEach(picker => {
    picker.addEventListener('input', () => {
      // Clear accent preset selection if user chooses custom
      if (picker === accentColorPicker) {
        document.querySelectorAll('input[name="accentPreset"]').forEach(r => r.checked = false);
      }
      saveTheme();
    });
  });

  resetBtn.addEventListener('click', () => {
    localStorage.removeItem('themeSettings');
    document.getElementById('themeLight').checked = true;
    accentColorPicker.value = '#3498db';
    bgColorPicker.value = '#ffffff';
    textColorPicker.value = '#000000';
    accentRadios[0].checked = true;
    customContainer.style.display = 'none';
    saveTheme();
  });

  // Apply saved theme
  if (saved.theme) {
    document.getElementById(`theme${capitalize(saved.theme)}`)?.click();
    if (saved.accent) {
      document.querySelector(`input[name="accentPreset"][value="${saved.accent}"]`)?.click();
      accentColorPicker.value = saved.accent;
    }
    bgColorPicker.value = saved.bg || '#ffffff';
    textColorPicker.value = saved.text || '#000000';
    applyTheme(saved);
  } else {
    document.getElementById('themeLight').checked = true;
    saveTheme();
  }

  // Utility to darken a hex color
  function darkenColor(hex) {
    const amt = -30;
    let [r, g, b] = hex.match(/\w\w/g).map(x => Math.max(0, Math.min(255, parseInt(x, 16) + amt)));
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
