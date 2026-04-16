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
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Fehler: No token found in localStorage.");
            return;
        }

        const headers = {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
        };

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
            
            const exportFileName = `${nickname}_${dateStr}_aurum_payments.jsonl`;

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

            // Fetch payments
            for (let page = 0; ; ++page) {
                let attempt = 0;
                let resp;
                
                while (attempt < backoffs.length + 1) {
                    resp = await fetch(`https://api.aurum.foundation/payments?limit=30&page=${page}`, { headers });

                    if (resp.status === 429 && attempt < backoffs.length) {
                        const waitSeconds = backoffs[attempt];
                        progressText.textContent = `System überlastet, warte ${waitSeconds} Sekunden...`;
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
                        const blob = new Blob([jsonlStr], { type: 'application/json' });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        // Add chunk numbers to file name
                        link.download = `${nickname}_${dateStr}_aurum_payments_part${chunkIdx}.jsonl`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        chunkIdx++;
                    }
                }

                if (json.page >= json.pages) break;
            }

            if (writableStream) {
                await writableStream.close();
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
