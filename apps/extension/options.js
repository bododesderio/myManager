const apiBaseUrlEl = document.getElementById('apiBaseUrl');
const tokenEl = document.getElementById('token');
const workspaceIdEl = document.getElementById('workspaceId');
const saveBtn = document.getElementById('saveBtn');
const messageEl = document.getElementById('message');

async function load() {
  const data = await chrome.storage.sync.get(['apiBaseUrl', 'token', 'workspaceId']);
  apiBaseUrlEl.value = data.apiBaseUrl ?? '';
  tokenEl.value = data.token ?? '';
  workspaceIdEl.value = data.workspaceId ?? '';
}

saveBtn.addEventListener('click', async () => {
  await chrome.storage.sync.set({
    apiBaseUrl: apiBaseUrlEl.value.trim().replace(/\/$/, ''),
    token: tokenEl.value.trim(),
    workspaceId: workspaceIdEl.value.trim(),
  });
  messageEl.textContent = 'Saved ✓';
  messageEl.className = 'success';
  setTimeout(() => (messageEl.textContent = ''), 2000);
});

load();
