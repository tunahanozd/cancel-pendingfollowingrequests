/**
 * Instagram Pending Follow Request Cancellation Script
 * 
 * INSTRUCTIONS:
 * 1. Go to Instagram.com and make sure you're logged in
 * 2. Open Chrome Developer Console (F12 or Ctrl+Shift+J)
 * 3. Paste this entire script and press Enter
 * 4. When prompted, upload your Instagram data JSON file
 * 5. The script will automatically cancel all pending requests
 *    - Skips requests sent in the last 24 hours
 *    - Waits 1–15 seconds randomly between each cancellation
 * 
 * SAFETY FEATURES:
 * - Random 1–15 second delay between each request to avoid Instagram blocks
 * - Skips follow requests sent in the last 24 hours
 * - Progress tracking and resume capability
 * - Detailed logging of all actions
 * - Pause/resume functionality
 */

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        MIN_DELAY: 1000,       // Minimum delay between requests (1 second)
        MAX_DELAY: 15000,      // Maximum delay between requests (15 seconds)
        MAX_RETRIES: 3,        // Maximum retry attempts per request
        RECENT_HOURS: 24       // Skip requests sent within this many hours
    };
    
    // State management
    let state = {
        pendingRequests: [],   // { username, timestamp } objects
        skippedRecent: [],     // usernames skipped due to being recent
        currentIndex: 0,
        successCount: 0,
        failureCount: 0,
        skippedCount: 0,
        isPaused: false,
        isRunning: false,
        nextDelay: 0
    };
    
    // UI Elements
    const styles = `
        #instagram-cancel-ui {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 2px solid #e1306c;
            border-radius: 12px;
            padding: 20px;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 420px;
            color: #262626;
        }
        #instagram-cancel-ui h3 {
            margin: 0 0 15px 0;
            color: #e1306c;
            font-size: 18px;
        }
        #instagram-cancel-ui .status {
            margin: 10px 0;
            font-size: 14px;
        }
        #instagram-cancel-ui .progress-bar {
            width: 100%;
            height: 20px;
            background: #efefef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        #instagram-cancel-ui .progress-fill {
            height: 100%;
            background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
            transition: width 0.3s ease;
        }
        #instagram-cancel-ui button {
            background: #e1306c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin: 5px 5px 0 0;
            font-size: 14px;
            font-weight: 600;
        }
        #instagram-cancel-ui button:hover {
            background: #c13584;
        }
        #instagram-cancel-ui button:disabled {
            background: #dbdbdb;
            cursor: not-allowed;
        }
        #instagram-cancel-ui .log {
            max-height: 200px;
            overflow-y: auto;
            background: #fafafa;
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
            font-size: 12px;
        }
        #instagram-cancel-ui .log-entry {
            margin: 3px 0;
            padding: 3px 0;
            border-bottom: 1px solid #efefef;
        }
        #instagram-cancel-ui .success { color: #0095f6; }
        #instagram-cancel-ui .error { color: #ed4956; }
        #instagram-cancel-ui .info { color: #8e8e8e; }
        #instagram-cancel-ui .skip { color: #f5a623; }
        #instagram-cancel-ui input[type="file"] {
            margin: 10px 0;
            font-size: 13px;
        }
        #instagram-cancel-ui .delay-badge {
            display: inline-block;
            background: #f0f0f0;
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 12px;
            color: #555;
            margin-left: 6px;
        }
    `;
    
    // Create UI
    function createUI() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        
        const ui = document.createElement('div');
        ui.id = 'instagram-cancel-ui';
        ui.innerHTML = `
            <h3>📤 Instagram Pending Request Canceller</h3>
            <input type="file" id="data-file-input" accept=".html,.json" />
            <div class="status">
                <div><strong>Total Found:</strong> <span id="total-count">0</span></div>
                <div><strong>Skipped (last 24h):</strong> <span id="skipped-count">0</span></div>
                <div><strong>To Process:</strong> <span id="to-process-count">0</span></div>
                <div><strong>Processed:</strong> <span id="processed-count">0</span></div>
                <div><strong>Successful:</strong> <span id="success-count">0</span></div>
                <div><strong>Failed:</strong> <span id="failed-count">0</span></div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
            </div>
            <div id="current-status" class="info" style="margin: 10px 0; font-weight: 600;">
                Upload your Instagram data file to begin
            </div>
            <div>
                <button id="start-btn" disabled>▶️ Start</button>
                <button id="pause-btn" disabled>⏸️ Pause</button>
                <button id="resume-btn" disabled>▶️ Resume</button>
                <button id="stop-btn" disabled>⏹️ Stop</button>
            </div>
            <div class="log" id="log-container"></div>
        `;
        document.body.appendChild(ui);
        
        document.getElementById('data-file-input').addEventListener('change', handleFileUpload);
        document.getElementById('start-btn').addEventListener('click', startCancellation);
        document.getElementById('pause-btn').addEventListener('click', pauseCancellation);
        document.getElementById('resume-btn').addEventListener('click', resumeCancellation);
        document.getElementById('stop-btn').addEventListener('click', stopCancellation);
    }
    
    // Log function
    function log(message, type = 'info') {
        const logContainer = document.getElementById('log-container');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const timestamp = new Date().toLocaleTimeString();
        entry.textContent = `[${timestamp}] ${message}`;
        logContainer.insertBefore(entry, logContainer.firstChild);
        console.log(`[Instagram Canceller] ${message}`);
    }
    
    // Update UI
    function updateUI() {
        const toProcess = state.pendingRequests.length;
        document.getElementById('total-count').textContent = toProcess + state.skippedRecent.length;
        document.getElementById('skipped-count').textContent = state.skippedCount;
        document.getElementById('to-process-count').textContent = toProcess;
        document.getElementById('processed-count').textContent = state.currentIndex;
        document.getElementById('success-count').textContent = state.successCount;
        document.getElementById('failed-count').textContent = state.failureCount;
        
        const progress = toProcess > 0
            ? (state.currentIndex / toProcess) * 100
            : 0;
        document.getElementById('progress-fill').style.width = `${progress}%`;
    }
    
    // Random delay between MIN and MAX
    function randomDelay() {
        return Math.floor(Math.random() * (CONFIG.MAX_DELAY - CONFIG.MIN_DELAY + 1)) + CONFIG.MIN_DELAY;
    }
    
    // Handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                if (file.name.endsWith('.html')) {
                    parseHTMLFile(content);
                } else {
                    const data = JSON.parse(content);
                    extractPendingRequests(data);
                }
            } catch (error) {
                log('Error parsing file: ' + error.message, 'error');
                alert('Invalid file format. Please upload your Instagram pending_follow_requests.html or .json file.');
            }
        };
        reader.readAsText(file);
    }
    
    // Parse HTML file from Instagram data export
    function parseHTMLFile(htmlContent) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            
            const scripts = doc.querySelectorAll('script');
            let jsonData = null;
            
            for (let script of scripts) {
                const scriptContent = script.textContent.trim();
                if (scriptContent.includes('window._sharedData') || scriptContent.includes('window.__additionalDataLoaded')) {
                    const jsonMatch = scriptContent.match(/=\s*(\{.*\}|\[.*\]);?\s*$/s);
                    if (jsonMatch) {
                        jsonData = JSON.parse(jsonMatch[1]);
                        break;
                    }
                }
            }
            
            if (!jsonData) {
                const usernames = [];
                
                const links = doc.querySelectorAll('a[href*="instagram.com/"]');
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    const match = href.match(/instagram\.com\/([^\/\?]+)/);
                    if (match && match[1]) {
                        const username = match[1];
                        if (!['explore', 'accounts', 'direct', 'p', 'tv', 'reel', 'reels'].includes(username)) {
                            usernames.push({ username, timestamp: null });
                        }
                    }
                });
                
                const divs = doc.querySelectorAll('div');
                divs.forEach(div => {
                    const text = div.textContent.trim();
                    if (/^@?[a-zA-Z0-9._]+$/.test(text) && text.length > 2 && text.length < 31) {
                        const username = text.replace('@', '');
                        if (!usernames.find(u => u.username === username)) {
                            usernames.push({ username, timestamp: null });
                        }
                    }
                });
                
                if (usernames.length > 0) {
                    filterAndSetRequests(usernames);
                    return;
                }
            }
            
            if (jsonData) {
                extractPendingRequests(jsonData);
                return;
            }
            
            throw new Error('No usernames found in the HTML file');
            
        } catch (error) {
            log('Error parsing HTML file: ' + error.message, 'error');
            alert('Could not parse the HTML file. Please make sure you uploaded the correct pending_follow_requests.html file from your Instagram data.');
        }
    }
    
    // Extract pending requests from Instagram data JSON
    function extractPendingRequests(data) {
        let pendingList = [];
        
        if (data.relationships_follow_requests_sent) {
            pendingList = data.relationships_follow_requests_sent;
        } else if (data.follow_requests_sent) {
            pendingList = data.follow_requests_sent;
        } else if (data.pending_follow_requests) {
            pendingList = data.pending_follow_requests;
        } else if (Array.isArray(data)) {
            pendingList = data;
        }
        
        // Extract username + timestamp
        const parsed = pendingList.map(item => {
            let username = null;
            let timestamp = null;
            
            if (typeof item === 'string') {
                username = item;
            } else if (item.string_list_data && item.string_list_data[0]) {
                username = item.string_list_data[0].value;
                // Instagram exports timestamps in seconds (Unix)
                timestamp = item.string_list_data[0].timestamp || null;
            } else if (item.username) {
                username = item.username;
                timestamp = item.timestamp || null;
            } else if (item.href) {
                const match = item.href.match(/instagram\.com\/([^\/]+)/);
                username = match ? match[1] : null;
                timestamp = item.timestamp || null;
            }
            
            return username ? { username, timestamp } : null;
        }).filter(Boolean);
        
        if (parsed.length === 0) {
            log('No pending follow requests found in the data file.', 'error');
            alert('No pending follow requests found. Make sure you uploaded the correct file.');
            return;
        }
        
        filterAndSetRequests(parsed);
    }
    
    // Filter out requests sent in the last 24 hours
    function filterAndSetRequests(requests) {
        const now = Date.now();
        const cutoff = now - CONFIG.RECENT_HOURS * 60 * 60 * 1000;
        
        const toProcess = [];
        const skipped = [];
        
        requests.forEach(({ username, timestamp }) => {
            // timestamp from Instagram export is in seconds
            const tsMs = timestamp ? timestamp * 1000 : null;
            if (tsMs && tsMs > cutoff) {
                skipped.push(username);
            } else {
                toProcess.push(username);
            }
        });
        
        state.pendingRequests = toProcess;
        state.skippedRecent = skipped;
        state.skippedCount = skipped.length;
        
        if (skipped.length > 0) {
            log(`⏭️ Skipped ${skipped.length} request(s) sent in the last 24 hours`, 'skip');
            skipped.forEach(u => log(`  ↳ @${u} — sent recently, skipping`, 'skip'));
        }
        
        log(`Found ${toProcess.length} request(s) to cancel (out of ${toProcess.length + skipped.length} total)`, 'success');
        document.getElementById('start-btn').disabled = toProcess.length === 0;
        updateUI();
    }
    
    // Get CSRF token from Instagram
    function getCSRFToken() {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        return cookie ? cookie.split('=')[1] : null;
    }
    
    // Cancel a single follow request
    async function cancelFollowRequest(username, retryCount = 0) {
        try {
            const userResponse = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
                headers: {
                    'x-ig-app-id': '936619743392459',
                    'x-csrftoken': getCSRFToken()
                }
            });
            
            if (!userResponse.ok) {
                throw new Error(`Failed to get user info: ${userResponse.status}`);
            }
            
            const userData = await userResponse.json();
            const userId = userData.data.user.id;
            
            const response = await fetch(`https://www.instagram.com/api/v1/friendships/destroy/${userId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-ig-app-id': '936619743392459',
                    'x-csrftoken': getCSRFToken(),
                    'x-requested-with': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to cancel request: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status === 'ok') {
                log(`✓ Cancelled @${username}`, 'success');
                state.successCount++;
                return true;
            } else {
                throw new Error('Unexpected response status');
            }
            
        } catch (error) {
            if (retryCount < CONFIG.MAX_RETRIES) {
                const retryDelay = randomDelay();
                log(`Retrying @${username} (attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES}) — waiting ${(retryDelay/1000).toFixed(1)}s`, 'info');
                await sleep(retryDelay);
                return cancelFollowRequest(username, retryCount + 1);
            } else {
                log(`✗ Failed @${username}: ${error.message}`, 'error');
                state.failureCount++;
                return false;
            }
        }
    }
    
    // Sleep utility
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Countdown display while waiting
    async function waitWithCountdown(ms) {
        const seconds = Math.round(ms / 1000);
        for (let i = seconds; i > 0 && state.isRunning && !state.isPaused; i--) {
            document.getElementById('current-status').textContent =
                `⏳ Next request in ${i}s... (${state.currentIndex}/${state.pendingRequests.length} done)`;
            await sleep(1000);
        }
    }
    
    // Main cancellation loop — no batches, just sequential with random delay
    async function processCancellations() {
        while (state.currentIndex < state.pendingRequests.length && state.isRunning) {
            if (state.isPaused) {
                document.getElementById('current-status').textContent = '⏸️ Paused';
                await sleep(1000);
                continue;
            }
            
            const username = state.pendingRequests[state.currentIndex];
            
            document.getElementById('current-status').textContent =
                `🔄 Cancelling @${username}... (${state.currentIndex + 1}/${state.pendingRequests.length})`;
            
            await cancelFollowRequest(username);
            state.currentIndex++;
            updateUI();
            
            // If there are more, wait a random delay before continuing
            if (state.currentIndex < state.pendingRequests.length && state.isRunning && !state.isPaused) {
                const delay = randomDelay();
                log(`⏳ Waiting ${(delay / 1000).toFixed(1)}s before next request...`, 'info');
                await waitWithCountdown(delay);
            }
        }
        
        if (state.currentIndex >= state.pendingRequests.length && state.isRunning) {
            log(`✅ Done! Cancelled: ${state.successCount} | Failed: ${state.failureCount} | Skipped (recent): ${state.skippedCount}`, 'success');
            document.getElementById('current-status').textContent = '✅ All done!';
            document.getElementById('current-status').className = 'success';
            state.isRunning = false;
            document.getElementById('pause-btn').disabled = true;
            document.getElementById('resume-btn').disabled = true;
            document.getElementById('stop-btn').disabled = true;
        }
    }
    
    // Control functions
    function startCancellation() {
        if (state.pendingRequests.length === 0) {
            alert('No requests to process. Either upload a file or all requests were sent in the last 24 hours.');
            return;
        }
        
        state.isRunning = true;
        state.isPaused = false;
        state.currentIndex = 0;
        state.successCount = 0;
        state.failureCount = 0;
        
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        document.getElementById('stop-btn').disabled = false;
        document.getElementById('data-file-input').disabled = true;
        
        log(`Starting — ${state.pendingRequests.length} requests to cancel, ${state.skippedCount} skipped (last 24h)`, 'info');
        processCancellations();
    }
    
    function pauseCancellation() {
        state.isPaused = true;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('resume-btn').disabled = false;
        document.getElementById('current-status').textContent = '⏸️ Paused';
        log('Process paused', 'info');
    }
    
    function resumeCancellation() {
        state.isPaused = false;
        document.getElementById('pause-btn').disabled = false;
        document.getElementById('resume-btn').disabled = true;
        log('Process resumed', 'info');
    }
    
    function stopCancellation() {
        state.isRunning = false;
        state.isPaused = false;
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('resume-btn').disabled = true;
        document.getElementById('stop-btn').disabled = true;
        document.getElementById('data-file-input').disabled = false;
        document.getElementById('current-status').textContent = '⏹️ Stopped';
        log('Process stopped by user', 'info');
    }
    
    // Initialize
    createUI();
    log('Script loaded. Upload your Instagram data file to begin.', 'success');
    
})();
