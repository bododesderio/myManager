const captionEl = document.getElementById('caption');
const charCountEl = document.getElementById('charCount');
const saveBtn = document.getElementById('saveBtn');
const messageEl = document.getElementById('message');
const optionsLink = document.getElementById('optionsLink');

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.title) {
    captionEl.value = `${tab.title}\n\n${tab.url}`;
    charCountEl.textContent = String(captionEl.value.length);
  }
}

captionEl.addEventListener('input', () => {
  charCountEl.textContent = String(captionEl.value.length);
});

optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

saveBtn.addEventListener('click', async () => {
  saveBtn.disabled = true;
  messageEl.textContent = '';
  messageEl.className = '';

  const { apiBaseUrl, token, workspaceId } = await chrome.storage.sync.get([
    'apiBaseUrl',
    'token',
    'workspaceId',
  ]);

  if (!apiBaseUrl || !token || !workspaceId) {
    messageEl.textContent = 'Open Settings to configure your API URL, token, and workspace.';
    messageEl.className = 'error';
    saveBtn.disabled = false;
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
        caption: captionEl.value,
        status: 'draft',
        platforms: [],
        contentType: 'text',
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${res.status}`);
    }
    messageEl.textContent = 'Saved as draft ✓';
    messageEl.className = 'success';
    captionEl.value = '';
    charCountEl.textContent = '0';
  } catch (err) {
    messageEl.textContent = err.message;
    messageEl.className = 'error';
  } finally {
    saveBtn.disabled = false;
  }
});

init();
