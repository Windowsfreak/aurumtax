(async function () {
    class AurumCryptor {
        #password;
        #iterations;
        #encoder;
        #decoder;

        constructor(password, iterations = 150000) {
            if (!password) {
                throw new Error("Password is required for key derivation");
            }
            this.#password = password;
            this.#iterations = iterations;
            this.#encoder = new TextEncoder();
            this.#decoder = new TextDecoder();
        }

        async deriveKey(salt) {
            const baseKey = await window.crypto.subtle.importKey(
                "raw",
                this.#encoder.encode(this.#password),
                "PBKDF2",
                false,
                ["deriveKey"]
            );
            return window.crypto.subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: salt,
                    iterations: this.#iterations,
                    hash: "SHA-256"
                },
                baseKey,
                {
                    name: "AES-GCM",
                    length: 256
                },
                false,
                ["encrypt", "decrypt"]
            );
        }

        async decode(encryptedBase64) {
            const encryptedBytes = Uint8Array.from(atob(encryptedBase64), (char) => char.charCodeAt(0));
            const salt = encryptedBytes.slice(0, 16);
            const iv = encryptedBytes.slice(16, 28);
            const ciphertext = encryptedBytes.slice(28);

            const aesKey = await this.deriveKey(salt);
            const decryptedBytes = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                aesKey,
                ciphertext
            );
            return this.#decoder.decode(decryptedBytes);
        }

        async encode(data) {
            const dataStr = JSON.stringify(data);
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const aesKey = await this.deriveKey(salt);
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                aesKey,
                this.#encoder.encode(dataStr)
            );
            const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
            combined.set(salt, 0);
            combined.set(iv, salt.length);
            combined.set(new Uint8Array(encrypted), salt.length + iv.length);
            return btoa(String.fromCharCode(...combined));
        }
    }

    const cryptor = new AurumCryptor("default-password");
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    const section = document.getElementsByTagName("section")[0] || document.body;
    
    const menu = document.getElementsByTagName('aside');
    if (menu.length > 0) menu[0].parentNode.remove();

    section.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto; text-align: center; font-family: sans-serif; padding: 2rem;">
        <h2 style="margin-bottom: 1rem; color: #fff;">Zahlungsdaten Export (JSONL)</h2>
        <p style="margin-bottom: 2rem; color: #aaa;">Exportiert alle Zahlungen platzsparend im JSONL-Format. Der Download findet direkt beim Abrufen statt, um den Arbeitsspeicher zu schonen.</p>
        
        <div style="margin-bottom: 1.5rem; text-align: left; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
            <label style="color: #ccc; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;" for="startPageInput">
                <strong>Fortsetzen (Optional):</strong> Falls ein vorheriger Export abgebrochen ist, kannst du hier die Seite eintragen, bei der er gestoppt hat, um dort fortzusetzen.
            </label>
            <input type="number" id="startPageInput" value="0" min="0" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff;">
        </div>

        <button id="startExportBtn" class="text-sm flex gap-2 items-center font-medium font-geologica justify-center rounded-[12px] px-4 py-2.5 transition duration-300 ease-in-out focus:outline-hidden bg-bg-color-main-theme-deep text-white w-full md:hover:bg-bg-color-main-theme-dark">
            Export starten
        </button>
        <div id="progressContainer" style="margin-top: 1.5rem; display: none;">
            <div style="background-color: #333; border-radius: 8px; width: 100%; height: 20px; overflow: hidden;">
                <div id="progressBar" style="background-color: #4ade80; width: 0%; height: 100%; transition: width 0.3s;"></div>
            </div>
            <p id="progressText" style="margin-top: 0.5rem; color: #ccc;">0%</p>
        </div>
    </div>
    `;

    const startBtn = document.getElementById('startExportBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    startBtn.addEventListener('click', async () => {
        let token = localStorage.getItem("token");
        if (!token) {
            alert("Fehler: No token found in localStorage.");
            return;
        }

        const headers = {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
            "X-Requested-With": "aurum-with"
        };

        const startPageInput = document.getElementById('startPageInput');
        const startPage = parseInt(startPageInput.value, 10) || 0;

        async function doRefreshToken() {
            const rfToken = localStorage.getItem("tokenRefresh");
            if (!rfToken) throw new Error("Kein Refresh Token gefunden.");
            
            const r = await fetch("https://api.aurum.foundation/refresh", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${rfToken}`,
                    "X-Requested-With": "aurum-with"
                }
            });
            
            if (!r.ok) throw new Error("Token refresh fetch failed.");
            
            const data = await r.json();
            if (data && data.data && data.data.accessToken) {
                localStorage.setItem("token", data.data.accessToken);
                localStorage.setItem("tokenRefresh", data.data.refreshToken);
                token = data.data.accessToken;
                headers["Authorization"] = `Bearer ${token}`; // Update headers for subsequent requests!
                return true;
            }
            throw new Error("Invalid response format on refresh.");
        }

        startBtn.disabled = true;
        startBtn.className = "hover:cursor-not-allowed bg-bg-color-input hover:bg-bg-color-input text-text-color-placeholder text-sm flex gap-2 items-center font-medium font-geologica justify-center rounded-[12px] px-4 py-2.5 transition duration-300 ease-in-out w-full focus:outline-hidden";
        startBtn.textContent = "Bereite Export vor...";
        progressContainer.style.display = "block";

        try {
            // Fetch main data for file prefix
            progressText.textContent = "Lade Benutzerdaten...";
            const mainResp = await fetch('https://api.aurum.foundation/', { headers });
            const mainRaw = await mainResp.json();
            
            let mainData;
            if (mainRaw.encrypted) {
                const decryptedMainStr = await cryptor.decode(mainRaw.encrypted);
                mainData = JSON.parse(decryptedMainStr);
            } else {
                mainData = mainRaw;
            }

            const nickname = mainData?.user?.credentials?.nickname || mainData?.user?.prettyId || "user";
            
            // Format current date to YYYY-MM-DD
            const d = new Date();
            const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

            function downloadJSONFile(data, filename) {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            downloadJSONFile(mainData, `${nickname}_${dateStr}_aurum_main.json`);

            progressText.textContent = "Lade Partnerdaten...";
            const partnerResp = await fetch('https://api.aurum.foundation/partners', { headers });
            if (partnerResp.ok) {
                const partnerRaw = await partnerResp.json();
                let partnerData;
                if (partnerRaw.encrypted) {
                    const decryptedPartnerStr = await cryptor.decode(partnerRaw.encrypted);
                    partnerData = JSON.parse(decryptedPartnerStr);
                } else {
                    partnerData = partnerRaw;
                }
                downloadJSONFile(partnerData, `${nickname}_${dateStr}_aurum_partners.json`);
            }

            progressText.textContent = "Lade Investmentdaten...";
            const investResp = await fetch('https://api.aurum.foundation/investments', { headers });
            if (investResp.ok) {
                const investRaw = await investResp.json();
                let investData;
                if (investRaw.encrypted) {
                    const decryptedInvestStr = await cryptor.decode(investRaw.encrypted);
                    investData = JSON.parse(decryptedInvestStr);
                } else {
                    investData = investRaw;
                }
                downloadJSONFile(investData, `${nickname}_${dateStr}_aurum_investments.json`);
            }
            
            const pageModifier = startPage > 0 ? `_page${startPage}` : "";
            const exportFileName = `${nickname}_${dateStr}_aurum_payments${pageModifier}.jsonl`;

            // Prepare writing stream or chunks
            let writableStream = null;
            let useChunks = false;

            if ('showSaveFilePicker' in window) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: exportFileName,
                        types: [{
                            description: 'JSON Lines File',
                            accept: { 'application/json': ['.jsonl'] },
                        }],
                    });
                    writableStream = await fileHandle.createWritable();
                } catch (err) {
                    if (err.name === 'AbortError') {
                        startBtn.textContent = "Export abgebrochen";
                        startBtn.disabled = false;
                        return;
                    }
                    console.warn("showSaveFilePicker failed, falling back to chunks.", err);
                    useChunks = true;
                }
            } else {
                console.warn("showSaveFilePicker not supported, falling back to chunks.");
                useChunks = true;
            }

            const backoffs = [10, 20, 40, 80, 120, 240, 360, 480, 600];
            let chunkIdx = 1;
            let currentChunkData = "";
            let chunkPagesCount = 0;
            const CHUNK_SIZE = 200; // Akkumuliere X Seiten pro Chunk

            function downloadChunk(data, idx, isLastAndOnly) {
                const blob = new Blob([data], { type: 'application/json' });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                if (isLastAndOnly) {
                    link.download = exportFileName;
                } else {
                    link.download = `${nickname}_${dateStr}_aurum_payments${pageModifier}_part${idx}.jsonl`;
                }
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            // Fetch payments
            for (let page = startPage; ; ++page) {
                let attempt = 0;
                let resp;
                
                while (attempt < backoffs.length + 1) {
                    resp = await fetch(`https://api.aurum.foundation/payments?limit=30&page=${page}`, { headers });

                    if (resp.status === 401 && attempt < backoffs.length) {
                        progressText.textContent = `Token abgelaufen, versuche Refresh... (Seite ${page})`;
                        try {
                            await doRefreshToken();
                            attempt++;
                            continue;
                        } catch(e) {
                            console.warn("Token refresh failed", e);
                            throw new Error("Sitzung abgelaufen und Refresh fehlgeschlagen. Bitte logge dich neu ein.");
                        }
                    }

                    if (resp.status >= 400 && attempt < backoffs.length) {
                        const waitSeconds = backoffs[attempt];
                        progressText.textContent = `System überlastet (Code ${resp.status}), warte ${waitSeconds} Sekunden...`;
                        await delay(waitSeconds * 1000);
                        attempt++;
                        continue;
                    }
                    if (!resp.ok) {
                        throw new Error(`Fetch page ${page} failed (status ${resp.status}) after ${attempt} retries`);
                    }
                    break;
                }

                const jsonRaw = await resp.json();
                let json;
                if (jsonRaw.encrypted) {
                    const decryptedJsonStr = await cryptor.decode(jsonRaw.encrypted);
                    json = JSON.parse(decryptedJsonStr);
                } else {
                    json = jsonRaw;
                }

                if (json.pages > 0) {
                    const percentage = Math.round(((page + 1) / json.pages) * 100);
                    progressBar.style.width = `${percentage}%`;
                    progressText.textContent = `Lade Zahlungen... ${percentage}% (Seite ${page + 1} von ${json.pages})`;
                    startBtn.textContent = `Export läuft (${percentage}%)`;
                }

                const payments = json.payments || [];
                if (payments.length > 0) {
                    // Explode into JSONL
                    const jsonlStr = payments.map(p => JSON.stringify(p)).join('\n') + '\n';

                    if (writableStream) {
                        await writableStream.write(jsonlStr);
                    } else if (useChunks) {
                        currentChunkData += jsonlStr;
                        chunkPagesCount++;
                        
                        if (chunkPagesCount >= CHUNK_SIZE) {
                            downloadChunk(currentChunkData, chunkIdx, false);
                            currentChunkData = "";
                            chunkPagesCount = 0;
                            chunkIdx++;
                        }
                    }
                }

                if (json.page >= json.pages || json.pages === 0) break;
            }

            if (writableStream) {
                await writableStream.close();
            } else if (useChunks && currentChunkData.length > 0) {
                // If it is the first chunk and we finished, dont append _part1
                downloadChunk(currentChunkData, chunkIdx, chunkIdx === 1);
            }

            progressBar.style.backgroundColor = '#3b82f6';
            progressText.textContent = "Export erfolgreich abgeschlossen!";
            startBtn.textContent = "Export fertig";

        } catch (e) {
            console.error('Export failed:', e);
            progressText.style.color = '#ef4444';
            progressText.textContent = `Fehler: ${e.message}`;
            startBtn.textContent = "Export fehlgeschlagen";
        }
    });

})();
