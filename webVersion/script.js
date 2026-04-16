(function () {
    let targetFinal = {
        main: 0,
        affiliate: 0,
        invest: 0
    };
    let summarizeFees = false;
    let useUSD = false;
    const c = () => useUSD ? "USD" : "EUR";
    let correctionsText = "";

    const EXCHANGE_RATES = {"2025-01-02":1.0321,"2025-01-03":1.0299,"2025-01-06":1.0426,"2025-01-07":1.0393,"2025-01-08":1.0286,"2025-01-09":1.0305,"2025-01-10":1.0304,"2025-01-13":1.0198,"2025-01-14":1.0245,"2025-01-15":1.03,"2025-01-16":1.0272,"2025-01-17":1.0298,"2025-01-20":1.0316,"2025-01-21":1.0357,"2025-01-22":1.0443,"2025-01-23":1.0404,"2025-01-24":1.0472,"2025-01-27":1.053,"2025-01-28":1.0421,"2025-01-29":1.0396,"2025-01-30":1.0403,"2025-01-31":1.0393,"2025-02-03":1.0274,"2025-02-04":1.0335,"2025-02-05":1.0422,"2025-02-06":1.036,"2025-02-07":1.0377,"2025-02-10":1.032,"2025-02-11":1.0324,"2025-02-12":1.037,"2025-02-13":1.039,"2025-02-14":1.0478,"2025-02-17":1.0473,"2025-02-18":1.0447,"2025-02-19":1.0434,"2025-02-20":1.0443,"2025-02-21":1.0465,"2025-02-24":1.0466,"2025-02-25":1.0497,"2025-02-26":1.0487,"2025-02-27":1.0477,"2025-02-28":1.0411,"2025-03-03":1.0465,"2025-03-04":1.0557,"2025-03-05":1.0694,"2025-03-06":1.0796,"2025-03-07":1.0857,"2025-03-10":1.0845,"2025-03-11":1.0912,"2025-03-12":1.0886,"2025-03-13":1.083,"2025-03-14":1.0889,"2025-03-17":1.0903,"2025-03-18":1.0918,"2025-03-19":1.0897,"2025-03-20":1.0833,"2025-03-21":1.0827,"2025-03-24":1.0824,"2025-03-25":1.0825,"2025-03-26":1.0788,"2025-03-27":1.0785,"2025-03-28":1.0797,"2025-03-31":1.0815,"2025-04-01":1.0788,"2025-04-02":1.0803,"2025-04-03":1.1097,"2025-04-04":1.1057,"2025-04-07":1.0967,"2025-04-08":1.095,"2025-04-09":1.1045,"2025-04-10":1.1082,"2025-04-11":1.1346,"2025-04-14":1.1377,"2025-04-15":1.1324,"2025-04-16":1.1355,"2025-04-17":1.136,"2025-04-22":1.1476,"2025-04-23":1.1415,"2025-04-24":1.1376,"2025-04-25":1.1357,"2025-04-28":1.1358,"2025-04-29":1.1373,"2025-04-30":1.1373,"2025-05-02":1.1343,"2025-05-05":1.1343,"2025-05-06":1.1325,"2025-05-07":1.136,"2025-05-08":1.1297,"2025-05-09":1.1252,"2025-05-12":1.1106,"2025-05-13":1.1112,"2025-05-14":1.1214,"2025-05-15":1.1185,"2025-05-16":1.1194,"2025-05-19":1.1262,"2025-05-20":1.1241,"2025-05-21":1.1321,"2025-05-22":1.1309,"2025-05-23":1.1301,"2025-05-26":1.1381,"2025-05-27":1.1356,"2025-05-28":1.1317,"2025-05-29":1.1281,"2025-05-30":1.1339,"2025-06-02":1.1419,"2025-06-03":1.1386,"2025-06-04":1.1384,"2025-06-05":1.1423,"2025-06-06":1.1411,"2025-06-09":1.141,"2025-06-10":1.1429,"2025-06-11":1.1433,"2025-06-12":1.1594,"2025-06-13":1.1512,"2025-06-16":1.1574,"2025-06-17":1.1568,"2025-06-18":1.1508,"2025-06-19":1.1478,"2025-06-20":1.1515,"2025-06-23":1.1472,"2025-06-24":1.1607,"2025-06-25":1.1598,"2025-06-26":1.1695,"2025-06-27":1.1704,"2025-06-30":1.172,"2025-07-01":1.181,"2025-07-02":1.1755,"2025-07-03":1.1782,"2025-07-04":1.1767,"2025-07-07":1.1728,"2025-07-08":1.1718,"2025-07-09":1.1698,"2025-07-10":1.1709,"2025-07-11":1.1683,"2025-07-14":1.169,"2025-07-15":1.1665,"2025-07-16":1.1602,"2025-07-17":1.1579,"2025-07-18":1.165,"2025-07-21":1.1667,"2025-07-22":1.1699,"2025-07-23":1.1726,"2025-07-24":1.1756,"2025-07-25":1.1724,"2025-07-28":1.1654,"2025-07-29":1.1533,"2025-07-30":1.1527,"2025-07-31":1.1446,"2025-08-01":1.1404,"2025-08-04":1.1565,"2025-08-05":1.1546,"2025-08-06":1.1604,"2025-08-07":1.1643,"2025-08-08":1.1648,"2025-08-11":1.1622,"2025-08-12":1.1606,"2025-08-13":1.1711,"2025-08-14":1.169,"2025-08-15":1.1688,"2025-08-18":1.1673,"2025-08-19":1.1682,"2025-08-20":1.1651,"2025-08-21":1.1639,"2025-08-22":1.1608,"2025-08-25":1.1697,"2025-08-26":1.1656,"2025-08-27":1.1593,"2025-08-28":1.1676,"2025-08-29":1.1658,"2025-09-01":1.1715,"2025-09-02":1.1646,"2025-09-03":1.1653,"2025-09-04":1.1647,"2025-09-05":1.1697,"2025-09-08":1.1728,"2025-09-09":1.1744,"2025-09-10":1.1707,"2025-09-11":1.1685,"2025-09-12":1.1718,"2025-09-15":1.1766,"2025-09-16":1.1807,"2025-09-17":1.1837,"2025-09-18":1.1818,"2025-09-19":1.1736,"2025-09-22":1.1781,"2025-09-23":1.1793,"2025-09-24":1.1756,"2025-09-25":1.1739,"2025-09-26":1.1672,"2025-09-29":1.1723,"2025-09-30":1.1741,"2025-10-01":1.1724,"2025-10-02":1.1754,"2025-10-03":1.1734,"2025-10-06":1.1678,"2025-10-07":1.1666,"2025-10-08":1.1627,"2025-10-09":1.1611,"2025-10-10":1.1568,"2025-10-13":1.1569,"2025-10-14":1.1553,"2025-10-15":1.1622,"2025-10-16":1.1649,"2025-10-17":1.1681,"2025-10-20":1.1655,"2025-10-21":1.1607,"2025-10-22":1.1587,"2025-10-23":1.1593,"2025-10-24":1.1612,"2025-10-27":1.164,"2025-10-28":1.163,"2025-10-29":1.1636,"2025-10-30":1.155,"2025-10-31":1.1554,"2025-11-03":1.1514,"2025-11-04":1.1491,"2025-11-05":1.1492,"2025-11-06":1.1533,"2025-11-07":1.1561,"2025-11-10":1.1571,"2025-11-11":1.1575,"2025-11-12":1.1576,"2025-11-13":1.1619,"2025-11-14":1.1648,"2025-11-17":1.1593,"2025-11-18":1.159,"2025-11-19":1.1583,"2025-11-20":1.1514,"2025-11-21":1.152,"2025-11-24":1.1544,"2025-11-25":1.1551,"2025-11-26":1.1577,"2025-11-27":1.1586,"2025-11-28":1.1566,"2025-12-01":1.1646,"2025-12-02":1.1614,"2025-12-03":1.1668,"2025-12-04":1.1666,"2025-12-05":1.1645,"2025-12-08":1.1655,"2025-12-09":1.1637,"2025-12-10":1.1634,"2025-12-11":1.1714,"2025-12-12":1.1731,"2025-12-15":1.1753,"2025-12-16":1.1776,"2025-12-17":1.1722,"2025-12-18":1.1719,"2025-12-19":1.1712,"2025-12-22":1.1745,"2025-12-23":1.1786,"2025-12-24":1.1787,"2025-12-29":1.1766,"2025-12-30":1.1757,"2025-12-31":1.175,"2026-01-02":1.1721,"2026-01-05":1.1664,"2026-01-06":1.1707,"2026-01-07":1.1684,"2026-01-08":1.1675,"2026-01-09":1.1642,"2026-01-12":1.1692,"2026-01-13":1.1654,"2026-01-14":1.1651,"2026-01-15":1.1624,"2026-01-16":1.1617,"2026-01-19":1.1631,"2026-01-20":1.1728,"2026-01-21":1.1739,"2026-01-22":1.1706,"2026-01-23":1.1742,"2026-01-26":1.1836,"2026-01-27":1.1929,"2026-01-28":1.1974,"2026-01-29":1.1968,"2026-01-30":1.1919,"2026-02-02":1.184,"2026-02-03":1.1801,"2026-02-04":1.182,"2026-02-05":1.1798,"2026-02-06":1.1794,"2026-02-09":1.1886,"2026-02-10":1.1894,"2026-02-11":1.19,"2026-02-12":1.1874,"2026-02-13":1.1862,"2026-02-16":1.1855,"2026-02-17":1.1826,"2026-02-18":1.1845,"2026-02-19":1.1753,"2026-02-20":1.1767,"2026-02-23":1.1784,"2026-02-24":1.1777,"2026-02-25":1.1784,"2026-02-26":1.1814,"2026-02-27":1.1805,"2026-03-02":1.1698,"2026-03-03":1.1606,"2026-03-04":1.1649,"2026-03-05":1.1618,"2026-03-06":1.1561,"2026-03-09":1.1555,"2026-03-10":1.1641,"2026-03-11":1.1581,"2026-03-12":1.1547,"2026-03-13":1.1476,"2026-03-16":1.1478,"2026-03-17":1.1531,"2026-03-18":1.15,"2026-03-19":1.1489,"2026-03-20":1.1555,"2026-03-23":1.1596,"2026-03-24":1.1572,"2026-03-25":1.1592,"2026-03-26":1.1539,"2026-03-27":1.1517,"2026-03-30":1.1484,"2026-03-31":1.1498,"2026-04-01":1.1605,"2026-04-02":1.1525,"2026-04-07":1.1557,"2026-04-08":1.1706,"2026-04-09":1.1685,"2026-04-10":1.1711,"2026-04-13":1.1684,"2026-04-14":1.1793,"2026-04-15":1.178};
    
    function getExchangeRate(dateString) {
        const date = new Date(dateString);
        let current = date;
        for (let i = 0; i < 14; i++) {
            const iso = current.toISOString().split('T')[0];
            if (EXCHANGE_RATES[iso]) return EXCHANGE_RATES[iso];
            current.setDate(current.getDate() - 1);
        }
        return 1.0; // Fallback
    }

    function formatExportDate(dStr) {
        if (dStr === "(Initial)") return "(Initial)";
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(dStr)) {
            return dStr.length === 16 ? dStr + ":00" : dStr;
        }
        const d = new Date(dStr);
        if (isNaN(d)) return dStr;
        const pad = n => n.toString().padStart(2, '0');
        return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;
    }

    window.downloadCSV = function (rows) {
        const headers = ["Zeitpunkt", "Vorgang", "Betrag USD", "Betrag EUR", "Kurs", "Main USD", "Invest USD", "Affiliate USD", "Sum USD"];
        const csvRows = [headers.join(",")];
        for (const row of rows) {
            const rate = getExchangeRate(row.date.startsWith('(') ? new Date().toISOString() : row.date);
            const amtEUR = row.amount ? (Number(row.amount) / rate).toFixed(5) : "0.00000";
            csvRows.push([
                `"${row.date}"`,
                `"${translateKind(row.kind)}"`,
                row.amount || "0",
                amtEUR,
                rate,
                row.main.toFixed(2),
                row.invest.toFixed(2),
                row.affiliate.toFixed(2),
                row.sum.toFixed(2)
            ].join(","));
        }
        triggerDownload(csvRows.join("\n"), "aurum_report.csv");
    };

    function triggerDownload(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function getTradeData(rows) {
        const sortedDates = Object.keys(EXCHANGE_RATES).sort();
        const mostRecentRate = EXCHANGE_RATES[sortedDates[sortedDates.length - 1]];
        let prevSum = 0;
        let trades = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.date === "(Initial)") {
                prevSum = row.sum;
                continue;
            }
            const diff = row.sum - prevSum;
            if (Math.abs(diff) < 0.001) {
                prevSum = row.sum;
                continue;
            }
            const rate = getExchangeRate(row.date);
            let outAsset, outAmt, inAsset, inAmt, type;
            if (diff > 0) {
                outAsset = "EUR";
                outAmt = diff / rate;
                inAsset = "TUSD";
                inAmt = diff;
                type = "buy";
            } else {
                outAsset = "TUSD";
                outAmt = Math.abs(diff);
                inAsset = "EUR";
                inAmt = Math.abs(diff / rate);
                type = "sell";
            }
            trades.push({ date: row.date, outAsset, outAmt, inAsset, inAmt, type });
            prevSum = row.sum;
        }
        const finalSum = rows[rows.length - 1].sum;
        if (finalSum > 0) {
            trades.push({
                date: "2099-12-31 23:59",
                outAsset: "TUSD",
                outAmt: finalSum,
                inAsset: "EUR",
                inAmt: finalSum / mostRecentRate,
                type: "sell"
            });
        }
        return trades;
    }

    window.downloadBlockpitCSV = function (rows) {
        const trades = getTradeData(rows);
        const headers = ["Date (UTC)", "Integration Name", "Label", "Outgoing Asset", "Outgoing Amount", "Incoming Asset", "Incoming Amount", "Fee Asset (optional)", "Fee Amount (optional)", "Comment (optional)", "Trx. ID (optional)"];
        const csvRows = [headers.join(",")];
        trades.forEach(t => {
            const dateStr = formatExportDate(t.date);
            csvRows.push([
                `"${dateStr}"`, "AURUM", "Trade", t.outAsset, t.outAmt.toString(), t.inAsset, t.inAmt.toString(), "", "", "", ""
            ].join(","));
        });
        triggerDownload(csvRows.join("\n"), "blockpit_export.csv");
    };

    window.downloadSummCSV = function (rows) {
        const trades = getTradeData(rows);
        const headers = ["Timestamp (UTC)", "Type", "Base Currency", "Base Amount", "Quote Currency (Optional)", "Quote Amount (Optional)", "Fee Currency (Optional)", "Fee Amount (Optional)", "From (Optional)", "To (Optional)", "Blockchain (Optional)", "ID (Optional)", "Description (Optional)"];
        const csvRows = [headers.join(",")];
        trades.forEach(t => {
            const dateStr = formatExportDate(t.date);
            csvRows.push([
                `"${dateStr}"`, t.type, "TUSD", t.type === "buy" ? t.inAmt.toString() : t.outAmt.toString(), "EUR", t.type === "buy" ? t.outAmt.toString() : t.inAmt.toString(), "", "", "AURUM", "AURUM", "", "", ""
            ].join(","));
        });
        triggerDownload(csvRows.join("\n"), "summ_export.csv");
    };

    window.downloadCointrackingCSV = function (rows) {
        const trades = getTradeData(rows);
        const headers = ["Type", "Buy Amount", "Buy Currency", "Sell Amount", "Sell Currency", "Fee", "Fee Currency", "Exchange", "Trade-Group", "Comment", "Date"];
        const csvRows = [headers.join(",")];
        trades.forEach(t => {
            const dateStr = formatExportDate(t.date);
            csvRows.push([
                "Trade", t.inAmt.toString(), t.inAsset, t.outAmt.toString(), t.outAsset, "", "", "AURUM", "", "", `"${dateStr}"`
            ].join(","));
        });
        triggerDownload(csvRows.join("\n"), "cointracking_export.csv");
    };

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

    async function renderForm() {
        const section = document.getElementsByTagName("section")[0];
        const token = localStorage.getItem("token");
        if (!token) {
            section.innerHTML = `<b>Fehler:</b> No token found in localStorage.`;
            return;
        }
        const headers = {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
        };

        try {
            const mainResp = await fetch('https://api.aurum.foundation/', { headers });
            let mainRaw = await mainResp.json();
            let mainData;
            if (mainRaw.encrypted) {
                const decryptedMainStr = await cryptor.decode(mainRaw.encrypted);
                mainData = JSON.parse(decryptedMainStr);
            } else {
                mainData = mainRaw;
            }
            targetFinal.main = parseFloat(mainData.balance?.total.replace(' ', '') || '0');

            const partnerResp = await fetch('https://api.aurum.foundation/partners', { headers });
            let partnerRaw = await partnerResp.json();
            let partnerData;
            if (partnerRaw.encrypted) {
                const decryptedPartnerStr = await cryptor.decode(partnerRaw.encrypted);
                partnerData = JSON.parse(decryptedPartnerStr);
            } else {
                partnerData = partnerRaw;
            }
            targetFinal.affiliate = parseFloat(partnerData.partnerBalance.replace(' ', '') || '0');

            const investResp = await fetch('https://api.aurum.foundation/investments', { headers });
            let investRaw = await investResp.json();
            let investData;
            if (investRaw.encrypted) {
                const decryptedInvestStr = await cryptor.decode(investRaw.encrypted);
                investData = JSON.parse(decryptedInvestStr);
            } else {
                investData = investRaw;
            }
            const deposit = parseFloat(investData.balance?.totalDeposit.replace(' ', '') || '0');
            const tokenBal = parseFloat(investData.balance?.tokenBalance.replace(' ', '') || '0');
            targetFinal.invest = deposit + tokenBal;
        } catch (e) {
            console.error('Failed to fetch balances:', e);
            targetFinal = { main: 0, affiliate: 0, invest: 0 };
        }

        section.innerHTML = `
    <form id="configForm">
    <label>Main Balance: <input type="number" step="0.01" name="main" value="${targetFinal.main.toFixed(2)}" required class="min-h-12 w-full text-[17px] rounded-[12px] border-2 bg-bg-color-input py-2 px-3 text-text-color-primary outline-hidden placeholder:text-text-color-placeholder pr-[145px]" placeholder="0.00"></label><br>
    <label>Affiliate Balance: <input type="number" step="0.01" name="affiliate" value="${targetFinal.affiliate.toFixed(2)}" required class="min-h-12 w-full text-[17px] rounded-[12px] border-2 bg-bg-color-input py-2 px-3 text-text-color-primary outline-hidden placeholder:text-text-color-placeholder pr-[145px]" placeholder="0.00"></label><br>
    <label>Invest Balance: <input type="number" step="0.01" name="invest" value="${targetFinal.invest.toFixed(2)}" required class="min-h-12 w-full text-[17px] rounded-[12px] border-2 bg-bg-color-input py-2 px-3 text-text-color-primary outline-hidden placeholder:text-text-color-placeholder pr-[145px]" placeholder="0.00"></label><br>
    <label>Positionen korrigieren:<br><textarea name="corrections" rows="4" cols="50" class="min-h-24 w-full text-[17px] rounded-[12px] border-2 bg-bg-color-input py-2 px-3 text-text-color-primary outline-hidden placeholder:text-text-color-placeholder" placeholder="Beispiel:\n2025-08-25T08:45:57.826Z\n2025-08-26T17:30:00.000Z DIVIDEND 420.69"></textarea></label><br>
    <label><input type="checkbox" name="summarizeFees"> Kontogebühren zusammenfassen</label><br>
    <label><input type="checkbox" name="useUSD"> USD verwenden</label><br>
    <button type="submit" id="submitBtn" class="text-sm flex gap-2 items-center font-medium font-geologica justify-center rounded-[12px] px-4 py-2.5 transition duration-300 ease-in-out focus:outline-hidden bg-bg-color-main-theme-deep text-white md:hover:bg-bg-color-main-theme-dark">Bestätigen und Bericht generieren</button>
    </form>
    `;

        const form = document.getElementById("configForm");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Disable button and show loading state
            const submitBtn = document.getElementById("submitBtn");
            submitBtn.disabled = true;
            submitBtn.className = "hover:cursor-not-allowed bg-bg-color-input hover:bg-bg-color-input text-text-color-placeholder text-sm flex gap-2 items-center font-medium font-geologica justify-center rounded-[12px] px-4 py-2.5 transition duration-300 ease-in-out focus:outline-hidden";
            submitBtn.textContent = "Transaktionen werden abgerufen... 0%";

            // Remove menu for full screen view
            const menu = document.getElementsByTagName('aside');
            if (menu.length > 0)
                menu[0].parentNode.remove();

            const formData = new FormData(form);
            targetFinal = {
                main: parseFloat(formData.get("main")),
                affiliate: parseFloat(formData.get("affiliate")),
                invest: parseFloat(formData.get("invest"))
            };
            summarizeFees = formData.get("summarizeFees") === "on";
            useUSD = formData.get("useUSD") === "on";
            if (useUSD) {
                for (const key in EXCHANGE_RATES) {
                    delete EXCHANGE_RATES[key];
                }
            }
            correctionsText = formData.get("corrections") || "";

            try {
                const payments = await fetchAllPayments();
                const history = buildHistory(payments, targetFinal);
                section.innerHTML = renderTable(history) + renderFinancialReport(history);

                const lastRow = history[history.length - 1];
                function approxEqual(a, b, t = 0.001) { return Math.abs(a - b) < t; }
                if (approxEqual(lastRow.main, targetFinal.main) &&
                    approxEqual(lastRow.invest, targetFinal.invest) &&
                    approxEqual(lastRow.affiliate, targetFinal.affiliate)) {
                    section.insertAdjacentHTML('beforeend', `<p style="color:green; font-weight:bold;">Abrechnung stimmt auf den Cent genau.</p>`);
                } else {
                    section.insertAdjacentHTML('beforeend', `<p style="color:red; font-weight:bold;">Es gibt Abweichungen mit dem Endergebnis.</p>`);
                    section.insertAdjacentHTML('beforeend', `
                <table class="w-full mt-2" style="border-collapse: collapse;">
                <thead>
                <tr>
                <th class="py-2 px-2 text-left">Konto</th>
                <th class="py-2 px-2 text-right">Soll</th>
                <th class="py-2 px-2 text-right">Ist</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                <td>Main</td>
                <td class="text-right">${lastRow.main.toFixed(2)}</td>
                <td class="text-right">${targetFinal.main.toFixed(2)}</td>
                </tr>
                <tr>
                <td>Invest</td>
                <td class="text-right">${lastRow.invest.toFixed(2)}</td>
                <td class="text-right">${targetFinal.invest.toFixed(2)}</td>
                </tr>
                <tr>
                <td>Affiliate</td>
                <td class="text-right">${lastRow.affiliate.toFixed(2)}</td>
                <td class="text-right">${targetFinal.affiliate.toFixed(2)}</td>
                </tr>
                </tbody>
                </table>
                `);
                }
            } catch (e) {
                section.innerHTML = `<b>Fehler:</b> ${e.message}`;
            }
        });
    }

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    async function fetchAllPayments() {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found in localStorage.");
        const headers = {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
        };
        let all = [];
        const backoffs = [10, 20, 40, 80, 120, 240, 360, 480, 600];
        const submitBtn = document.getElementById("submitBtn");
        for (let page = 0; ; ++page) {
            let attempt = 0;
            let resp;
            while (attempt < backoffs.length + 1) {
                resp = await fetch(`https://api.aurum.foundation/payments?limit=30&page=${page}`, { headers });

                if (resp.status === 429 && attempt < backoffs.length) {
                    const waitSeconds = backoffs[attempt];
                    if (submitBtn) {
                        submitBtn.textContent = `System überlastet, warte ${waitSeconds} Sekunden...`;
                    }
                    await delay(waitSeconds * 1000);
                    attempt++;
                    continue;
                }
                if (!resp.ok) {
                    throw new Error(`Fetch page ${page} failed (status ${resp.status}) after ${attempt} retries`);
                }
                break;
            }
            let jsonRaw = await resp.json();
            let json;
            if (jsonRaw.encrypted) {
                const decryptedJsonStr = await cryptor.decode(jsonRaw.encrypted);
                json = JSON.parse(decryptedJsonStr);
            } else {
                json = jsonRaw;
            }

            if (submitBtn && json.pages > 0) {
                const progress = Math.round(((page + 1) / json.pages) * 100);
                submitBtn.textContent = `Transaktionen werden abgerufen... ${progress}%`;
            }

            all = all.concat(json.payments || []);
            if (json.page >= json.pages) break;
        }

        // Filter out unsupported currencies
        all = all.filter(tx => {
            const supportedTickers = ['USDT', 'USDC'];
            const tickerOk = !tx.ticker || supportedTickers.includes(tx.ticker);
            const cryptoTickerOk = !tx.cryptoTicker || supportedTickers.includes(tx.cryptoTicker);
            return tickerOk && cryptoTickerOk;
        });

        // Filter out rejected card recharges
        all = all.filter(tx => !(tx.kind === "CARD_RECHARGE" && tx.statusName === "transactions:REJECTED"));

        return all;
    }

    function buildHistory(payments, targetBalances) {
        // Parse corrections from textarea
        const corrections = parseCorrections(correctionsText);

        // Sort payments chronologically (oldest first)
        const paymentsChrono = [...payments].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Apply corrections - filter out unwanted entries and add synthetic ones
        let filteredPayments = [];
        for (const tx of paymentsChrono) {
            const correction = corrections.find(c => c.date === tx.date);
            if (correction && !correction.synthetic) {
                // Skip this transaction
                continue;
            }
            filteredPayments.push(tx);
        }

        // Add synthetic transactions
        for (const correction of corrections) {
            if (correction.synthetic) {
                const syntheticTx = {
                    date: correction.date,
                    kind: correction.kind,
                    amount: correction.amount.toString(),
                };

                // Insert in correct chronological position
                const insertIndex = filteredPayments.findIndex(tx => new Date(tx.date) > new Date(correction.date));
                if (insertIndex === -1) {
                    filteredPayments.push(syntheticTx);
                } else {
                    filteredPayments.splice(insertIndex, 0, syntheticTx);
                }
            }
        }

        const paymentsReversed = [...filteredPayments].reverse();

        let reversedState = {
            main: targetBalances.main,
            invest: targetBalances.invest,
            affiliate: targetBalances.affiliate,
            card: 0,
            profit: 0,
            provision: 0,
            totalCosts: 0
        };
        let totalProfit = 0;
        let totalProvision = 0;

        for (let i = paymentsReversed.length - 1; i >= 0; --i) {
            const tx = paymentsReversed[i];
            const kind = tx.kind;
            const amt = getTransactionAmount(tx);
            switch (kind) {
                case "REPLENISHMENT": reversedState.main -= amt; break;
                case "WITHDRAWAL": reversedState.main += amt; break;
                case "SUBSCRIPTION":
                case "LICENSE": reversedState.main += amt; break;
                case "INVESTMENT": reversedState.main += amt; reversedState.invest -= amt; break;
                case "TOP_UP_DEPOSIT": reversedState.main += amt; reversedState.invest -= amt; break;
                case "REINVESTMENT": reversedState.invest -= amt; totalProfit += amt; break;
                case "DIVIDEND": reversedState.invest -= amt; totalProfit += amt; break;
                case "CLAIMED_DIVIDEND": reversedState.main -= amt; reversedState.invest += amt; break;
                case "REFERRAL_FUND":
                case "TEAM_EARNINGS":
                case "REFERRAL_LICENSE_FUND":
                case "REFERRAL_CARD_PURCHASE":
                case "REFERRAL_CARD_TOPUP":
                case "TEAM_EARNING_LIVE_TRADING":
                case "SHAREHOLDER_BONUS": reversedState.affiliate -= amt; totalProvision += amt; break;
                case "REFERRAL_RANK_BONUS": reversedState.main -= amt; totalProvision += amt; break;
                case "TRANSFER":
                    if ((tx.asset === "PARTNER-USDT" && tx.targetAsset === "MAIN-USDT") || (!tx.asset && !tx.targetAsset)) {
                        reversedState.affiliate += amt;
                        reversedState.main -= amt;
                    }
                    break;
                case "CARD_RECHARGE": reversedState.main += amt; break;
                case "CARD_PURCHASE":
                case "CARD_PURCHASE_PHYSICAL": reversedState.main += amt; break;
            }
        }

        let history = [
            {
                date: "(Initial)",
                kind: "-",
                amount: 0,
                main: 0,
                invest: 0,
                affiliate: 0,
                card: 0,
                sum: 0,
                profit: 0,
                provision: 0,
                costs: 0,
                totalCosts: 0
            }
        ];

        let main = 0;
        let invest = 0;
        let affiliate = 0;
        let card = 0;
        let profit = 0;
        let provision = 0;
        let totalCosts = 0;

        filteredPayments.forEach(tx => {
            let amount = getTransactionAmount(tx);
            let kind = tx.kind;
            let costAddition = 0;

            if (summarizeFees && (kind === "CARD_RECHARGE" || kind === "CARD_PURCHASE" || kind === "CARD_PURCHASE_PHYSICAL")) {
                kind = "MAINTENANCE_FEE";
                main -= amount;
                costAddition = amount;
            } else {
                switch (kind) {
                    case "REPLENISHMENT": main += amount; break;
                    case "WITHDRAWAL":
                        main -= amount;
                        // Fix AURUM Bug: Calculate correct withdrawal fees
                        costAddition = (amount * 0.01) + 1.01;
                        break;
                    case "SUBSCRIPTION":
                    case "LICENSE":
                        main -= amount;
                        costAddition = amount;
                        break;
                    case "INVESTMENT":
                        // Fix AURUM Bug: Calculate correct initial investment amount
                        if (tx.kindName) {
                            amount += reversedState.invest;
                        }
                        invest += amount;
                        main -= amount;
                        break;
                    case "TOP_UP_DEPOSIT":
                        main -= amount;
                        invest += amount;
                        break;
                    case "DIVIDEND":
                        invest += amount;
                        profit += amount;
                        break;
                    case "REINVESTMENT":
                        invest += amount;
                        profit += amount;
                        break;
                    case "CLAIMED_DIVIDEND":
                        main += amount;
                        invest -= amount;
                        break;
                    case "REFERRAL_FUND":
                    case "TEAM_EARNINGS":
                    case "REFERRAL_LICENSE_FUND":
                    case "REFERRAL_CARD_PURCHASE":
                    case "REFERRAL_CARD_TOPUP":
                    case "TEAM_EARNING_LIVE_TRADING":
                    case "SHAREHOLDER_BONUS":
                        affiliate += amount;
                        provision += amount;
                        break;
                    case "REFERRAL_RANK_BONUS":
                        main += amount;
                        provision += amount;
                        break;
                    case "TRANSFER":
                        if ((tx.asset === "PARTNER-USDT" && tx.targetAsset === "MAIN-USDT") || (!tx.asset && !tx.targetAsset)) {
                            affiliate -= amount;
                            main += amount;
                        }
                        break;
                    case "CARD_RECHARGE":
                        // Fix AURUM Bug: Calculate correct card fees
                        main -= amount;
                        const fee = amount * 0.022;
                        const effective = amount - fee;
                        card += effective;
                        costAddition = fee;
                        break;
                    case "CARD_PURCHASE":
                    case "CARD_PURCHASE_PHYSICAL":
                        main -= amount;
                        costAddition = amount;
                        break;
                }
            }

            totalCosts += costAddition;

            history.push({
                date: tx.date,
                kind: kind,
                amount: amount,
                main: main,
                invest: invest,
                affiliate: affiliate,
                card: card,
                sum: main + invest + affiliate,
                profit: profit,
                provision: provision,
                costs: costAddition,
                totalCosts: totalCosts
            });
        });

        return history;
    }

    function getTransactionAmount(tx) {
        // If both cryptoAmount and amount are set, trust cryptoAmount
        if (tx.cryptoAmount && tx.amount) {
            return parseFloat(tx.cryptoAmount);
        }
        return parseFloat(tx.amount || '0');
    }

    function parseCorrections(correctionsText) {
        if (!correctionsText.trim()) return [];

        const lines = correctionsText.split('\n').filter(line => line.trim());
        const corrections = [];

        for (const line of lines) {
            const parts = line.trim().split(' ');
            if (parts.length >= 1) {
                const date = parts[0];
                if (parts.length > 1) {
                    // Synthetic transaction
                    const kind = parts[1];
                    const amount = parseFloat(parts[2] || '0');
                    corrections.push({
                        date: date,
                        synthetic: true,
                        kind: kind,
                        amount: amount
                    });
                } else {
                    // Filter out existing transaction
                    corrections.push({
                        date: date,
                        synthetic: false
                    });
                }
            }
        }

        return corrections;
    }

    function translateKind(kind) {
        const map = {
            "REPLENISHMENT": "Eingezahlt",
            "WITHDRAWAL": "Ausgezahlt",
            "WITHDRAWAL_DEPOSIT": "Ausgezahlt (Deposit)",
            "INVESTMENT": "Invest",
            "TOP_UP_DEPOSIT": "Invest",
            "CARD_RECHARGE": "Karte aufladen",
            "SUBSCRIPTION": "Abonnement",
            "REINVESTMENT": "Reinvest",
            "DIVIDEND": "Dividende",
            "CLAIMED_DIVIDEND": "Umbuchung",
            "REFERRAL_FUND": "Empfehlungsprovision",
            "TEAM_EARNINGS": "Teameinnahmen",
            "REFERRAL_RANK_BONUS": "Rangbonus",
            "TRANSFER": "Übertragung",
            "CARD_PURCHASE": "Kartenbestellung",
            "CARD_PURCHASE_PHYSICAL": "Physische Karte",
            "MAINTENANCE_FEE": "Verwaltungsgebühren",
            "LICENSE": "Lizenz",
            "FLASH_LOAN_PROFIT": "Flash Loan Profit (nicht unterstützt)",
            "LIVE_TRADING": "Live Trading (nicht unterstützt)",
            "LIVE_TRADING_BOTS": "Live Trading Bots (nicht unterstützt)",
            "LIVE_TRADING_BOT_STOP": "Live Trading Bot Stop (nicht unterstützt)",
            "TEAM_EARNING_LIVE_TRADING": "Team Live Trading",
            "AURUM_TOKEN": "Aurum Token (nicht unterstützt)",
            "REFERRAL_LICENSE_FUND": "Empfehlungs-Lizenz-Fonds",
            "REFERRAL_CARD_PURCHASE": "Empfehlungs-Kartenkauf",
            "REFERRAL_CARD_TOPUP": "Empfehlungs-Kartenaufladung",
            "CARD_PURCHASE_CASHBACK": "Karten-Cashback (nicht unterstützt)",
            "SHAREHOLDER_BONUS": "Aktionärsbonus"
        };
        return map[kind] || kind;
    }

    function renderTable(rows) {
        window.reportRows = rows;
        const btnStyle = "text-sm flex gap-2 items-center font-medium font-geologica justify-center rounded-[12px] px-4 py-2.5 transition duration-300 ease-in-out focus:outline-hidden bg-bg-color-main-theme-deep text-white md:hover:bg-bg-color-main-theme-dark";
        return `
        <div class="my-4 flex flex-col gap-3">
            <div class="flex items-center gap-4 flex-wrap">
                <span class="font-bold text-text-color-primary min-w-[200px]">Transaktionshistorie:</span>
                <button onclick="downloadCSV(window.reportRows)" class="${btnStyle}">
                    CSV
                </button>
            </div>
            <div class="flex items-center gap-4 flex-wrap">
                <span class="font-bold text-text-color-primary min-w-[200px]">Fremdwährungskonto:</span>
                <button onclick="downloadBlockpitCSV(window.reportRows)" class="${btnStyle}">
                    Blockpit
                </button>
                <button onclick="downloadSummCSV(window.reportRows)" class="${btnStyle}">
                    Summ
                </button>
                <button onclick="downloadCointrackingCSV(window.reportRows)" class="${btnStyle}">
                    Cointracking
                </button>
            </div>
        </div>`;
    }

    function renderFinancialReport(rows) {
        const years = {};
        rows.forEach(row => {
            if (row.date.startsWith('(')) return;
            const yearMatch = row.date.match(/^(\d{4})/);
            if (yearMatch) {
                const year = yearMatch[1];
                if (!years[year]) years[year] = [];
                years[year].push(row);
            }
        });

        const sortedYears = Object.keys(years).sort((a, b) => a - b);
        let html = '';

        sortedYears.forEach(year => {
            const yearRows = years[year];
            if (yearRows.length === 0) return;

            let prevRow = rows[0];
            const prevYearIndex = sortedYears.indexOf(year) - 1;
            if (prevYearIndex >= 0) {
                const prevYearRows = years[sortedYears[prevYearIndex]];
                prevRow = prevYearRows[prevYearRows.length - 1];
            }

            const categoryBreakdown = calculateCategoryBreakdown(yearRows, prevRow);

            // Calculate annual EUR totals by summing all categories
            let diffProfitEUR = 0;
            let diffProvisionEUR = 0;
            let diffCostsEUR = 0;

            Object.values(categoryBreakdown).forEach(cat => {
                diffProfitEUR += cat.profitEUR;
                diffProvisionEUR += cat.provisionEUR;
                diffCostsEUR += cat.costsEUR;
            });
            const netEUR = diffProfitEUR + diffProvisionEUR - diffCostsEUR;

            html += `
        <div class="mt-4 mb-10">
        <h3>Transaktionsaufstellung für den Zeitraum 01.01.-31.12.${year}</h3>
        ${renderCategoryTable(categoryBreakdown)}
        <h3>Ertragsaufstellung für den Zeitraum 01.01.-31.12.${year}</h3>
        <table class="w-full" style="border-collapse: collapse;">
        <thead>
        <tr>
        <th class="py-3 text-l px-2 pb-5 pt-2 text-left font-light text-text-color-secondary">Höhe der ausländischen Kapitalerträge</th>
        <th class="py-3 text-l px-2 pb-5 pt-2 text-right font-light text-text-color-secondary">Betrag ${c()}</th>
        </tr>
        </thead>
        <tbody>
        <tr>
        <td class="text-[14px] font-light text-text-color-primary">Eigene Erträge</td>
        <td class="text-[14px] font-light text-text-color-primary text-right">${diffProfitEUR.toFixed(2)} ${c()}</td>
        </tr>
        <tr>
        <td class="text-[14px] font-light text-text-color-primary">Erträge durch Partner (Provisionen)</td>
        <td class="text-[14px] font-light text-text-color-primary text-right">${diffProvisionEUR.toFixed(2)} ${c()}</td>
        </tr>
        <tr>
        <td class="text-[14px] font-light text-text-color-primary">Gebühren (Transaktionen, Netzwerk, System)</td>
        <td class="text-[14px] font-light text-text-color-primary text-right">${diffCostsEUR.toFixed(2)} ${c()}</td>
        </tr>
        <tr>
        <td class="text-[14px] font-bold text-text-color-primary">Ausländische Kapitalerträge ohne Steuerabzug</td>
        <td class="text-[14px] font-bold text-text-color-primary text-right">${netEUR.toFixed(2)} ${c()}</td>
        </tr>
        </tbody>
        </table>
        </div>
        `;
        });

        return html;
    }

    function calculateCategoryBreakdown(yearRows, prevRow) {
        const categories = {};
        const allKinds = [
            "REPLENISHMENT", "WITHDRAWAL", "WITHDRAWAL_DEPOSIT", "SUBSCRIPTION", "LICENSE",
            "INVESTMENT", "REINVESTMENT", "TOP_UP_DEPOSIT", "DIVIDEND", "CLAIMED_DIVIDEND",
            "AURUM_TOKEN", "FLASH_LOAN_PROFIT", "LIVE_TRADING", "LIVE_TRADING_BOTS",
            "LIVE_TRADING_BOT_STOP", "REFERRAL_FUND", "REFERRAL_RANK_BONUS",
            "TEAM_EARNINGS", "TEAM_EARNING_LIVE_TRADING", "REFERRAL_LICENSE_FUND",
            "CARD_RECHARGE", "REFERRAL_CARD_PURCHASE", "REFERRAL_CARD_TOPUP",
            "SHAREHOLDER_BONUS", "TRANSFER", "CARD_PURCHASE", "CARD_PURCHASE_PHYSICAL",
            "CARD_PURCHASE_CASHBACK", "MAINTENANCE_FEE"
        ];

        allKinds.forEach(kind => {
            categories[kind] = { profitUSD: 0, profitEUR: 0, provisionUSD: 0, provisionEUR: 0, costsUSD: 0, costsEUR: 0 };
        });

        for (let i = 0; i < yearRows.length; i++) {
            const currentRow = yearRows[i];
            const previousRow = i === 0 ? prevRow : yearRows[i - 1];
            const rate = getExchangeRate(currentRow.date);

            let kind = currentRow.kind;
            if (kind === 'MAINTENANCE_FEE' || kind === 'REINVESTMENT')
                kind = 'DIVIDEND';
            if (categories[kind]) {
                const diffProfit = currentRow.profit - previousRow.profit;
                const diffProvision = currentRow.provision - previousRow.provision;
                const diffCosts = currentRow.costs;

                categories[kind].profitUSD += diffProfit;
                categories[kind].profitEUR += diffProfit / rate;
                categories[kind].provisionUSD += diffProvision;
                categories[kind].provisionEUR += diffProvision / rate;
                categories[kind].costsUSD += diffCosts;
                categories[kind].costsEUR += diffCosts / rate;
            }
        }
        return categories;
    }

    function renderCategoryTable(categories) {
        let html = `<table class="w-full mb-4" style="border-collapse: collapse;">` +
            `<thead><tr>` +
            `<th class="py-3 text-xs px-2 pb-5 pt-2 text-left font-light text-text-color-secondary">Kategorie</th>` +
            `<th class="py-3 text-xs px-2 pb-5 pt-2 text-right font-light text-text-color-secondary">Profit ${c()}</th>` +
            `<th class="py-3 text-xs px-2 pb-5 pt-2 text-right font-light text-text-color-secondary">Prov. ${c()}</th>` +
            `<th class="py-3 text-xs px-2 pb-5 pt-2 text-right font-light text-text-color-secondary">Kosten ${c()}</th>` +
            `</tr></thead><tbody>`;

        Object.entries(categories).forEach(([kind, data]) => {
            if (data.profitEUR !== 0 || data.provisionEUR !== 0 || data.costsEUR !== 0) {
                html += `<tr class="border-b border-border-color-primary">` +
                    `<td class="text-[14px] font-light text-text-color-primary">${translateKind(kind)}</td>` +
                    `<td class="text-[14px] font-light text-text-color-primary text-right">${data.profitEUR.toFixed(2)}</td>` +
                    `<td class="text-[14px] font-light text-text-color-primary text-right">${data.provisionEUR.toFixed(2)}</td>` +
                    `<td class="text-[14px] font-light text-text-color-primary text-right">${data.costsEUR.toFixed(2)}</td>` +
                    `</tr>`;
            }
        });
        html += '</tbody></table>';
        return html;
    }

    renderForm();
})();