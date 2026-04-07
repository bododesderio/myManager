// Service worker: context menu + storage helpers

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-selection-to-mymanager',
    title: 'Save selection to myManager',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'save-page-to-mymanager',
    title: 'Save page to myManager',
    contexts: ['page'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  const text = info.selectionText || tab.title || '';
  const url = info.pageUrl || tab.url || '';
  await saveDraft({ text, url });
});

async function saveDraft({ text, url }) {
  const { apiBaseUrl, token, workspaceId } = await chrome.storage.sync.get([
    'apiBaseUrl',
    'token',
    'workspaceId',
  ]);
  if (!apiBaseUrl || !token || !workspaceId) {
    chrome.runtime.openOptionsPage();
    return;
  }
  try {
    const res = await fetch(`${apiBaseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        workspaceId,
        caption: text + (url ? `\n\n${url}` : ''),
        status: 'draft',
        platforms: [],
        contentType: 'text',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    chrome.notifications?.create?.({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'myManager',
      message: 'Saved as draft',
    });
  } catch (err) {
    console.error('myManager save failed', err);
    chrome.notifications?.create?.({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'myManager',
      message: `Save failed: ${err.message}`,
    });
  }
}
