# 📤 Instagram Pending Follow Request Canceller

A browser-based JavaScript tool that automatically cancels all your pending (unanswered) Instagram follow requests — using your own Instagram data export. No third-party apps, no login credentials shared, no extensions needed.

---

## Why This Exists

Instagram doesn't give you a way to bulk-cancel follow requests you've sent that were never accepted. If you've ever cleaned up your account, you know the pain of cancelling them one by one. This script fixes that.

---

## How It Works

1. You download your own data from Instagram (just the follow requests file)
2. You run this script in your browser's developer console — while logged into Instagram
3. A small UI panel appears on the page
4. You upload your data file into the panel
5. The script reads the usernames, then cancels each pending request automatically — with safe, randomized delays between each action

Everything runs in your browser. No data leaves your machine except the cancellation requests sent to Instagram's own API (the same ones the app would send if you cancelled manually).

---

## Step-by-Step Guide

### Step 1 — Download Your Instagram Data

1. Open Instagram and go to **Settings**
2. Navigate to **Your activity → Download your information**
3. Select **"Some of your information"**
4. Under the **Connections** section, check **"Follow requests you've sent"**
5. Choose **JSON** as the format (HTML also works)
6. Request the download — Instagram will email you when it's ready (usually within minutes to a few hours)
7. Download and unzip the file

You're looking for a file called:
```
pending_follow_requests.json
```
or
```
pending_follow_requests.html
```

It's usually found inside a `connections/followers_and_following/` folder.

---

### Step 2 — Open Instagram in Your Browser

Go to [instagram.com](https://www.instagram.com) and make sure you're **logged in**.

> ✅ Use Google Chrome or Microsoft Edge for best compatibility.

---

### Step 3 — Open the Developer Console

| Browser | Shortcut |
|---|---|
| Chrome / Edge | `F12` or `Ctrl + Shift + J` (Windows) / `Cmd + Option + J` (Mac) |
| Firefox | `F12` or `Ctrl + Shift + K` |

Click on the **Console** tab.

---

### Step 4 — Paste and Run the Script

1. Open the file `instagram_unfollow_pending.js` from this repo
2. Select all the code (`Ctrl+A` / `Cmd+A`)
3. Copy it
4. Paste it into the console
5. Press **Enter**

A panel will appear in the top-right corner of the Instagram page.

---

### Step 5 — Upload Your Data File

In the panel that appears:

1. Click the file upload button
2. Select the `pending_follow_requests.json` (or `.html`) file you downloaded from Instagram
3. The script will read it and show you how many pending requests were found

---

### Step 6 — Start

Click **▶️ Start** and let it run.

The script will:
- Skip any requests sent in the **last 24 hours** (to avoid accidental cancellations)
- Cancel the rest one by one, with a **random 1–15 second delay** between each
- Show a live progress bar and log of every action

You can **⏸️ Pause** and **▶️ Resume** at any time, or **⏹️ Stop** to end early.

---

## Safety Features

| Feature | Detail |
|---|---|
| Random delays | Waits 1–15 seconds randomly between each cancellation to mimic human behaviour |
| Skips recent requests | Any request sent in the last 24 hours is automatically skipped |
| Retry logic | If a cancellation fails, it retries up to 3 times before logging it as failed |
| Pause / Resume | You can pause the process at any point without losing progress |
| No credentials stored | The script uses your existing browser session — no passwords or tokens are stored anywhere |

---

## Supported File Formats

The script handles multiple Instagram export formats automatically:

- `.json` — standard Instagram data export format
- `.html` — older or alternative Instagram export format

It also handles different internal JSON structures Instagram has used over time, so it should work regardless of when you downloaded your data.

---

## What It Does NOT Do

- It does not unfollow accounts you already follow — only cancels **pending** requests
- It does not store, transmit, or log any of your data
- It does not require any browser extension or external service
- It does not touch requests sent in the last 24 hours

---

## Troubleshooting

**"No pending follow requests found"**
Make sure you uploaded the correct file. It should be named `pending_follow_requests.json` or `pending_follow_requests.html`. Double-check the folder inside your Instagram data export.

**"Failed to cancel @username"**
This usually means that account was deleted, changed its username, or Instagram temporarily rate-limited the request. The script will retry up to 3 times automatically. You can also try stopping and restarting after a few minutes.

**The panel doesn't appear**
Make sure you're on instagram.com and logged in before pasting the script. Some browser extensions (like ad blockers) can interfere — try disabling them or using a clean browser window.

**Instagram logged me out mid-process**
Log back in, re-paste the script, and re-upload your data file. The script will start from the beginning, but any requests already cancelled won't be affected (they're already gone).

---

## Disclaimer

This script interacts with Instagram's internal API using your own logged-in session — similar to what happens when you manually cancel a follow request. Use it responsibly. Running it too aggressively or too frequently could result in a temporary action block from Instagram. The built-in delays are designed to keep things safe, but use at your own discretion.

This project is not affiliated with or endorsed by Instagram or Meta.

---

## Author

Pilot. Psychology grad. Vibe coder.  
Sharing scripts I actually find useful — take what helps.
