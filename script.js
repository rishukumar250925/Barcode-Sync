const firebaseConfig = {
  apiKey: "AIzaSyCBt90FwYp9Qsxa_ByzgbfDbEcPIXY43bA",
  authDomain: "barcode-sync-af05a.firebaseapp.com",
  projectId: "barcode-sync-af05a",
  storageBucket: "barcode-sync-af05a.firebasestorage.app",
  messagingSenderId: "639065411028",
  appId: "1:639065411028:web:47a65dd3a2e20901ccda41",
  measurementId: "G-LJ7VLZH8ZE",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbx_zjnBVMNM0LMma-nxnNwH90GrtwegqFSMr97C3MGJPTdqxphtk_B6dBs-aabgYkFr/exec";
const SECRET_TOKEN = "b8f3a9c2-6d4e-4b1f-9a7c-2e3d1f5b6a7c";

const els = {
  reader: document.getElementById("reader"),
  placeholder: document.getElementById("cameraPlaceholder"),
  lockedIcon: document.getElementById("lockedIcon"),
  placeholderTitle: document.getElementById("placeholderTitle"),
  placeholderText: document.getElementById("placeholderText"),
  quickSetupBtn: document.getElementById("quickSetupBtn"),
  permHint: document.getElementById("permHint"),
  scanOverlay: document.getElementById("scanOverlay"),
  overlayCode: document.getElementById("overlayCode"),
  overlayTitle: document.getElementById("overlayTitle"),
  overlayIcon: document.getElementById("overlayIconContainer"),
  scanList: document.getElementById("scanList"),
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  cameraSelect: document.getElementById("cameraSelect"),
  settingsPanel: document.getElementById("settingsPanel"),
  settingsBackdrop: document.getElementById("settingsBackdrop"),
  emptyState: document.getElementById("emptyState"),
  scanCount: document.getElementById("scanCount"),
  debugLog: document.getElementById("debugLog"),
  laserLine: document.getElementById("laserLine"),
  operatorBadge: document.getElementById("operatorBadge"),
  badgeName: document.getElementById("badgeName"),
  setupIndicator: document.getElementById("setupIndicator"),

  inputName: document.getElementById("inputName"),
  inputEmail: document.getElementById("inputEmail"),
  inputCountryCode: document.getElementById("inputCountryCode"),
  inputPhone: document.getElementById("inputPhone"),

  verifyBtn: document.getElementById("verifyBtn"),
  verificationBox: document.getElementById("verificationStatusBox"),
};

let html5QrCode;
let isScanning = false;
let isProcessing = false;
let scannedCodes = JSON.parse(localStorage.getItem("scannedData") || "[]");
let userProfile = JSON.parse(localStorage.getItem("userProfile") || "null");

let audioCtx;
function initAudio() {
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playSound(type) {
  if (!audioCtx) initAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === "success") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      1200,
      audioCtx.currentTime + 0.1
    );
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } else if (type === "error") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (auth.isSignInWithEmailLink(window.location.href)) {
    handleEmailReturn();
  }

  renderList();
  checkProfileStatus();

  Html5Qrcode.getCameras()
    .then((cameras) => {
      if (cameras && cameras.length) {
        els.cameraSelect.innerHTML = "";
        cameras.forEach((cam) => {
          const opt = document.createElement("option");
          opt.value = cam.id;
          opt.text = cam.label || `Camera ${cam.id}`;
          els.cameraSelect.appendChild(opt);
        });
        const backCam = cameras.find(
          (c) =>
            c.label.toLowerCase().includes("back") ||
            c.label.toLowerCase().includes("environment")
        );
        if (backCam) els.cameraSelect.value = backCam.id;
      }
    })
    .catch((err) => {
      console.log("Permission/Camera Error", err);
      if (els.permHint) els.permHint.classList.remove("hidden");
    });
});

function initiateEmailAuth() {
  const name = els.inputName.value.trim();
  const email = els.inputEmail.value.trim();
  const phone = els.inputPhone.value.trim();
  const countryCode = els.inputCountryCode.value;

  if (!name || !email || !phone)
    return showToast("Please fill all fields", "error");
  if (!email.includes("@")) return showToast("Invalid Email", "error");
  if (phone.length < 5) return showToast("Invalid Phone Number", "error");

  els.verifyBtn.disabled = true;
  els.verifyBtn.innerHTML = "Sending Link...";

  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };

  auth
    .sendSignInLinkToEmail(email, actionCodeSettings)
    .then(() => {
      window.localStorage.setItem("emailForSignIn", email);
      window.localStorage.setItem("pendingName", name);
      window.localStorage.setItem("pendingPhone", phone);
      window.localStorage.setItem("pendingCountry", countryCode);

      els.verificationBox.classList.remove("hidden");
      els.verifyBtn.classList.add("hidden");
      els.inputEmail.disabled = true;

      showToast("Link Sent! Check your Email.", "success");
    })
    .catch((error) => {
      console.error(error);
      els.verifyBtn.disabled = false;
      els.verifyBtn.innerHTML = "Verify & Save Profile";
      showToast("Error: " + error.message, "error");
    });
}

function handleEmailReturn() {
  let email = window.localStorage.getItem("emailForSignIn");

  if (!email) {
    email = window.prompt("Please provide your email for confirmation");
  }

  if (email) {
    showToast("Verifying Email...", "neutral");

    auth
      .signInWithEmailLink(email, window.location.href)
      .then((result) => {
        window.localStorage.removeItem("emailForSignIn");

        const pName = window.localStorage.getItem("pendingName") || "User";
        const pPhone = window.localStorage.getItem("pendingPhone") || "";
        const pCountry = window.localStorage.getItem("pendingCountry") || "+91";

        userProfile = {
          name: pName,
          email: result.user.email,
          phone: pPhone,
          countryCode: pCountry,
          verified: true,
        };

        localStorage.setItem("userProfile", JSON.stringify(userProfile));

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        localStorage.removeItem("pendingName");
        localStorage.removeItem("pendingPhone");
        localStorage.removeItem("pendingCountry");

        showToast("Verification Successful!", "success");
        checkProfileStatus();

        if (!els.settingsPanel.classList.contains("translate-x-full")) {
          setTimeout(toggleSettings, 1500);
        }
      })
      .catch((error) => {
        showToast("Verification Failed: " + error.code, "error");
      });
  }
}

function checkProfileStatus() {
  if (userProfile && userProfile.name && userProfile.verified === true) {
    // UNLOCKED STATE
    els.startBtn.disabled = false;
    els.startBtn.classList.remove(
      "bg-gray-300",
      "text-gray-500",
      "cursor-not-allowed"
    );
    els.startBtn.classList.add(
      "bg-indigo-600",
      "text-white",
      "active:bg-indigo-700",
      "shadow-md"
    );
    els.startBtn.innerHTML = "Scan Barcode";

    els.badgeName.textContent = userProfile.name;
    els.operatorBadge.classList.remove("hidden");
    els.setupIndicator.classList.add("hidden");

    els.placeholderTitle.textContent = "Scanner Ready";
    els.placeholderText.textContent = "Camera is currently inactive.";
    els.lockedIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;
    els.quickSetupBtn.classList.add("hidden");

    if (els.inputName) els.inputName.value = userProfile.name;
    if (els.inputEmail) els.inputEmail.value = userProfile.email;
    if (els.inputPhone) els.inputPhone.value = userProfile.phone;

    if (els.verifyBtn) els.verifyBtn.classList.add("hidden");
    if (els.verificationBox) els.verificationBox.classList.add("hidden");
  } else {
    if (userProfile) {
      userProfile = null;
      localStorage.removeItem("userProfile");
    }

    els.startBtn.disabled = true;
    els.startBtn.classList.remove(
      "bg-indigo-600",
      "text-white",
      "active:bg-indigo-700",
      "shadow-md"
    );
    els.startBtn.classList.add(
      "bg-gray-300",
      "text-gray-500",
      "cursor-not-allowed"
    );
    els.startBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> LOCKED `;

    els.setupIndicator.classList.remove("hidden");
    els.operatorBadge.classList.add("hidden");
    els.placeholderTitle.textContent = "Device Locked";
    els.placeholderText.textContent = "Please complete setup to unlock.";
    els.lockedIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>`;
    els.quickSetupBtn.classList.remove("hidden");

    if (els.verifyBtn) {
      els.verifyBtn.classList.remove("hidden");
      els.verifyBtn.disabled = false;
      els.verifyBtn.innerHTML = "Verify & Save Profile";
    }
    if (els.verificationBox) els.verificationBox.classList.add("hidden");
    if (els.inputEmail) els.inputEmail.disabled = false;
  }
}

async function startScanning() {
  if (!userProfile || !userProfile.verified) {
    showToast("Locked! Setup Profile First.", "error");
    toggleSettings();
    return;
  }
  if (isScanning) return;
  initAudio();
  els.debugLog.classList.add("hidden");

  try {
    html5QrCode = new Html5Qrcode("reader", { verbose: false });
    const cameraId = els.cameraSelect.value;
    const config = {
      fps: 40,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const width = Math.floor(minEdge * 0.9);
        const height = Math.floor(width * 0.5);
        return { width, height };
      },
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    };
    const camConfig = cameraId
      ? { deviceId: { exact: cameraId } }
      : { facingMode: "environment" };

    await html5QrCode.start(camConfig, config, onScanSuccess, onScanFailure);
    isScanning = true;
    els.placeholder.classList.add("hidden");
    els.laserLine.classList.remove("hidden");
    els.startBtn.disabled = true;
    els.startBtn.classList.add("opacity-50", "cursor-not-allowed");
    els.stopBtn.disabled = false;
    els.stopBtn.classList.remove("bg-white", "text-gray-700");
    els.stopBtn.classList.add("bg-rose-500", "text-white", "border-rose-600");
    showToast("Scanner Active", "success");
  } catch (err) {
    console.error(err);
    showToast("Camera Failed", "error");
    els.debugLog.classList.remove("hidden");
    els.debugLog.textContent = "Error: " + err;
  }
}

async function stopScanning() {
  if (!html5QrCode || !isScanning) return;
  try {
    await html5QrCode.stop();
    html5QrCode.clear();
    isScanning = false;
    els.placeholder.classList.remove("hidden");
    els.laserLine.classList.add("hidden");
    els.startBtn.disabled = false;
    els.startBtn.classList.remove("opacity-50", "cursor-not-allowed");
    els.stopBtn.disabled = true;
    els.stopBtn.classList.remove(
      "bg-rose-500",
      "text-white",
      "border-rose-600"
    );
    els.stopBtn.classList.add("bg-white", "text-gray-700");
    showToast("Scanner Stopped", "neutral");
  } catch (err) {
    console.error("Failed to stop", err);
  }
}

function onScanSuccess(decodedText, decodedResult) {
  if (isProcessing) return;
  const existsLocally = scannedCodes.some((item) => item.code === decodedText);
  if (existsLocally) {
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    showToast("Already in local list", "error");
    return;
  }

  isProcessing = true;
  const now = Date.now();
  showOverlay("processing", decodedText);

  const newItem = {
    code: decodedText,
    format: decodedResult?.result?.format?.formatName || "BARCODE",
    timestamp: new Date().toISOString(),
    status: "syncing",
    id: now,
  };
  scannedCodes.unshift(newItem);
  saveToLocal();
  renderList();
  syncItem(newItem);
}

function onScanFailure(error) {}

async function syncItem(item) {
  const index = scannedCodes.findIndex((i) => i.id === item.id);
  if (index === -1) {
    isProcessing = false;
    hideOverlay();
    return;
  }
  const currentUser = userProfile ? userProfile.name : "Unknown";
  const payload = {
    token: SECRET_TOKEN,
    code: item.code,
    format: item.format,
    user: currentUser,
    email: userProfile?.email,
    device: navigator.userAgent,
  };

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (result.status === "ok") {
      scannedCodes[index].status = "synced";
      showOverlay("success", item.code);
      if (navigator.vibrate) navigator.vibrate(200);
      playSound("success");
    } else if (result.status === "duplicate") {
      scannedCodes[index].status = "duplicate";
      scannedCodes[index].duplicateInfo = result.message;
      showOverlay("duplicate", item.code, result.message);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
      playSound("error");
      showToast("Duplicate detected!", "error");
    } else {
      scannedCodes[index].status = "error";
      showToast("Error: " + (result.message || "Unknown"), "error");
      hideOverlay();
    }
  } catch (e) {
    console.error("Sync failed", e);
    scannedCodes[index].status = "error";
    showToast("Network Error", "error");
    hideOverlay();
  }
  saveToLocal();
  renderList();
  setTimeout(() => {
    hideOverlay();
    isProcessing = false;
  }, 2000);
}

function toggleSettings() {
  const panel = els.settingsPanel;
  const backdrop = els.settingsBackdrop;
  if (panel.classList.contains("translate-x-full")) {
    panel.classList.remove("translate-x-full");
    backdrop.classList.remove("hidden");
    setTimeout(() => backdrop.classList.remove("opacity-0"), 10);
  } else {
    panel.classList.add("translate-x-full");
    backdrop.classList.add("opacity-0");
    setTimeout(() => backdrop.classList.add("hidden"), 300);
  }
}
function saveToLocal() {
  localStorage.setItem("scannedData", JSON.stringify(scannedCodes));
}

function clearHistory() {
  if (
    confirm("Are you sure? This will RESET your profile and delete history!")
  ) {
    scannedCodes = [];
    userProfile = null;
    localStorage.removeItem("scannedData");
    localStorage.removeItem("userProfile");

    localStorage.removeItem("pendingName");
    localStorage.removeItem("pendingPhone");
    localStorage.removeItem("emailForSignIn");
    localStorage.removeItem("pendingCountry");

    renderList();
    checkProfileStatus();
    toggleSettings();
    window.location.reload();
  }
}

function exportCSV() {
  if (scannedCodes.length === 0)
    return showToast("Nothing to export", "neutral");
  const headers = ["Timestamp", "Code", "Format", "Status", "Details"];
  const rows = scannedCodes.map((c) => [
    c.timestamp,
    c.code,
    c.format,
    c.status,
    c.duplicateInfo || "",
  ]);
  let csvContent =
    "data:text/csv;charset=utf-8," +
    headers.join(",") +
    "\n" +
    rows.map((e) => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "scans_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function showOverlay(type, code, subText = "") {
  els.overlayCode.textContent = code;
  els.overlayCode.className = "font-mono mt-1 text-sm scale-in break-all";
  if (type === "success") {
    els.overlayIcon.className =
      "w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg mb-4 scale-in";
    els.overlayIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;
    els.overlayTitle.textContent = "Scanned!";
    els.overlayCode.classList.add("text-emerald-300");
  } else if (type === "duplicate") {
    els.overlayIcon.className =
      "w-20 h-20 bg-rose-600 rounded-full flex items-center justify-center shadow-lg mb-4 scale-in";
    els.overlayIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;
    els.overlayTitle.textContent = "Duplicate!";
    els.overlayCode.textContent = subText;
    els.overlayCode.classList.add("text-rose-300");
  } else if (type === "processing") {
    els.overlayIcon.className =
      "w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-lg mb-4 scale-in";
    els.overlayIcon.innerHTML = `<svg class="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    els.overlayTitle.textContent = "Checking...";
    els.overlayCode.classList.add("text-blue-300");
  }
  els.scanOverlay.classList.remove("hidden");
  els.scanOverlay.classList.add("flex");
  els.laserLine.classList.add("hidden");
}

function hideOverlay() {
  els.scanOverlay.classList.add("hidden");
  els.scanOverlay.classList.remove("flex");
  if (isScanning) els.laserLine.classList.remove("hidden");
}

function showToast(msg, type) {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  const toastIcon = document.getElementById("toastIcon");
  toastMsg.innerText = msg;
  let colorClass = "text-blue-400";
  if (type === "success") colorClass = "text-emerald-400";
  if (type === "error") colorClass = "text-rose-400";
  toastIcon.className = `w-5 h-5 ${colorClass}`;
  if (type === "success")
    toastIcon.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
  else if (type === "error")
    toastIcon.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
  else
    toastIcon.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
  toast.classList.remove("opacity-0", "translate-y-4");
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-4");
  }, 3500);
}

function renderList() {
  els.scanList.innerHTML = "";
  els.scanCount.textContent = scannedCodes.length;
  if (scannedCodes.length === 0) {
    els.emptyState.classList.remove("hidden");
    return;
  }
  els.emptyState.classList.add("hidden");
  scannedCodes.forEach((item) => {
    const el = document.createElement("div");
    el.className =
      "scan-item bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between";
    let statusIcon = "";
    let statusColor = "text-gray-400";
    if (item.status === "syncing") {
      statusIcon = `<svg class="animate-pulse h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>`;
    } else if (item.status === "synced") {
      statusIcon = `<svg class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
    } else if (item.status === "duplicate") {
      statusIcon = `<svg class="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
      statusColor = "text-rose-500 font-bold";
    } else {
      statusIcon = `<svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    }
    let subText = `${new Date(item.timestamp).toLocaleTimeString()} • ${
      item.status
    }`;
    if (item.status === "duplicate" && item.duplicateInfo)
      subText = item.duplicateInfo;
    el.innerHTML = `
            <div class="flex flex-col overflow-hidden w-full mr-2">
                <span class="font-mono font-bold text-gray-800 text-lg truncate">${item.code}</span>
                <span class="text-xs ${statusColor} truncate">${subText}</span>
            </div>
            <div class="flex-shrink-0">${statusIcon}</div>
        `;
    els.scanList.appendChild(el);
  });
}

els.startBtn.addEventListener("click", startScanning);
els.stopBtn.addEventListener("click", stopScanning);

