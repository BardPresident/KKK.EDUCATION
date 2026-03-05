#!/usr/bin/env node

////////////////////////////////////////////////////////////////////////////////
// 🎬 TOMB CINEMA MANIFEST GENERATOR 🎬
//
// Scans your archive and creates manifest.json for cinema.html
//
// HOW TO USE:
// 1. Make sure ARCHIVE_DIR below points to your media directory
// 2. Run: node generate-manifest.js
// 3. Upload cinema.html + manifest.json to https://kkk.education/cinema/
// 4. Point any other site (e.g. GitHub Pages) at the SAME manifest –
//    all media will stream from https://kkk.education/cinema/....
//
////////////////////////////////////////////////////////////////////////////////

// ═════════════════════════════════════════════════════════════════════════
// 👇 CHANGE THIS TO YOUR MEDIA FOLDER ON THE SERVER 👇
// ═════════════════════════════════════════════════════════════════════════
const ARCHIVE_DIR = '/mnt/storage/KKK/cinema';

// All media is served from here (canonical origin for files)
const WEB_PREFIX = 'https://kkk.education/cinema';

// Output file
const OUTPUT_FILE = 'manifest.json';

////////////////////////////////////////////////////////////////////////////////
// DON'T EDIT BELOW UNLESS YOU KNOW WHAT YOU'RE DOING
////////////////////////////////////////////////////////////////////////////////

const fs = require('fs');
const path = require('path');

// Video and audio extensions to count as productions
const VIDEO_EXTS = ['mp4', 'mpeg4', 'ogv', 'webm', 'avi', 'mov', 'mkv', 'm4v'];
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

// Stats
let stats = {
    folders: 0,
    productions: 0, // videos + audio
    total: 0,
    totalSize: 0
};

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Header
console.log('');
log('cyan', '╔════════════════════════════════════════════════════════════╗');
log('cyan', '║     💀 TOMB CINEMA MANIFEST GENERATOR 💀                  ║');
log('cyan', '║     "Where tears become pixels"                          ║');
log('cyan', '╚════════════════════════════════════════════════════════════╝');
console.log('');

// Check if directory exists
if (!fs.existsSync(ARCHIVE_DIR)) {
    log('red', '❌ ERROR: Directory not found: ' + ARCHIVE_DIR);
    log('yellow', '💡 Edit this script and set ARCHIVE_DIR to your media directory');
    process.exit(1);
}

log('green', '📁 Scanning: ' + ARCHIVE_DIR);
log('blue',  '🌐 Web prefix (canonical media origin): ' + WEB_PREFIX);
console.log('');
log('yellow', '🔮 Summoning files from the void...');
console.log('');

// Process directory recursively
function processDir(dirPath, relativePath = '', indent = '') {
    const items = [];

    log('cyan', `${indent}📂 ${relativePath || 'Root'}`);

    let entries;
    try {
        entries = fs.readdirSync(dirPath);
    } catch (error) {
        log('red', `${indent}  ❌ Cannot read directory: ${error.message}`);
        return items;
    }

    // Sort entries: folders first, then files
    const folders = [];
    const files = [];

    entries.forEach(entry => {
        const fullPath = path.join(dirPath, entry);
        let stat;

        try {
            stat = fs.statSync(fullPath);
        } catch (error) {
            return; // Skip files we can't access
        }

        if (stat.isDirectory()) {
            folders.push({ name: entry, stat });
        } else if (stat.isFile()) {
            files.push({ name: entry, stat });
        }
    });

    // Process folders
    folders.sort((a, b) => a.name.localeCompare(b.name));
    folders.forEach(({ name }) => {
        const fullPath = path.join(dirPath, name);
        const newRelative = relativePath ? `${relativePath}/${name}` : name;

        stats.folders++;

        const children = processDir(fullPath, newRelative, indent + '  ');

        items.push({
            name,
            type: 'folder',
            children
        });
    });

    // Process files
    files.sort((a, b) => a.name.localeCompare(b.name));
    files.forEach(({ name, stat }) => {
        const fullPath = path.join(dirPath, name);
        const relPathPart = relativePath ? `${relativePath}/` : '';
        const webPath = `${WEB_PREFIX}/${relPathPart}${name}`;
        const size = stat.size;
        const ext = path.extname(name).substring(1).toLowerCase();

        stats.total++;
        stats.totalSize += size;

        if (VIDEO_EXTS.includes(ext) || AUDIO_EXTS.includes(ext)) {
            stats.productions++;
            const icon = VIDEO_EXTS.includes(ext) ? '🎬' : '🎵';
            log('blue', `${indent}  ${icon} ${name}`);
        } else {
            console.log(`${indent}  📄 ${name}`);
        }

        items.push({
            name,
            type: 'file',
            path: webPath,
            size
        });
    });

    return items;
}

// Scan the directory
const items = processDir(ARCHIVE_DIR);

// Create manifest
const manifest = {
    generated: new Date().toISOString(),
    archiveDir: ARCHIVE_DIR,
    webPrefix: WEB_PREFIX,
    stats: {
        folders: stats.folders,
        productions: stats.productions,
        total: stats.total,
        totalSize: stats.totalSize
    },
    items
};

// Write manifest file
try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
} catch (error) {
    log('red', '❌ ERROR: Cannot write manifest file: ' + error.message);
    process.exit(1);
}

// Success!
const sizeGB = (stats.totalSize / 1024 / 1024 / 1024).toFixed(2);

console.log('');
log('green', '╔════════════════════════════════════════════════════════════╗');
log('green', '║                    ✅ SUCCESS! ✅                          ║');
log('green', '╚════════════════════════════════════════════════════════════╝');
console.log('');
log('cyan', '📊 ARCHIVE STATS:');
console.log(`   📁 Folders:        ${colors.yellow}${stats.folders}${colors.reset}`);
console.log(`   🎬 Productions:    ${colors.yellow}${stats.productions}${colors.reset}`);
console.log(`   📦 Total Files:    ${colors.yellow}${stats.total}${colors.reset}`);
console.log(`   💾 Archive Size:   ${colors.yellow}${sizeGB} GB${colors.reset}`);
console.log('');
log('cyan', '📝 Output file:     ' + colors.yellow + OUTPUT_FILE);
console.log('');
log('green', '🚀 NEXT STEPS:');
console.log(`   1. Upload ${colors.yellow}cinema.html${colors.reset} and ${colors.yellow}${OUTPUT_FILE}${colors.reset} to https://kkk.education/cinema/`);
console.log(`   2. Make sure files in ${colors.yellow}${ARCHIVE_DIR}${colors.reset} are web-accessible at ${colors.yellow}${WEB_PREFIX}${colors.reset}`);
console.log('   3. On GitHub Pages, use the SAME manifest.json – media will stream from kkk.education.');
console.log('   4. Visit your cinema page! 🎬');
console.log('');
log('cyan', '💀 Built in detention. Watched forever. 💀');
console.log('');
