interface ExportData {
  version: string;
  exportedAt: string;
  conversations: unknown[];
  settings: unknown;
  bookmarks: string[];
}

export function exportAllData(): ExportData {
  const data: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    conversations: [],
    settings: {},
    bookmarks: [],
  };

  // Gather all localStorage data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key === 'bookmarks') {
      try {
        data.bookmarks = JSON.parse(localStorage.getItem(key) ?? '[]');
      } catch { /* skip */ }
    }
    if (key.startsWith('draft:')) {
      // Include drafts
    }
  }

  // Get settings from appStore
  try {
    const settingsStr = localStorage.getItem('app-settings');
    if (settingsStr) data.settings = JSON.parse(settingsStr);
  } catch { /* skip */ }

  return data;
}

export function generateExportBlob(data: ExportData): Blob {
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

export function downloadExport(data: ExportData): void {
  const blob = generateExportBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nativz-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(json: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(json) as ExportData;
    if (!data.version || !data.exportedAt) {
      return { success: false, message: 'Invalid export file format.' };
    }

    // Import bookmarks (merge)
    if (data.bookmarks && Array.isArray(data.bookmarks)) {
      const existing = JSON.parse(localStorage.getItem('bookmarks') ?? '[]');
      const merged = [...new Set([...existing, ...data.bookmarks])];
      localStorage.setItem('bookmarks', JSON.stringify(merged));
    }

    return { success: true, message: `Imported data from ${new Date(data.exportedAt).toLocaleDateString()}.` };
  } catch {
    return { success: false, message: 'Failed to parse import file.' };
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
