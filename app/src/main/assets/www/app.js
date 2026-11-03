/**
 * HUSEN HISAB - Main Application Logic
 * Factory: SHREEJI CEMENT PRODUCT
 * Language: Gujarati
 */

// Worker names constants
const WORKER_NAMES = {
  Husen: 'હુસેન',
  Jumabhai: 'જુમાભાઈ (પિતા)',
  Sultan: 'સુલતાન',
  Salimbhai: 'સલીમભાઈ'
};

// Global state
let currentActiveTab = 'tab-home';
let historyFilterType = 'all';
let deferredInstallPrompt = null;
let pendingDeleteAction = null;

// Currency & number formatting helpers
function formatPaiseToRupees(paise) {
  if (isNaN(paise) || paise === null || paise === undefined) return '₹0.00';
  const rupees = paise / 100;
  return '₹' + rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentMonthString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Show Toast
function showToast(message, isError = false) {
  const toast = document.getElementById('toast-message');
  const icon = document.getElementById('toast-icon');
  const text = document.getElementById('toast-text');

  if (!toast) return;
  text.textContent = message;
  icon.textContent = isError ? '✕' : '✓';
  toast.style.background = isError ? '#EF4444' : '#FFD700';
  toast.style.color = isError ? '#FFFFFF' : '#000000';

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

// Custom Confirmation Dialog
function showConfirmDialog({ title, message, onConfirm, icon = '⚠️' }) {
  const modal = document.getElementById('modal-confirm');
  const titleEl = document.getElementById('confirm-title');
  const msgEl = document.getElementById('confirm-message');
  const iconEl = document.getElementById('confirm-icon');
  const okBtn = document.getElementById('btn-confirm-ok');
  const cancelBtn = document.getElementById('btn-confirm-cancel');

  titleEl.textContent = title;
  msgEl.textContent = message;
  iconEl.textContent = icon;

  const handleOk = () => {
    modal.classList.remove('active');
    okBtn.removeEventListener('click', handleOk);
    cancelBtn.removeEventListener('click', handleCancel);
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    modal.classList.remove('active');
    okBtn.removeEventListener('click', handleOk);
    cancelBtn.removeEventListener('click', handleCancel);
  };

  okBtn.addEventListener('click', handleOk);
  cancelBtn.addEventListener('click', handleCancel);

  modal.classList.add('active');
}

// -----------------------------------------------------------------
// CALCULATION LOGIC (Exact integer paise)
// -----------------------------------------------------------------
function calculateWorkEarnings({ lines = 0, smallPoles = 0, smallPoleWorkers = [], bigPoles = 0, bigPoleWorkers = [] }) {
  const numLines = Math.max(0, parseInt(lines) || 0);
  const numSmallPoles = Math.max(0, parseInt(smallPoles) || 0);
  const numBigPoles = Math.max(0, parseInt(bigPoles) || 0);

  // 1. Small Line: ₹1000 per line (100% Husen)
  const lineEarningsPaise = numLines * 1000 * 100;

  // 2. Small Poles: ₹4 per pole
  const smallPoleTotalPaise = numSmallPoles * 4 * 100;
  let smallPolePerWorkerPaise = 0;
  let smallPoleHusenPaise = 0;
  let smallPoleJumabhaiPaise = 0;
  let smallPoleFamilyPaise = 0;

  if (numSmallPoles > 0 && smallPoleWorkers.length > 0) {
    smallPolePerWorkerPaise = Math.round(smallPoleTotalPaise / smallPoleWorkers.length);
    if (smallPoleWorkers.includes('Husen')) {
      smallPoleHusenPaise = smallPolePerWorkerPaise;
    }
    if (smallPoleWorkers.includes('Jumabhai')) {
      smallPoleJumabhaiPaise = smallPolePerWorkerPaise;
    }
    smallPoleFamilyPaise = smallPoleHusenPaise + smallPoleJumabhaiPaise;
  }

  // 3. Big Poles: ₹8 per pole
  const bigPoleTotalPaise = numBigPoles * 8 * 100;
  let bigPolePerWorkerPaise = 0;
  let bigPoleHusenPaise = 0;
  let bigPoleJumabhaiPaise = 0;
  let bigPoleFamilyPaise = 0;

  if (numBigPoles > 0 && bigPoleWorkers.length > 0) {
    bigPolePerWorkerPaise = Math.round(bigPoleTotalPaise / bigPoleWorkers.length);
    if (bigPoleWorkers.includes('Husen')) {
      bigPoleHusenPaise = bigPolePerWorkerPaise;
    }
    if (bigPoleWorkers.includes('Jumabhai')) {
      bigPoleJumabhaiPaise = bigPolePerWorkerPaise;
    }
    bigPoleFamilyPaise = bigPoleHusenPaise + bigPoleJumabhaiPaise;
  }

  // Combined Family Earnings = Lines + Husen's SP + Jumabhai's SP + Husen's BP + Jumabhai's BP
  const combinedFamilyPaise = lineEarningsPaise + smallPoleFamilyPaise + bigPoleFamilyPaise;

  return {
    lines: numLines,
    lineEarningsPaise,
    smallPoles: numSmallPoles,
    smallPoleWorkers: [...smallPoleWorkers],
    smallPoleTotalPaise,
    smallPolePerWorkerPaise,
    smallPoleHusenPaise,
    smallPoleJumabhaiPaise,
    smallPoleFamilyPaise,
    bigPoles: numBigPoles,
    bigPoleWorkers: [...bigPoleWorkers],
    bigPoleTotalPaise,
    bigPolePerWorkerPaise,
    bigPoleHusenPaise,
    bigPoleJumabhaiPaise,
    bigPoleFamilyPaise,
    combinedFamilyPaise
  };
}

// -----------------------------------------------------------------
// TAB NAVIGATION
// -----------------------------------------------------------------
function switchTab(targetTabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));

  const targetPane = document.getElementById(targetTabId);
  const targetNavBtn = document.querySelector(`.nav-tab[data-tab="${targetTabId}"]`);

  if (targetPane) targetPane.classList.add('active');
  if (targetNavBtn) targetNavBtn.classList.add('active');

  currentActiveTab = targetTabId;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Refresh tab data
  if (targetTabId === 'tab-home') {
    renderDashboard();
  } else if (targetTabId === 'tab-history') {
    renderHistory();
  } else if (targetTabId === 'tab-report') {
    renderMonthlyReport();
  }
}

// -----------------------------------------------------------------
// LIVE CALCULATION IN WORK FORM
// -----------------------------------------------------------------
function getSelectedWorkers(groupName) {
  const checkboxes = document.querySelectorAll(`input[name="${groupName}"]:checked`);
  return Array.from(checkboxes).map(cb => cb.value);
}

function updateLiveWorkPreview() {
  const linesInput = document.getElementById('small-lines');
  const spInput = document.getElementById('small-poles');
  const bpInput = document.getElementById('big-poles');

  const spWorkers = getSelectedWorkers('sp_worker');
  const bpWorkers = getSelectedWorkers('bp_worker');

  // Update chip active classes
  document.querySelectorAll('#small-pole-workers-group .worker-chip').forEach(chip => {
    const cb = chip.querySelector('input');
    if (cb && cb.checked) chip.classList.add('selected');
    else chip.classList.remove('selected');
  });

  document.querySelectorAll('#big-pole-workers-group .worker-chip').forEach(chip => {
    const cb = chip.querySelector('input');
    if (cb && cb.checked) chip.classList.add('selected');
    else chip.classList.remove('selected');
  });

  document.getElementById('small-pole-worker-count').textContent = `${spWorkers.length} પસંદ`;
  document.getElementById('big-pole-worker-count').textContent = `${bpWorkers.length} પસંદ`;

  const calc = calculateWorkEarnings({
    lines: linesInput ? linesInput.value : 0,
    smallPoles: spInput ? spInput.value : 0,
    smallPoleWorkers: spWorkers,
    bigPoles: bpInput ? bpInput.value : 0,
    bigPoleWorkers: bpWorkers
  });

  document.getElementById('prev-line-amt').textContent = formatPaiseToRupees(calc.lineEarningsPaise);
  document.getElementById('prev-sp-total').textContent = formatPaiseToRupees(calc.smallPoleTotalPaise);
  document.getElementById('prev-sp-per-worker').textContent = formatPaiseToRupees(calc.smallPolePerWorkerPaise);
  document.getElementById('prev-sp-family-share').textContent = formatPaiseToRupees(calc.smallPoleFamilyPaise);
  
  document.getElementById('prev-bp-total').textContent = formatPaiseToRupees(calc.bigPoleTotalPaise);
  document.getElementById('prev-bp-per-worker').textContent = formatPaiseToRupees(calc.bigPolePerWorkerPaise);
  document.getElementById('prev-bp-family-share').textContent = formatPaiseToRupees(calc.bigPoleFamilyPaise);

  document.getElementById('prev-grand-total').textContent = formatPaiseToRupees(calc.combinedFamilyPaise);
}

function updateEditLiveWorkPreview() {
  const lines = document.getElementById('edit-small-lines').value;
  const sp = document.getElementById('edit-small-poles').value;
  const bp = document.getElementById('edit-big-poles').value;

  const spWorkers = getSelectedWorkers('edit_sp_worker');
  const bpWorkers = getSelectedWorkers('edit_bp_worker');

  document.querySelectorAll('#edit-sp-workers-group .worker-chip').forEach(chip => {
    const cb = chip.querySelector('input');
    if (cb && cb.checked) chip.classList.add('selected');
    else chip.classList.remove('selected');
  });

  document.querySelectorAll('#edit-bp-workers-group .worker-chip').forEach(chip => {
    const cb = chip.querySelector('input');
    if (cb && cb.checked) chip.classList.add('selected');
    else chip.classList.remove('selected');
  });

  const calc = calculateWorkEarnings({
    lines,
    smallPoles: sp,
    smallPoleWorkers: spWorkers,
    bigPoles: bp,
    bigPoleWorkers: bpWorkers
  });

  document.getElementById('edit-prev-grand-total').textContent = formatPaiseToRupees(calc.combinedFamilyPaise);
}

// -----------------------------------------------------------------
// SAVE WORK RECORD
// -----------------------------------------------------------------
async function handleWorkFormSubmit(e) {
  e.preventDefault();

  const dateInput = document.getElementById('work-date');
  const linesInput = document.getElementById('small-lines');
  const spInput = document.getElementById('small-poles');
  const bpInput = document.getElementById('big-poles');
  const notesInput = document.getElementById('work-notes');
  const saveBtn = document.getElementById('btn-save-work');

  const date = dateInput.value;
  if (!date) {
    showToast('કૃપા કરીને તારીખ પસંદ કરો.', true);
    return;
  }

  const lines = parseInt(linesInput.value) || 0;
  const smallPoles = parseInt(spInput.value) || 0;
  const bigPoles = parseInt(bpInput.value) || 0;
  const notes = notesInput.value.trim();

  const spWorkers = getSelectedWorkers('sp_worker');
  const bpWorkers = getSelectedWorkers('bp_worker');

  // Validation rules
  if (lines === 0 && smallPoles === 0 && bigPoles === 0) {
    showToast('કૃપા કરીને લાઇન અથવા થાંભલાની સંખ્યા દાખલ કરો.', true);
    return;
  }

  if (smallPoles > 0 && spWorkers.length === 0) {
    showToast('નાના થાંભલા માટે ઓછામાં ઓછો ૧ મજૂર પસંદ કરવો જરૂરી છે.', true);
    return;
  }

  if (bigPoles > 0 && bpWorkers.length === 0) {
    showToast('મોટા થાંભલા માટે ઓછામાં ઓછો ૧ મજૂર પસંદ કરવો જરૂરી છે.', true);
    return;
  }

  // Prevent accidental duplicates: check if record already exists for this date
  const allWorks = await hisabDB.getAllWorkRecords();
  const existingForDate = allWorks.filter(w => w.date === date);

  const proceedSave = async () => {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>⏳</span> સેવ થઈ રહ્યું છે...';

    try {
      const calc = calculateWorkEarnings({
        lines,
        smallPoles,
        smallPoleWorkers: spWorkers,
        bigPoles,
        bigPoleWorkers: bpWorkers
      });

      const record = {
        date,
        ...calc,
        notes
      };

      await hisabDB.addWorkRecord(record);

      showToast('કામ હિસાબ સફળતાપૂર્વક સેવ થયો!');

      // Reset form fields
      linesInput.value = '0';
      spInput.value = '0';
      bpInput.value = '0';
      notesInput.value = '';
      updateLiveWorkPreview();

      // Go to history or refresh dashboard
      renderDashboard();
    } catch (err) {
      console.error(err);
      showToast('સેવ કરવામાં ભૂલ થઈ. ફરી પ્રયત્ન કરો.', true);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>💾</span> હિસાબ સેવ કરો';
    }
  };

  if (existingForDate.length > 0) {
    showConfirmDialog({
      title: 'આ તારીખે પહેલેથી હિસાબ છે!',
      message: `${formatDisplayDate(date)} ના રોજ પહેલેથી ${existingForDate.length} હિસાબ નોંધાયેલ છે. શું તમારે આ નવો હિસાબ પણ સેવ કરવો છે?`,
      onConfirm: proceedSave,
      icon: 'ℹ️'
    });
  } else {
    await proceedSave();
  }
}

// -----------------------------------------------------------------
// SAVE PAYMENT RECORD
// -----------------------------------------------------------------
async function handlePaymentFormSubmit(e) {
  e.preventDefault();

  const dateInput = document.getElementById('payment-date');
  const amountInput = document.getElementById('payment-amount');
  const notesInput = document.getElementById('payment-notes');
  const saveBtn = document.getElementById('btn-save-payment');

  const date = dateInput.value;
  const rawAmount = parseFloat(amountInput.value);
  const notes = notesInput.value.trim();

  if (!date) {
    showToast('કૃપા કરીને તારીખ પસંદ કરો.', true);
    return;
  }

  if (isNaN(rawAmount) || rawAmount <= 0) {
    showToast('કૃપા કરીને યોગ્ય જમા રકમ દાખલ કરો.', true);
    return;
  }

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span>⏳</span> સેવ થઈ રહ્યું છે...';

  try {
    const amountPaise = Math.round(rawAmount * 100);

    const record = {
      date,
      amountPaise,
      notes
    };

    await hisabDB.addPaymentRecord(record);

    showToast(`₹${rawAmount} ની જમા રકમ સફળતાપૂર્વક નોંધાઈ!`);

    amountInput.value = '';
    notesInput.value = '';
    renderDashboard();
  } catch (err) {
    console.error(err);
    showToast('જમા રકમ સેવ કરવામાં ભૂલ થઈ.', true);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>💾</span> જમા રકમ સેવ કરો';
  }
}

// -----------------------------------------------------------------
// DASHBOARD RENDERING
// -----------------------------------------------------------------
async function renderDashboard() {
  const works = await hisabDB.getAllWorkRecords();
  const payments = await hisabDB.getAllPaymentRecords();

  const todayStr = getTodayDateString();
  const thisMonthStr = getCurrentMonthString();

  let todayEarnedPaise = 0;
  let thisMonthEarnedPaise = 0;
  let totalEarnedPaise = 0;
  let totalLineSharePaise = 0;
  let totalSmallPoleSharePaise = 0;
  let totalBigPoleSharePaise = 0;

  works.forEach(w => {
    const earned = w.combinedFamilyPaise || 0;
    totalEarnedPaise += earned;
    totalLineSharePaise += (w.lineEarningsPaise || 0);
    totalSmallPoleSharePaise += (w.smallPoleFamilyPaise || 0);
    totalBigPoleSharePaise += (w.bigPoleFamilyPaise || 0);

    if (w.date === todayStr) {
      todayEarnedPaise += earned;
    }
    if (w.date && w.date.startsWith(thisMonthStr)) {
      thisMonthEarnedPaise += earned;
    }
  });

  let totalPaidPaise = 0;
  payments.forEach(p => {
    totalPaidPaise += (p.amountPaise || 0);
  });

  const outstandingPaise = totalEarnedPaise - totalPaidPaise;

  // Set DOM values
  document.getElementById('dash-outstanding').textContent = formatPaiseToRupees(outstandingPaise);
  document.getElementById('dash-today').textContent = formatPaiseToRupees(todayEarnedPaise);
  document.getElementById('dash-today-date').textContent = formatDisplayDate(todayStr);
  document.getElementById('dash-month').textContent = formatPaiseToRupees(thisMonthEarnedPaise);
  document.getElementById('dash-total-earned').textContent = formatPaiseToRupees(totalEarnedPaise);
  document.getElementById('dash-total-paid').textContent = formatPaiseToRupees(totalPaidPaise);

  document.getElementById('dash-line-share').textContent = formatPaiseToRupees(totalLineSharePaise);
  document.getElementById('dash-small-pole-share').textContent = formatPaiseToRupees(totalSmallPoleSharePaise);
  document.getElementById('dash-big-pole-share').textContent = formatPaiseToRupees(totalBigPoleSharePaise);

  // Render recent 4 transactions
  const combinedRecents = [];
  works.forEach(w => combinedRecents.push({ ...w, type: 'work' }));
  payments.forEach(p => combinedRecents.push({ ...p, type: 'payment' }));

  combinedRecents.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id - a.id));

  const recentListEl = document.getElementById('dash-recent-list');
  const sliceRecents = combinedRecents.slice(0, 4);

  if (sliceRecents.length === 0) {
    recentListEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <p>હજી સુધી કોઈ હિસાબ નોંધાયો નથી.</p>
      </div>
    `;
  } else {
    recentListEl.innerHTML = sliceRecents.map(item => {
      if (item.type === 'work') {
        const workersCount = (item.smallPoleWorkers?.length || 0) + (item.bigPoleWorkers?.length || 0);
        return `
          <div class="history-card" style="margin-bottom: 8px; padding: 10px 12px;">
            <div class="history-top">
              <span class="history-date">📅 ${formatDisplayDate(item.date)}</span>
              <span class="history-type-badge badge-work">કામ કમાણી</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-size: 13px; color: var(--text-secondary);">
                ${item.lines > 0 ? `લાઇન: ${item.lines} ` : ''}
                ${item.smallPoles > 0 ? `નાના: ${item.smallPoles} ` : ''}
                ${item.bigPoles > 0 ? `મોટા: ${item.bigPoles}` : ''}
              </span>
              <span class="history-amount">${formatPaiseToRupees(item.combinedFamilyPaise)}</span>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="history-card" style="margin-bottom: 8px; padding: 10px 12px; border-left: 3px solid var(--accent-green);">
            <div class="history-top">
              <span class="history-date">📅 ${formatDisplayDate(item.date)}</span>
              <span class="history-type-badge badge-payment">ઉપાડ / જમા</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-size: 13px; color: var(--text-secondary);">${item.notes || 'ફેક્ટરી ઉપાડ'}</span>
              <span class="history-amount payment">${formatPaiseToRupees(item.amountPaise)}</span>
            </div>
          </div>
        `;
      }
    }).join('');
  }
}

// -----------------------------------------------------------------
// HISTORY RENDERING & MANAGEMENT
// -----------------------------------------------------------------
async function renderHistory() {
  const works = await hisabDB.getAllWorkRecords();
  const payments = await hisabDB.getAllPaymentRecords();

  document.getElementById('count-all').textContent = works.length + payments.length;
  document.getElementById('count-work').textContent = works.length;
  document.getElementById('count-payment').textContent = payments.length;

  const searchQuery = (document.getElementById('history-search').value || '').toLowerCase().trim();
  const monthFilter = document.getElementById('history-month-filter').value;

  const combined = [];
  if (historyFilterType === 'all' || historyFilterType === 'work') {
    works.forEach(w => combined.push({ ...w, type: 'work' }));
  }
  if (historyFilterType === 'all' || historyFilterType === 'payment') {
    payments.forEach(p => combined.push({ ...p, type: 'payment' }));
  }

  // Filter
  const filtered = combined.filter(item => {
    // Month filter
    if (monthFilter && !item.date.startsWith(monthFilter)) {
      return false;
    }
    // Search query
    if (searchQuery) {
      const dateFormatted = formatDisplayDate(item.date).toLowerCase();
      const rawDate = (item.date || '').toLowerCase();
      const notes = (item.notes || '').toLowerCase();
      const matchesSearch = dateFormatted.includes(searchQuery) ||
                            rawDate.includes(searchQuery) ||
                            notes.includes(searchQuery);
      if (!matchesSearch) return false;
    }
    return true;
  });

  // Sort descending
  filtered.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id - a.id));

  const listContainer = document.getElementById('history-list-container');
  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p>કોઈ હિસાબ રેકોર્ડ મળ્યો નથી.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filtered.map(item => {
    if (item.type === 'work') {
      const spWorkersList = (item.smallPoleWorkers || []).map(w => WORKER_NAMES[w] || w).join(', ') || 'કોઈ નહીં';
      const bpWorkersList = (item.bigPoleWorkers || []).map(w => WORKER_NAMES[w] || w).join(', ') || 'કોઈ નહીં';

      return `
        <div class="history-card" id="history-work-${item.id}">
          <div class="history-top">
            <span class="history-date">📅 ${formatDisplayDate(item.date)}</span>
            <span class="history-type-badge badge-work">કામ હિસાબ</span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <span style="font-size: 13px; color: var(--text-secondary);">કુલ કુટુંબ કમાણી:</span>
            <span class="history-amount">${formatPaiseToRupees(item.combinedFamilyPaise)}</span>
          </div>

          <div class="history-details-list">
            ${item.lines > 0 ? `<div>• <strong>નાની લાઇન:</strong> ${item.lines} લાઇન × ₹1000 = <strong>${formatPaiseToRupees(item.lineEarningsPaise)}</strong></div>` : ''}
            ${item.smallPoles > 0 ? `
              <div>• <strong>નાના થાંભલા:</strong> ${item.smallPoles} × ₹4 = ${formatPaiseToRupees(item.smallPoleTotalPaise)}
                <div style="padding-left: 10px; font-size: 12px; color: var(--text-muted);">
                  મજૂરો: ${spWorkersList} | પ્રતિ મજૂર: ${formatPaiseToRupees(item.smallPolePerWorkerPaise)}<br>
                  <span style="color: var(--primary-yellow);">હુસેન + પિતા હિસ્સો: ${formatPaiseToRupees(item.smallPoleFamilyPaise)}</span>
                </div>
              </div>` : ''}
            ${item.bigPoles > 0 ? `
              <div>• <strong>મોટા થાંભલા:</strong> ${item.bigPoles} × ₹8 = ${formatPaiseToRupees(item.bigPoleTotalPaise)}
                <div style="padding-left: 10px; font-size: 12px; color: var(--text-muted);">
                  મજૂરો: ${bpWorkersList} | પ્રતિ મજૂર: ${formatPaiseToRupees(item.bigPolePerWorkerPaise)}<br>
                  <span style="color: var(--primary-yellow);">હુસેન + પિતા હિસ્સો: ${formatPaiseToRupees(item.bigPoleFamilyPaise)}</span>
                </div>
              </div>` : ''}
            ${item.notes ? `<div style="margin-top: 4px; color: #E5E7EB;">📌 નોંધ: ${item.notes}</div>` : ''}
          </div>

          <div class="history-actions">
            <button class="small-btn edit" onclick="openEditWorkModal(${item.id})">✏️ સુધારો</button>
            <button class="small-btn delete" onclick="confirmDeleteWork(${item.id})">🗑️ ડિલીટ</button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="history-card" id="history-pay-${item.id}" style="border-left: 4px solid var(--accent-green);">
          <div class="history-top">
            <span class="history-date">📅 ${formatDisplayDate(item.date)}</span>
            <span class="history-type-badge badge-payment">ફેક્ટરી જમા રકમ</span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 13px; color: var(--text-secondary);">ઉપાડ / મળેલ રકમ:</span>
            <span class="history-amount payment">${formatPaiseToRupees(item.amountPaise)}</span>
          </div>

          ${item.notes ? `<div class="history-details-list">📌 વિગત: ${item.notes}</div>` : ''}

          <div class="history-actions">
            <button class="small-btn edit" onclick="openEditPaymentModal(${item.id})">✏️ સુધારો</button>
            <button class="small-btn delete" onclick="confirmDeletePayment(${item.id})">🗑️ ડિલીટ</button>
          </div>
        </div>
      `;
    }
  }).join('');
}

// -----------------------------------------------------------------
// EDIT & DELETE ACTIONS
// -----------------------------------------------------------------
window.openEditWorkModal = async function(id) {
  const record = await hisabDB.getWorkRecord(id);
  if (!record) {
    showToast('રેકોર્ડ મળ્યો નથી.', true);
    return;
  }

  document.getElementById('edit-work-id').value = record.id;
  document.getElementById('edit-work-date').value = record.date;
  document.getElementById('edit-small-lines').value = record.lines || 0;
  document.getElementById('edit-small-poles').value = record.smallPoles || 0;
  document.getElementById('edit-big-poles').value = record.bigPoles || 0;
  document.getElementById('edit-work-notes').value = record.notes || '';

  // Set small pole workers
  const spWorkers = record.smallPoleWorkers || [];
  document.querySelectorAll('input[name="edit_sp_worker"]').forEach(cb => {
    cb.checked = spWorkers.includes(cb.value);
  });

  // Set big pole workers
  const bpWorkers = record.bigPoleWorkers || [];
  document.querySelectorAll('input[name="edit_bp_worker"]').forEach(cb => {
    cb.checked = bpWorkers.includes(cb.value);
  });

  updateEditLiveWorkPreview();
  document.getElementById('modal-edit-work').classList.add('active');
};

window.openEditPaymentModal = async function(id) {
  const payments = await hisabDB.getAllPaymentRecords();
  const record = payments.find(p => p.id === Number(id) || p.id === id);
  if (!record) {
    showToast('રેકોર્ડ મળ્યો નથી.', true);
    return;
  }

  document.getElementById('edit-payment-id').value = record.id;
  document.getElementById('edit-payment-date').value = record.date;
  document.getElementById('edit-payment-amount').value = (record.amountPaise / 100).toFixed(2);
  document.getElementById('edit-payment-notes').value = record.notes || '';

  document.getElementById('modal-edit-payment').classList.add('active');
};

window.confirmDeleteWork = function(id) {
  showConfirmDialog({
    title: 'કામ હિસાબ ડિલીટ કરવો છે?',
    message: 'શું આપ આ કામ હિસાબની એન્ટ્રી ખરેખર ડિલીટ કરવા માંગો છો?',
    onConfirm: async () => {
      await hisabDB.deleteWorkRecord(id);
      showToast('હિસાબ ડિલીટ કરવામાં આવ્યો.');
      renderHistory();
      renderDashboard();
    }
  });
};

window.confirmDeletePayment = function(id) {
  showConfirmDialog({
    title: 'જમા રકમ ડિલીટ કરવી છે?',
    message: 'શું આપ આ ફેક્ટરી જમા રકમનો રેકોર્ડ ખરેખર ડિલીટ કરવા માંગો છો?',
    onConfirm: async () => {
      await hisabDB.deletePaymentRecord(id);
      showToast('જમા રકમ ડિલીટ કરવામાં આવી.');
      renderHistory();
      renderDashboard();
    }
  });
};

// Handle Edit Work Form Submit
async function handleEditWorkFormSubmit(e) {
  e.preventDefault();
  const id = Number(document.getElementById('edit-work-id').value);
  const date = document.getElementById('edit-work-date').value;
  const lines = parseInt(document.getElementById('edit-small-lines').value) || 0;
  const smallPoles = parseInt(document.getElementById('edit-small-poles').value) || 0;
  const bigPoles = parseInt(document.getElementById('edit-big-poles').value) || 0;
  const notes = document.getElementById('edit-work-notes').value.trim();

  const spWorkers = getSelectedWorkers('edit_sp_worker');
  const bpWorkers = getSelectedWorkers('edit_bp_worker');

  if (smallPoles > 0 && spWorkers.length === 0) {
    showToast('નાના થાંભલા માટે ઓછામાં ઓછો ૧ મજૂર પસંદ કરવો જરૂરી છે.', true);
    return;
  }
  if (bigPoles > 0 && bpWorkers.length === 0) {
    showToast('મોટા થાંભલા માટે ઓછામાં ઓછો ૧ મજૂર પસંદ કરવો જરૂરી છે.', true);
    return;
  }

  const calc = calculateWorkEarnings({
    lines,
    smallPoles,
    smallPoleWorkers: spWorkers,
    bigPoles,
    bigPoleWorkers: bpWorkers
  });

  const updatedRecord = {
    id,
    date,
    ...calc,
    notes
  };

  await hisabDB.updateWorkRecord(updatedRecord);
  document.getElementById('modal-edit-work').classList.remove('active');
  showToast('હિસાબ સુધારો સેવ થયો!');
  renderHistory();
  renderDashboard();
}

// Handle Edit Payment Form Submit
async function handleEditPaymentFormSubmit(e) {
  e.preventDefault();
  const id = Number(document.getElementById('edit-payment-id').value);
  const date = document.getElementById('edit-payment-date').value;
  const amountVal = parseFloat(document.getElementById('edit-payment-amount').value);
  const notes = document.getElementById('edit-payment-notes').value.trim();

  if (isNaN(amountVal) || amountVal <= 0) {
    showToast('કૃપા કરીને યોગ્ય રકમ દાખલ કરો.', true);
    return;
  }

  const updatedRecord = {
    id,
    date,
    amountPaise: Math.round(amountVal * 100),
    notes
  };

  await hisabDB.updatePaymentRecord(updatedRecord);
  document.getElementById('modal-edit-payment').classList.remove('active');
  showToast('જમા રકમ સુધારો સેવ થયો!');
  renderHistory();
  renderDashboard();
}

// -----------------------------------------------------------------
// MONTHLY REPORT
// -----------------------------------------------------------------
async function renderMonthlyReport() {
  const monthInput = document.getElementById('report-month-picker');
  const selectedMonth = monthInput.value || getCurrentMonthString();

  const works = await hisabDB.getAllWorkRecords();
  const payments = await hisabDB.getAllPaymentRecords();

  const monthWorks = works.filter(w => w.date && w.date.startsWith(selectedMonth));
  const monthPayments = payments.filter(p => p.date && p.date.startsWith(selectedMonth));

  let totalLines = 0;
  let totalLineEarningsPaise = 0;
  let totalSmallPoles = 0;
  let totalSmallPoleFamilyPaise = 0;
  let totalBigPoles = 0;
  let totalBigPoleFamilyPaise = 0;
  let totalMonthEarnedPaise = 0;

  monthWorks.forEach(w => {
    totalLines += (w.lines || 0);
    totalLineEarningsPaise += (w.lineEarningsPaise || 0);
    totalSmallPoles += (w.smallPoles || 0);
    totalSmallPoleFamilyPaise += (w.smallPoleFamilyPaise || 0);
    totalBigPoles += (w.bigPoles || 0);
    totalBigPoleFamilyPaise += (w.bigPoleFamilyPaise || 0);
    totalMonthEarnedPaise += (w.combinedFamilyPaise || 0);
  });

  let totalMonthPaidPaise = 0;
  monthPayments.forEach(p => {
    totalMonthPaidPaise += (p.amountPaise || 0);
  });

  const monthNetBalancePaise = totalMonthEarnedPaise - totalMonthPaidPaise;

  const [y, m] = selectedMonth.split('-');
  const monthNamesGu = [
    'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
    'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
  ];
  const monthName = monthNamesGu[parseInt(m) - 1] || m;

  document.getElementById('rep-period-title').textContent = `મહિનો: ${monthName} ${y}`;
  document.getElementById('rep-total-lines').textContent = totalLines;
  document.getElementById('rep-line-earnings').textContent = formatPaiseToRupees(totalLineEarningsPaise);
  document.getElementById('rep-total-sp').textContent = totalSmallPoles;
  document.getElementById('rep-sp-family-share').textContent = formatPaiseToRupees(totalSmallPoleFamilyPaise);
  document.getElementById('rep-total-bp').textContent = totalBigPoles;
  document.getElementById('rep-bp-family-share').textContent = formatPaiseToRupees(totalBigPoleFamilyPaise);
  document.getElementById('rep-month-total-earned').textContent = formatPaiseToRupees(totalMonthEarnedPaise);
  document.getElementById('rep-month-total-paid').textContent = formatPaiseToRupees(totalMonthPaidPaise);
  document.getElementById('rep-month-net-balance').textContent = formatPaiseToRupees(monthNetBalancePaise);

  // Daily breakdown list
  const breakdownContainer = document.getElementById('report-daily-breakdown');
  if (monthWorks.length === 0 && monthPayments.length === 0) {
    breakdownContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <p>પસંદ કરેલ મહિના (${monthName} ${y}) માં કોઈ વ્યવહાર થયેલ નથી.</p>
      </div>
    `;
    return;
  }

  // Combine and sort
  const monthCombined = [];
  monthWorks.forEach(w => monthCombined.push({ ...w, type: 'work' }));
  monthPayments.forEach(p => monthCombined.push({ ...p, type: 'payment' }));
  monthCombined.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.id - b.id));

  breakdownContainer.innerHTML = monthCombined.map(item => {
    if (item.type === 'work') {
      return `
        <div class="stat-card" style="margin-bottom: 8px; border-left: 3px solid var(--primary-yellow);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: var(--text-main); font-size: 14px;">📅 ${formatDisplayDate(item.date)}</strong>
            <span style="font-weight: 800; color: var(--primary-yellow); font-size: 16px;">${formatPaiseToRupees(item.combinedFamilyPaise)}</span>
          </div>
          <div style="font-size: 12.5px; color: var(--text-secondary);">
            ${item.lines > 0 ? `લાઇન: ${item.lines} (₹${item.lines * 1000}) ` : ''}
            ${item.smallPoles > 0 ? `| નાના થાંભલા: ${item.smallPoles} (કુટુંબ હિસ્સો: ${formatPaiseToRupees(item.smallPoleFamilyPaise)}) ` : ''}
            ${item.bigPoles > 0 ? `| મોટા થાંભલા: ${item.bigPoles} (કુટુંબ હિસ્સો: ${formatPaiseToRupees(item.bigPoleFamilyPaise)}) ` : ''}
          </div>
          ${item.notes ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">નોંધ: ${item.notes}</div>` : ''}
        </div>
      `;
    } else {
      return `
        <div class="stat-card" style="margin-bottom: 8px; border-left: 3px solid var(--accent-green); background: rgba(16, 185, 129, 0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--text-main); font-size: 14px;">📅 ${formatDisplayDate(item.date)} (ઉપાડ)</strong>
            <span style="font-weight: 800; color: var(--accent-green); font-size: 16px;">${formatPaiseToRupees(item.amountPaise)}</span>
          </div>
          ${item.notes ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">વિગત: ${item.notes}</div>` : ''}
        </div>
      `;
    }
  }).join('');
}

// -----------------------------------------------------------------
// BACKUP, CSV & RESTORE
// -----------------------------------------------------------------
async function exportJSONBackup() {
  try {
    const backupData = await hisabDB.exportFullBackup();
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const dateStr = getTodayDateString().replace(/-/g, '_');
    a.href = url;
    a.download = `husen_hisab_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('સંપૂર્ણ બેકઅપ ફાઇલ ડાઉનલોડ થઈ ગઈ!');
  } catch (err) {
    console.error(err);
    showToast('બેકઅપ બનાવવામાં ભૂલ થઈ.', true);
  }
}

async function exportCSV() {
  try {
    const works = await hisabDB.getAllWorkRecords();
    const payments = await hisabDB.getAllPaymentRecords();

    // UTF-8 BOM so Excel opens Gujarati correctly
    let csvContent = '\uFEFF';
    csvContent += 'તારીખ,પ્રકાર,નાની લાઇન,નાના થાંભલા,નાના મજૂરો,મોટા થાંભલા,મોટા મજૂરો,લાઇન કમાણી (₹),નાના થાંભલા કુટુંબ હિસ્સો (₹),મોટા થાંભલા કુટુંબ હિસ્સો (₹),કુલ કમાણી / ઉપાડ રકમ (₹),નોંધ\n';

    works.forEach(w => {
      const spWorkers = (w.smallPoleWorkers || []).map(k => WORKER_NAMES[k] || k).join(';');
      const bpWorkers = (w.bigPoleWorkers || []).map(k => WORKER_NAMES[k] || k).join(';');
      const cleanNote = (w.notes || '').replace(/"/g, '""');

      csvContent += `"${w.date}","કામ હિસાબ",${w.lines || 0},${w.smallPoles || 0},"${spWorkers}",${w.bigPoles || 0},"${bpWorkers}",${(w.lineEarningsPaise / 100).toFixed(2)},${(w.smallPoleFamilyPaise / 100).toFixed(2)},${(w.bigPoleFamilyPaise / 100).toFixed(2)},${(w.combinedFamilyPaise / 100).toFixed(2)},"${cleanNote}"\n`;
    });

    payments.forEach(p => {
      const cleanNote = (p.notes || '').replace(/"/g, '""');
      csvContent += `"${p.date}","ફેક્ટરી ઉપાડ / જમા",0,0,"",0,"",0.00,0.00,0.00,${(p.amountPaise / 100).toFixed(2)},"${cleanNote}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const dateStr = getTodayDateString().replace(/-/g, '_');
    a.href = url;
    a.download = `husen_hisab_excel_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('એક્સેલ CSV ફાઇલ ડાઉનલોડ થઈ ગઈ!');
  } catch (err) {
    console.error(err);
    showToast('CSV બનાવવામાં ભૂલ થઈ.', true);
  }
}

async function handleImportFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed || !parsed.data) {
        showToast('અમાન્ય બેકઅપ ફાઇલ (Invalid file structure)', true);
        return;
      }

      const worksCount = parsed.data.workRecords?.length || 0;
      const payCount = parsed.data.paymentRecords?.length || 0;

      showConfirmDialog({
        title: 'બેકઅપ રિસ્ટોર કરવો છે?',
        message: `આ ફાઇલમાં ${worksCount} કામ હિસાબ અને ${payCount} જમા રેકોર્ડ છે. હાલનો ડેટા બદલાઈ જશે. શું આપ આગળ વધવા માંગો છો?`,
        onConfirm: async () => {
          await hisabDB.importFullBackup(parsed);
          showToast('બેકઅપ સફળતાપૂર્વક રિસ્ટોર થયો!');
          renderDashboard();
          renderHistory();
          renderMonthlyReport();
        }
      });
    } catch (err) {
      console.error(err);
      showToast('ફાઇલ વાંચવામાં ભૂલ થઈ: ' + err.message, true);
    }
  };
  reader.readAsText(file);
}

// -----------------------------------------------------------------
// INITIALIZATION & EVENT LISTENERS
// -----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  // Set default dates
  const today = getTodayDateString();
  const currentMonth = getCurrentMonthString();

  const workDateInput = document.getElementById('work-date');
  if (workDateInput) workDateInput.value = today;

  const payDateInput = document.getElementById('payment-date');
  if (payDateInput) payDateInput.value = today;

  const reportMonthInput = document.getElementById('report-month-picker');
  if (reportMonthInput) reportMonthInput.value = currentMonth;

  // Initialize DB and initial render
  await hisabDB.readyPromise;
  await renderDashboard();
  updateLiveWorkPreview();

  // Bottom Navigation tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      switchTab(target);
    });
  });

  // Quick Action Buttons
  document.getElementById('quick-add-work').addEventListener('click', () => {
    switchTab('tab-new');
    document.getElementById('btn-mode-work').click();
  });

  document.getElementById('quick-add-payment').addEventListener('click', () => {
    switchTab('tab-new');
    document.getElementById('btn-mode-payment').click();
  });

  document.getElementById('btn-quick-payment-top').addEventListener('click', () => {
    switchTab('tab-new');
    document.getElementById('btn-mode-payment').click();
  });

  document.getElementById('dash-view-all-btn').addEventListener('click', () => {
    switchTab('tab-history');
  });

  // Tab 2 Mode toggle: Work vs Payment
  document.getElementById('btn-mode-work').addEventListener('click', (e) => {
    document.getElementById('btn-mode-work').classList.add('active');
    document.getElementById('btn-mode-payment').classList.remove('active');
    document.getElementById('form-work-container').style.display = 'block';
    document.getElementById('form-payment-container').style.display = 'none';
  });

  document.getElementById('btn-mode-payment').addEventListener('click', (e) => {
    document.getElementById('btn-mode-payment').classList.add('active');
    document.getElementById('btn-mode-work').classList.remove('active');
    document.getElementById('form-work-container').style.display = 'none';
    document.getElementById('form-payment-container').style.display = 'block';
  });

  // Live preview events
  ['small-lines', 'small-poles', 'big-poles'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateLiveWorkPreview);
      el.addEventListener('change', updateLiveWorkPreview);
    }
  });

  document.querySelectorAll('input[name="sp_worker"], input[name="bp_worker"]').forEach(cb => {
    cb.addEventListener('change', updateLiveWorkPreview);
  });

  // Edit live preview events
  ['edit-small-lines', 'edit-small-poles', 'edit-big-poles'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateEditLiveWorkPreview);
      el.addEventListener('change', updateEditLiveWorkPreview);
    }
  });

  document.querySelectorAll('input[name="edit_sp_worker"], input[name="edit_bp_worker"]').forEach(cb => {
    cb.addEventListener('change', updateEditLiveWorkPreview);
  });

  // Form Submits
  document.getElementById('work-form').addEventListener('submit', handleWorkFormSubmit);
  document.getElementById('payment-form').addEventListener('submit', handlePaymentFormSubmit);
  document.getElementById('edit-work-form').addEventListener('submit', handleEditWorkFormSubmit);
  document.getElementById('edit-payment-form').addEventListener('submit', handleEditPaymentFormSubmit);

  // Close Modals
  document.getElementById('modal-edit-work-close').addEventListener('click', () => {
    document.getElementById('modal-edit-work').classList.remove('active');
  });
  document.getElementById('modal-edit-payment-close').addEventListener('click', () => {
    document.getElementById('modal-edit-payment').classList.remove('active');
  });

  // History Filter Buttons
  document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      historyFilterType = btn.getAttribute('data-filter');
      renderHistory();
    });
  });

  document.getElementById('history-search').addEventListener('input', renderHistory);
  document.getElementById('history-month-filter').addEventListener('change', renderHistory);

  // Report Month Picker & Print
  document.getElementById('report-month-picker').addEventListener('change', renderMonthlyReport);
  document.getElementById('btn-print-report').addEventListener('click', () => {
    window.print();
  });

  // Backup & Restore
  document.getElementById('btn-export-json').addEventListener('click', exportJSONBackup);
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);

  const fileInput = document.getElementById('import-file-input');
  document.getElementById('btn-trigger-import').addEventListener('click', () => {
    fileInput.click();
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImportFile(e.target.files[0]);
      e.target.value = '';
    }
  });

  // Download ZIP button
  document.getElementById('btn-download-zip').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = 'husen-hisab.zip';
    a.download = 'husen-hisab.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('ZIP ફાઇલ ડાઉનલોડ શરૂ થઈ!');
  });

  // Clear All Data
  document.getElementById('btn-clear-all-data').addEventListener('click', () => {
    showConfirmDialog({
      title: 'તમામ ડેટા ડિલીટ કરવો છે?',
      message: 'આ ક્રિયાથી તમામ કામ હિસાબ અને જમા રકમો કાયમ માટે ભૂંસાઈ જશે! શું આપ ખરેખર આગળ વધવા માંગો છો?',
      onConfirm: async () => {
        await hisabDB.clearAllData();
        showToast('તમામ હિસાબ ડેટા સાફ થઈ ગયો.');
        renderDashboard();
        renderHistory();
        renderMonthlyReport();
      },
      icon: '🗑️'
    });
  });

  // Service Worker Registration
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('service-worker.js');
      console.log('Husen Hisab Service Worker Registered.');
    } catch (e) {
      console.warn('Service Worker registration skipped/failed:', e);
    }
  }

  // PWA Install Prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const installBtn = document.getElementById('btn-install-pwa');
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
      installBtn.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          showToast('એપ સફળતાપૂર્વક ઇન્સ્ટોલ થઈ!');
          installBtn.style.display = 'none';
        }
        deferredInstallPrompt = null;
      });
    }
  });
});
