# SendGrid Batch Email Automation for RECOF

This repository contains a Google Apps Script function that sends automated marketing emails in batches using the SendGrid API. It was built for Real Estate Campus of Florida (RECOF) to streamline email outreach with improved deliverability.

---

## 📤 Script: `sendBatchEmailsWithSendGrid.js`

### 🔧 What it does:
- Sends up to **500 emails per batch** using SendGrid
- Reads contact data from a Google Sheet
- Rotates through pre-designed templates
- Logs each send with date and template ID
- Skips unsubscribed or flagged emails
- Ideal for daily or hourly email automation

---

## ⚙️ Setup Instructions

1. **Create a SendGrid API key**
   - Go to: [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys)
   - Copy your key (save it somewhere secure)

2. **Replace placeholder with your key**
   ```js
   const SENDGRID_API_KEY = 'YOUR_API_KEY_HERE';
