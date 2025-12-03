# Barcode-Sync
A distributed, cloud-synced Barcode Validation System deployed on Netlify with a custom domain. Features real-time duplicate detection to ensure verification consistency across multiple devices using Firebase Auth &amp; Google Apps Script.

<div align="center">

  <h1>📱 BarcodeSync</h1>
  
  <p>
    <b>A Next-Gen Web Based Inventory & Attendance Scanner</b>
  </p>

  <p>
    <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Backend-Firebase-orange?style=flat-square&logo=firebase" alt="Firebase"></a>
    <a href="https://developers.google.com/apps-script"><img src="https://img.shields.io/badge/Sync-Google%20Apps%20Script-blue?style=flat-square&logo=google-sheets" alt="Google Sheets"></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind"></a>
    <img src="https://img.shields.io/badge/Status-Active-success?style=flat-square" alt="Status">
  </p>

  <h3>Developed with ❤️ by  <b>Rishu & Aditya</b></h3>

</div>

---

## 📖 Overview

**BarcodeSync** is a powerful Progressive Web App (PWA) capable of transforming any smartphone into a professional-grade barcode and QR code scanner. Unlike traditional scanners, this application syncs data in **real-time** to Google Sheets, manages user authentication via Firebase, and provides instant audio/haptic feedback.

It is designed for inventory management, event ticketing, and attendance tracking without the need for expensive hardware.

---

## ✨ Key Features

### 📷 Advanced Scanning
- **Multi-Camera Support:** Auto-detects environment (back) cameras.
- **Laser UI:** Professional scanning interface with laser line animation.
- **Format Support:** Reads 1D Barcodes, QR Codes, and more using `html5-qrcode`.

### ☁️ Cloud & Data Sync
- **Google Sheets Integration:** Scanned data is pushed instantly to a master sheet via Google Apps Script.
- **Duplicate Protection:** Checks both local history and server data to prevent double entries.
- **Offline History:** Stores scans in LocalStorage if the network is flaky.

### 🔐 Security & Auth
- **Firebase Auth:** Secure passwordless login using Email Links.
- **Profile Management:** Captures User Name, Phone, and Country Code for audit trails.
- **API Token:** Uses a secret token handshake to secure the Google Script endpoint.

### ⚡ User Experience (UX)
- **Audio Feedback:** Custom generated sound waves (Oscillators) for Success (Triangle wave) and Error (Sawtooth wave) alerts. No external MP3 files needed.
- **CSV Export:** One-click export of local session data to CSV.
- **Mobile First:** Fully responsive UI built with Tailwind CSS.

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | HTML5, Vanilla JavaScript |
| **Styling** | Tailwind CSS (CDN) |
| **Scanner Engine** | html5-qrcode (v2.3.8) |
| **Authentication** | Firebase (v9.23.0) |
| **Hosting** | Netlify |
| **Backend Logic** | Google Apps Script (Web App) |
| **Database** | Google Sheets |

---

## ⚙️ Configuration & Setup

Since this project uses client-side JavaScript, you need to configure your API keys in `script.js`.

### 1. Clone the Repository
```bash
git clone https://github.com/rishukumar250925/barcode-sync.git
```
```bash
cd barcode-sync
```

## 2. Configure Firebase
Open script.js and update the firebaseConfig object:
```bash
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
};
```
## 3. Configure Google Script
Deploy your Google Apps Script as a Web App and paste the URL:
```bash
const WEB_APP_URL = "[https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec](https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec)";
const SECRET_TOKEN = "your-custom-uuid-token"; // Must match the token in your .gs file
```
## 4. Run Locally
To access the camera, the browser requires a Secure Context (HTTPS).

VS Code: Install "Live Server" extension -> Right Click index.html -> "Open with Live Server".

Localhost: Camera works on localhost without HTTPS.

## 🚀 How to Use
## **Authentication:**

Open the app.

Click "Open Settings".

Enter Name, Email, Phone -> **Click Verify.**

Click the link sent to your email to unlock the device.

## Scanning:

Once unlocked, the "LOCKED" button turns into "Scan Barcode".

Point the camera at a code.

Beep! (Success sound) -> Data sent to Google Sheet.

Buzz! (Error sound) -> If duplicate found.

## Export:

Go to Settings -> Click "Export to CSV" to download your daily report.



<div align="center">  <p>© 2025 BarcodeSync Project</p> </div>

