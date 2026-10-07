'use strict';

const adminApi = '/api';
const adminPage = document.querySelector('[data-page="admin"]');
const adminPages = document.querySelectorAll('[data-page]');
const adminNavLinks = document.querySelectorAll('[data-nav-link]');
const adminOpenButton = document.getElementById('admin-open-btn');
const adminLoginForm = document.getElementById('admin-login-form');
const adminLoginSection = document.getElementById('admin-login-section');
const adminLoginStatus = document.getElementById('admin-login-status');
const adminDataStatus = document.getElementById('admin-data-status');
const adminContent = document.getElementById('admin-content');
const adminLogoutButton = document.getElementById('admin-logout-btn');

// Remove the obsolete browser-only gate marker. It never grants access to this panel.
try { localStorage.removeItem('mc_admin_ok'); } catch { /* Storage may be disabled. */ }

let adminUser = null;
let csrfToken = null;
const adminData = {
  profile: null,
  education: [],
  experience: [],
  categories: [],
  projects: [],
  certifications: [],
  awards: [],
  skills: [],
  'site-settings': [],
};
const editingIds = {};
const objectUrls = new WeakMap();

class AdminApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function friendlyApiMessage(status, message) {
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return message || 'This request could not be verified. Refresh the page and try again.';
  if (status === 404) return message || 'The requested record could not be found. Refresh the list and try again.';
  if (status === 400) return message || 'Please check the entered values and try again.';
  if (status === 413) return 'The selected file is too large. Choose a smaller file and try again.';
  if (status >= 500) return 'The server could not save this change. Your entered values are still here; try again.';
  return message || 'The request could not be completed.';
}

function setStatus(element, state, message) {
  if (!element) return;
  element.textContent = message || '';
  element.className = `admin-status${state ? ` is-${state}` : ''}`;
}

function formStatus(form) {
  return form && form.querySelector('[data-form-status]');
}

function listStatus(resource) {
  return document.querySelector(`[data-list-status="${resource}"]`);
}

function updateAdminView() {
  if (adminLoginSection) adminLoginSection.hidden = Boolean(adminUser);
  if (adminContent) adminContent.hidden = !adminUser;
  if (!adminUser) {
    Object.keys(editingIds).forEach((key) => delete editingIds[key]);
  }
}

function openPage(pageName) {
  adminPages.forEach((page) => page.classList.toggle('active', page.dataset.page === pageName));
  adminNavLinks.forEach((link) => link.classList.toggle('active', link.textContent.trim().toLowerCase() === pageName));
  window.scrollTo(0, 0);
}

adminNavLinks.forEach((link) => {
  link.addEventListener('click', () => openPage(link.textContent.trim().toLowerCase()));
});

if (adminOpenButton) adminOpenButton.addEventListener('click', () => openPage('admin'));

function clearSessionView(message = '') {
  adminUser = null;
  csrfToken = null;
  updateAdminView();
  if (message) setStatus(adminLoginStatus, 'error', message);
}

async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  const bodyIsFormData = options.body instanceof FormData;
  if (options.body !== undefined && !bodyIsFormData && typeof options.body !== 'string') {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken && path !== '/auth/login') {
    headers.set('X-CSRF-Token', csrfToken);
  }

  let response;
  try {
    response = await fetch(`${adminApi}${path}`, {
      ...options,
      method,
      headers,
      credentials: 'same-origin',
    });
  } catch {
    throw new AdminApiError(0, 'Could not reach the server. Check that the backend is running and try again.');
  }

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  }
  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/me') {
    clearSessionView(friendlyApiMessage(401));
  }
  if (!response.ok) {
    throw new AdminApiError(response.status, friendlyApiMessage(response.status, payload && payload.error));
  }
  return payload;
}

async function loadAdminData(populateProfile = false) {
  const paths = ['profile', 'education', 'experience', 'categories', 'projects', 'certifications', 'awards', 'skills', 'site-settings'];
  setStatus(adminDataStatus, 'saving', 'Loading database records...');
  const values = await Promise.all(paths.map((path) => apiRequest(`/admin/${path}`)));
  paths.forEach((path, index) => { adminData[path] = values[index]; });
  if (populateProfile) populateForm(document.getElementById('admin-profile-form'), adminData.profile || {});
  renderAllResources();
  renderSiteSettings();
  updateProfileAssets();
  setStatus(adminDataStatus, 'success', 'Database records loaded.');
}

if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus(adminLoginStatus, 'saving', 'Signing in...');
    const submit = adminLoginForm.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      const data = new FormData(adminLoginForm);
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: { username: String(data.get('username') || '').trim(), password: String(data.get('password') || '') },
      });
      csrfToken = result.csrf_token;
      adminUser = result.user;
      adminLoginForm.reset();
      updateAdminView();
      setStatus(adminLoginStatus, 'success', `Signed in as ${adminUser.username}.`);
      try {
        await loadAdminData(true);
      } catch (error) {
        setStatus(adminDataStatus, 'error', `Signed in, but the database records could not be loaded: ${error.message}`);
      }
    } catch (error) {
      setStatus(adminLoginStatus, 'error', error.status === 401 ? 'Invalid username or password.' : (error.message || 'Sign in failed.'));
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

if (adminLogoutButton) {
  adminLogoutButton.addEventListener('click', async () => {
    adminLogoutButton.disabled = true;
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      clearSessionView('You have been signed out.');
      openPage('admin');
    } catch (error) {
      setStatus(listStatus('site-settings'), 'error', error.message);
    } finally {
      adminLogoutButton.disabled = false;
    }
  });
}

async function checkExistingSession() {
  try {
    const result = await apiRequest('/auth/me');
    if (!result.authenticated) return clearSessionView();
    adminUser = result.user;
    csrfToken = result.csrf_token;
    updateAdminView();
    await loadAdminData(true);
  } catch (error) {
    if (error.status !== 401) setStatus(adminLoginStatus, 'error', error.message);
  }
}

function addText(parent, tag, text, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text == null ? '' : String(text);
  parent.appendChild(element);
  return element;
}

function safeAssetUrl(storedPath) {
  if (typeof storedPath !== 'string' || !storedPath) return null;
  const normalized = storedPath.replace(/\\/g, '/');
  if (normalized.startsWith('uploads/')) {
    if (/^uploads\/(projects|certificates|awards|profile|cv)\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf)$/i.test(normalized)) return `/${normalized}`;
    return null;
  }
  if (/^(\.\/)?assets\/[a-zA-Z0-9_./-]+$/.test(normalized) && !normalized.includes('..')) return normalized;
  return null;
}

function showAsset(container, storedPath, label, kind = 'image') {
  if (!container) return;
  container.replaceChildren();
  const url = safeAssetUrl(storedPath);
  if (!url) {
    if (storedPath) addText(container, 'span', 'Stored path is not previewable here.', 'admin-muted');
    return;
  }
  addText(container, 'span', label, 'admin-muted');
  if (kind === 'pdf') {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open current CV';
    container.appendChild(link);
  } else {
    const image = document.createElement('img');
    image.src = url;
    image.alt = label;
    image.loading = 'lazy';
    image.className = 'admin-image-preview';
    container.appendChild(image);
  }
}

function updateProfileAssets() {
  const profile = adminData.profile || {};
  showAsset(document.getElementById('admin-profile-image-current'), profile.profile_image_path, 'Current profile image');
  showAsset(document.getElementById('admin-cv-current'), profile.cv_file_path, 'Current CV', 'pdf');
}

function populateForm(form, record) {
  if (!form) return;
  for (const [key, value] of Object.entries(record)) {
    const field = form.elements.namedItem(key);
    if (!field || field.type === 'file') continue;
    if (key === 'technologies' && Array.isArray(value)) field.value = value.join(', ');
    else field.value = value == null ? '' : value;
  }
}

const resourceConfig = {
  education: { endpoint: 'education', list: 'admin-education-list', title: (r) => r.degree, summary: (r) => `${r.institution}${r.start_date || r.end_date ? ` • ${r.start_date || ''} – ${r.end_date || ''}` : ''}`, fields: ['degree', 'institution', 'start_date', 'end_date', 'description', 'display_order'] },
  experience: { endpoint: 'experience', list: 'admin-experience-list', title: (r) => r.position, summary: (r) => `${r.company}${r.start_date || r.end_date ? ` • ${r.start_date || ''} – ${r.end_date || ''}` : ''}`, fields: ['company', 'position', 'start_date', 'end_date', 'description', 'display_order'] },
  categories: { endpoint: 'categories', list: 'admin-categories-list', title: (r) => r.name, summary: (r) => `Display order: ${r.display_order || 0}`, fields: ['name', 'display_order'] },
  projects: { endpoint: 'projects', list: 'admin-projects-list', title: (r) => r.title, summary: (r) => `${r.category_name || 'No category'} • ${(r.technologies || []).join(', ')}`, fields: ['title', 'category_id', 'description', 'technologies', 'github_url', 'live_url', 'display_order'], imageField: 'image_path', uploadKind: 'project', idField: 'project_id' },
  certifications: { endpoint: 'certifications', list: 'admin-certifications-list', title: (r) => r.title, summary: (r) => `${r.issuer}${r.issue_date ? ` • ${r.issue_date}` : ''}`, fields: ['title', 'issuer', 'issue_date', 'certificate_url', 'display_order'], imageField: 'image_path', uploadKind: 'certificate', idField: 'certification_id' },
  awards: { endpoint: 'awards', list: 'admin-awards-list', title: (r) => r.title, summary: (r) => `${r.organization}${r.award_date ? ` • ${r.award_date}` : ''}`, fields: ['title', 'organization', 'award_date', 'description', 'url', 'display_order'], imageField: 'image_path', uploadKind: 'award', idField: 'award_id' },
  skills: { endpoint: 'skills', list: 'admin-skills-list', title: (r) => r.name, summary: (r) => `${r.category} • order ${r.display_order || 0}`, fields: ['category', 'name', 'display_order'] },
};

function updateProjectCategoryOptions() {
  const select = document.querySelector('#admin-projects-form select[name="category_id"]');
  if (!select) return;
  const selected = select.value;
  select.replaceChildren(new Option('Select category', ''));
  adminData.categories.forEach((category) => select.add(new Option(category.name, category.id)));
  if (adminData.categories.some((category) => String(category.id) === selected)) select.value = selected;
}

function renderResource(resource) {
  const config = resourceConfig[resource];
  const list = document.getElementById(config.list);
  if (!list) return;
  list.replaceChildren();
  const records = adminData[resource] || [];
  if (!records.length) {
    const item = document.createElement('li');
    item.className = 'skills-item';
    addText(item, 'p', `No ${resource} records yet.`, 'timeline-text');
    list.appendChild(item);
    return;
  }
  records.forEach((record) => {
    const item = document.createElement('li');
    item.className = 'skills-item admin-record';
    const details = document.createElement('div');
    details.className = 'admin-record-details';
    addText(details, 'h5', config.title(record), 'h5');
    addText(details, 'p', config.summary(record), 'timeline-text');
    if (config.imageField && record[config.imageField]) {
      const url = safeAssetUrl(record[config.imageField]);
      if (url) {
        const image = document.createElement('img');
        image.src = url;
        image.alt = `${config.title(record)} image`;
        image.className = 'admin-image-preview';
        details.appendChild(image);
      }
    }
    const actions = document.createElement('div');
    actions.className = 'admin-record-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'form-btn';
    edit.dataset.adminEdit = resource;
    edit.dataset.recordId = record.id;
    edit.textContent = 'Edit';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'form-btn';
    remove.dataset.adminDelete = resource;
    remove.dataset.recordId = record.id;
    remove.textContent = 'Delete';
    actions.append(edit, remove);
    item.append(details, actions);
    list.appendChild(item);
  });
}

function renderAllResources() {
  updateProjectCategoryOptions();
  Object.keys(resourceConfig).forEach(renderResource);
}

function renderSiteSettings() {
  const container = document.getElementById('admin-site-settings-list');
  if (!container) return;
  container.replaceChildren();
  const settings = adminData['site-settings'] || [];
  if (!settings.length) {
    addText(container, 'p', 'No site settings are configured in the database.', 'timeline-text');
    return;
  }
  settings.forEach((setting) => {
    const form = document.createElement('form');
    form.className = 'form admin-setting-form';
    form.dataset.settingKey = setting.key;
    const label = document.createElement('label');
    label.className = 'admin-setting-label';
    label.textContent = setting.key;
    const field = (setting.value || '').length > 100 ? document.createElement('textarea') : document.createElement('input');
    field.className = 'form-input';
    field.name = 'value';
    field.value = setting.value || '';
    label.appendChild(field);
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'form-btn';
    submit.textContent = 'Save setting';
    const status = document.createElement('p');
    status.className = 'admin-status';
    status.dataset.formStatus = '';
    status.setAttribute('role', 'status');
    form.append(label, submit, status);
    form.addEventListener('submit', saveSiteSetting);
    container.appendChild(form);
  });
}

async function saveSiteSetting(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = formStatus(form);
  const button = form.querySelector('[type="submit"]');
  setStatus(status, 'saving', 'Saving...');
  button.disabled = true;
  try {
    const savedSetting = await apiRequest(`/admin/site-settings/${encodeURIComponent(form.dataset.settingKey)}`, {
      method: 'PUT',
      body: { value: form.elements.namedItem('value').value },
    });
    const setting = adminData['site-settings'].find((item) => item.key === savedSetting.key);
    if (setting) setting.value = savedSetting.value;
    setStatus(status, 'success', 'Saved successfully.');
  } catch (error) {
    setStatus(status, 'error', `Save failed: ${error.message}`);
  } finally {
    button.disabled = false;
  }
}

function formPayload(form, config) {
  const payload = {};
  config.fields.forEach((key) => {
    const field = form.elements.namedItem(key);
    if (!field) return;
    if (key === 'display_order') payload[key] = field.value === '' ? 0 : Number(field.value);
    else if (key === 'technologies') payload[key] = field.value.split(',').map((item) => item.trim()).filter(Boolean);
    else payload[key] = field.value.trim() || null;
  });
  return payload;
}

function selectedFile(form, name) {
  const input = form.elements.namedItem(name);
  return input && input.files && input.files.length ? input.files[0] : null;
}

async function uploadFile(kind, file, recordIdField, recordId) {
  const body = new FormData();
  body.append('file', file);
  if (recordIdField && recordId) body.append(recordIdField, String(recordId));
  const result = await apiRequest(`/admin/uploads/${kind}`, { method: 'POST', body });
  return result.path;
}

function resetResourceForm(form, resource) {
  delete editingIds[resource];
  form.reset();
  form.dataset.recordId = '';
  const label = form.querySelector('button[type="submit"] span');
  const display = ({ education: 'Education', experience: 'Experience', categories: 'Category', projects: 'Project', certifications: 'Certification', awards: 'Award', skills: 'Skill' })[resource];
  if (label) label.textContent = `Save ${display}`;
  const cancel = form.querySelector('.admin-cancel-edit');
  if (cancel) cancel.hidden = true;
  const preview = form.querySelector('[data-current-image]');
  if (preview) preview.replaceChildren();
  clearFileSelections(form);
}

function clearFileSelections(form) {
  form.querySelectorAll('input[type="file"]').forEach((input) => {
    const url = objectUrls.get(input);
    if (url) URL.revokeObjectURL(url);
    objectUrls.delete(input);
    input.value = '';
    const field = input.closest('.admin-file-field');
    const label = field && field.querySelector('[data-selected-file]');
    if (label) label.textContent = 'No new file selected.';
    field?.querySelector('[data-selected-preview]')?.replaceChildren();
  });
}

async function saveResource(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const resource = form.dataset.resource;
  const config = resourceConfig[resource];
  const status = formStatus(form);
  const submit = form.querySelector('[type="submit"]');
  const file = config.uploadKind ? selectedFile(form, 'image') : null;
  setStatus(status, 'saving', 'Saving...');
  submit.disabled = true;
  let record = null;
  try {
    const payload = formPayload(form, config);
    const id = editingIds[resource];
    record = await apiRequest(`/admin/${config.endpoint}${id ? `/${id}` : ''}`, {
      method: id ? 'PUT' : 'POST',
      body: payload,
    });
    if (resource === 'projects') editingIds[resource] = record.id;
    if (file) {
      setStatus(status, 'saving', 'Saving... uploading selected image...');
      await uploadFile(config.uploadKind, file, config.idField, record.id);
    }
    resetResourceForm(form, resource);
    setStatus(status, 'success', 'Saved successfully.');
    try { await loadAdminData(false); }
    catch (error) { setStatus(adminDataStatus, 'error', `Saved successfully, but the lists could not be refreshed: ${error.message}`); }
  } catch (error) {
    if (record && config.uploadKind && file && !editingIds[resource]) editingIds[resource] = record.id;
    if (record && config.uploadKind && file) {
      editingIds[resource] = record.id;
      form.dataset.recordId = record.id;
      const cancel = form.querySelector('.admin-cancel-edit');
      if (cancel) cancel.hidden = false;
      setStatus(status, 'error', `Record saved, but image upload failed: ${error.message} Review the selected file and save again to retry.`);
      try { await loadAdminData(false); } catch { /* Keep the user's form values visible. */ }
    } else if (record) {
      setStatus(status, 'success', `Saved successfully. The list refresh failed: ${error.message}`);
    } else {
      setStatus(status, 'error', `Save failed: ${error.message}`);
    }
  } finally {
    submit.disabled = false;
  }
}

Object.keys(resourceConfig).forEach((resource) => {
  const form = document.querySelector(`form[data-resource="${resource}"]`);
  if (!form) return;
  form.addEventListener('submit', saveResource);
  form.querySelector('.admin-cancel-edit')?.addEventListener('click', () => {
    resetResourceForm(form, resource);
    setStatus(formStatus(form), '', '');
  });
});

function editResource(resource, record) {
  const config = resourceConfig[resource];
  const form = document.querySelector(`form[data-resource="${resource}"]`);
  if (!form) return;
  editingIds[resource] = record.id;
  form.dataset.recordId = record.id;
  populateForm(form, record);
  if (resource === 'projects') {
    form.elements.namedItem('technologies').value = (record.technologies || []).join(', ');
    updateProjectCategoryOptions();
    form.elements.namedItem('category_id').value = record.category_id;
  }
  const label = form.querySelector('button[type="submit"] span');
  const singular = ({ education: 'Education', experience: 'Experience', categories: 'Category', projects: 'Project', certifications: 'Certification', awards: 'Award', skills: 'Skill' })[resource];
  if (label) label.textContent = `Update ${singular}`;
  const cancel = form.querySelector('.admin-cancel-edit');
  if (cancel) cancel.hidden = false;
  const preview = form.querySelector('[data-current-image]');
  if (config.imageField && preview) showAsset(preview, record[config.imageField], 'Current stored image');
  setStatus(formStatus(form), '', 'Editing this database record.');
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function deleteResource(resource, record) {
  const config = resourceConfig[resource];
  if (!window.confirm(`Delete “${config.title(record)}”? This cannot be undone.`)) return;
  setStatus(listStatus(resource), 'saving', 'Deleting...');
  try {
    await apiRequest(`/admin/${config.endpoint}/${record.id}`, { method: 'DELETE' });
    setStatus(listStatus(resource), 'success', 'Deleted successfully.');
    try { await loadAdminData(false); }
    catch (error) { setStatus(adminDataStatus, 'error', `Deleted successfully, but the lists could not be refreshed: ${error.message}`); }
  } catch (error) {
    const message = resource === 'categories' && error.status === 400
      ? 'This category is still used by one or more projects. Reassign or delete those projects first.'
      : error.message;
    setStatus(listStatus(resource), 'error', `Delete failed: ${message}`);
  }
}

Object.entries(resourceConfig).forEach(([resource, config]) => {
  const list = document.getElementById(config.list);
  if (!list) return;
  list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-record-id]');
    if (!button) return;
    const record = (adminData[resource] || []).find((item) => String(item.id) === button.dataset.recordId);
    if (!record) return;
    if (button.dataset.adminEdit) editResource(resource, record);
    if (button.dataset.adminDelete) deleteResource(resource, record);
  });
});

function fillProfileRecord() {
  const form = document.getElementById('admin-profile-form');
  if (!form) return;
  const profile = adminData.profile || {};
  populateForm(form, profile);
  updateProfileAssets();
}

const profileForm = document.getElementById('admin-profile-form');
if (profileForm) {
  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = formStatus(profileForm);
    const submit = profileForm.querySelector('[type="submit"]');
    const profileFields = ['name', 'title', 'email', 'phone', 'location', 'github_url', 'linkedin_url', 'whatsapp_url'];
    setStatus(status, 'saving', 'Saving...');
    submit.disabled = true;
    let saved = null;
    try {
      const payload = {};
      profileFields.forEach((key) => { payload[key] = profileForm.elements.namedItem(key).value.trim() || null; });
      payload.profile_image_path = adminData.profile?.profile_image_path || null;
      payload.cv_file_path = adminData.profile?.cv_file_path || null;
      saved = await apiRequest('/admin/profile', { method: 'PUT', body: payload });
      adminData.profile = saved;
      const image = selectedFile(profileForm, 'profile_image');
      const cv = selectedFile(profileForm, 'cv_file');
      if (image) {
        setStatus(status, 'saving', 'Saving... uploading profile image...');
        saved.profile_image_path = await uploadFile('profile', image);
        adminData.profile.profile_image_path = saved.profile_image_path;
      }
      if (cv) {
        setStatus(status, 'saving', 'Saving... uploading CV...');
        saved.cv_file_path = await uploadFile('cv', cv);
        adminData.profile.cv_file_path = saved.cv_file_path;
      }
      fillProfileRecord();
      clearFileSelections(profileForm);
      updateProfileAssets();
      setStatus(status, 'success', 'Saved successfully.');
    } catch (error) {
      if (saved) {
        setStatus(status, 'error', `Profile saved, but a file upload failed: ${error.message} Your form values remain; select the file again to retry.`);
        try { await loadAdminData(false); updateProfileAssets(); } catch { /* Keep the editor values visible. */ }
      } else {
        setStatus(status, 'error', `Save failed: ${error.message}`);
      }
    } finally {
      submit.disabled = false;
    }
  });
}

document.querySelectorAll('.admin-file-field input[type="file"]').forEach((input) => {
  input.addEventListener('change', () => {
    const label = input.closest('.admin-file-field')?.querySelector('[data-selected-file]');
    const file = input.files && input.files[0];
    if (label) label.textContent = file ? `Selected: ${file.name}` : 'No new file selected.';
    const preview = input.closest('.admin-file-field')?.querySelector('[data-selected-preview]');
    if (!preview) return;
    const oldUrl = objectUrls.get(input);
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    preview.replaceChildren();
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      objectUrls.set(input, url);
      const image = document.createElement('img');
      image.src = url;
      image.alt = 'Selected image preview';
      image.className = 'admin-image-preview';
      preview.appendChild(image);
    }
  });
});

updateAdminView();
checkExistingSession();
