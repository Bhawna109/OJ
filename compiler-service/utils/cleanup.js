const fs = require('fs');
const path = require('path');

const dirs = ['codes', 'inputs', 'outputs'].map((d) => path.join(__dirname, '..', d));

// Delete any file/folder in the work dirs older than MAX_AGE.
// Executions finish in ~5s, so a 10-minute floor never touches an in-use file.
const MAX_AGE_MS = 10 * 60 * 1000;

function sweep() {
    const cutoff = Date.now() - MAX_AGE_MS;
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        let entries;
        try {
            entries = fs.readdirSync(dir);
        } catch {
            continue;
        }
        for (const entry of entries) {
            const full = path.join(dir, entry);
            try {
                const stat = fs.statSync(full);
                if (stat.mtimeMs < cutoff) {
                    fs.rmSync(full, { recursive: true, force: true });
                }
            } catch {
                // file may have been removed by another sweep / the OS; ignore
            }
        }
    }
}

function startCleanup() {
    sweep(); // clear anything left over from a previous run / crash
    setInterval(sweep, 5 * 60 * 1000).unref(); // then every 5 minutes
}

module.exports = { startCleanup, sweep };
