# 🎯 Sudoku PWA - 10000 Levels

Permainan Sudoku offline-ready dengan 10000 tahap merentasi 4 kesukaran.

## ✨ Features

- **Tahap Banyak**: Default 10000 (2500 setiap kesukaran), boleh generate ikut suka
- **Offline Support**: PWA boleh main tanpa internet
- **Auto-Save**: Progress disimpan automatik dalam localStorage
- **Timer**: Rakam masa setiap permainan
- **Mistake Counter**: Maksimum 3 kesilapan setiap tahap
- **Notes Mode**: Tulis nota kecil dalam sel
- **Hint Button**: Dapatkan hint bila tersekat
- **Undo Function**: Undo langkah salah
- **Smart Highlights**: Auto highlight row, column, box dan nombor sama
- **Mobile-First**: Optimized untuk portrait mode
- **Dark Mode**: Design gelap yang selesa untuk mata

## 📁 Struktur Fail

```
sudoku-pwa/
├── index.html                      # Main HTML
├── manifest.json                   # PWA manifest
├── service-worker.js               # Service worker untuk offline
├── assets/
│   ├── css/
│   │   └── style.css              # All styles
│   ├── js/
│   │   ├── app.js                 # Main app logic & UI
│   │   ├── sudoku.js              # Game logic & validation
│   │   └── storage.js             # localStorage management
│   └── data/
│       ├── puzzles.json           # 10000 puzzles (~2.1MB)
│       └── generate-puzzles.js    # Puzzle generator script
└── README.md
```

## 🚀 Cara Setup

### Option 1: Guna Server Lokal

```bash
# Guna Python
python3 -m http.server 8000

# Atau guna Node.js
npx serve

# Atau guna PHP
php -S localhost:8000
```

Kemudian buka: `http://localhost:8000`

### Option 2: Deploy ke Hosting

Upload semua fail ke mana-mana static hosting:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- Cloudflare Pages

### Option 3: Install sebagai PWA

1. Buka app dalam browser (Chrome/Edge/Safari)
2. Klik menu (⋮) > "Install App" atau "Add to Home Screen"
3. App akan jadi icon di phone/desktop
4. Boleh main offline selepas install!

## 🎮 Cara Main

### Main Screen
- Pilih kesukaran: Easy, Medium, Hard, atau Expert
- Kalau ada game tertanggal, ada button "Resume"

### Level Selection
- Pilih mana-mana tahap dari 1 sampai jumlah yang ada
- Tahap completed ada tanda ✓
- Klik tahap untuk mula

### Game Controls

**Number Pad**: Klik nombor untuk isi sel yang dipilih

**Control Buttons**:
- **✏️ Notes**: Toggle notes mode untuk tulis nota kecil
- **💡 Hint**: Dapat hint (isi satu sel automatik)
- **↶ Undo**: Undo langkah terakhir
- **⌫ Erase**: Padam isi sel

**Board Interaction**:
- Tap sel untuk pilih
- Highlight automatik: row, column, box
- Nombor sama akan highlight sama
- Sel salah akan shake dengan animation merah

### Game Stats
- **Timer**: Rakam masa (MM:SS format)
- **Mistakes**: Tunjuk jumlah kesilapan (tiada game over)
- Level number dan kesukaran

### Win Condition
- Isi semua sel dengan betul
- Modal congratulations akan keluar
- Tunjuk time dan mistakes
- Button untuk next level atau balik menu

## 🔧 Generate Puzzles Baru

Kalau nak generate puzzles sendiri:

```bash
cd assets/data
# Default: 2500 puzzles per difficulty (10000 total)
node generate-puzzles.js

# Example: 2500 puzzles per difficulty (10000 total)
node generate-puzzles.js --per-difficulty 2500
```

Script akan generate puzzles baru dengan solutions.

**Settings**:
- Easy: 40-45 clues (easier)
- Medium: 32-37 clues
- Hard: 27-30 clues
- Expert: 23-26 clues (hardest)

## 💾 Data Storage

Semua data disimpan dalam browser localStorage:

- `sudoku_current_game`: Current game state
- `sudoku_completed_levels`: List tahap completed
- `sudoku_settings`: User settings

Clear data: Buka browser DevTools > Application > Clear Storage

## 🎨 Design

**Color Scheme**:
- Background: Deep blue-black (`#0a0e27`)
- Accent: Purple gradient (`#7c3aed`)
- Text: Light blue-white (`#e8eaf6`)

**Typography**: System font stack untuk fast loading

**Animations**: Smooth transitions dan micro-interactions

**Responsive**: Mobile portrait optimized, works on tablet/desktop

## 🔒 Offline Support

Service worker cache strategy:
1. Install: Cache semua resources
2. Fetch: Serve dari cache first, fallback ke network
3. Update: Auto update cache bila ada version baru

Cache includes:
- HTML, CSS, JavaScript
- Puzzles JSON (212KB)
- Manifest

Total size: ~284KB (sangat ringan!)

## 📱 Browser Support

- ✅ Chrome/Edge (best PWA support)
- ✅ Safari iOS (with Add to Home Screen)
- ✅ Firefox
- ✅ Samsung Internet
- ✅ Opera

## 🎯 Tips Main

1. **Easy Levels**: Best untuk belajar strategy
2. **Notes Mode**: Guna untuk tandakan possible numbers
3. **Highlights**: Perhatikan highlight untuk cari pattern
4. **Mistakes**: Tak ada limit game over—main je sampai siap.
5. **Hints**: Simpan untuk saat critical
6. **Undo**: Jangan takut try, boleh undo

## 📊 Technical Details

- **Vanilla JavaScript**: No frameworks, pure JS
- **CSS Grid**: Modern layout
- **LocalStorage API**: Progress saving
- **Service Worker API**: Offline caching
- **Web App Manifest**: PWA installation
- **Touch Events**: Mobile-optimized

## 🐛 Troubleshooting

**App tidak load?**
- Check browser console untuk errors
- Pastikan semua files dalam struktur yang betul
- Clear cache dan reload

**PWA install tidak keluar?**
- Kena guna HTTPS atau localhost
- Service worker kena register successfully
- Check browser PWA support

**Progress hilang?**
- Check localStorage tidak disabled
- Don't use incognito/private mode
- Jangan clear browser data

**Performance issue?**
- Puzzle generation agak heavy untuk low-end devices
- Tutup apps lain untuk free up memory
- Puzzles dah pre-generated jadi gameplay smooth

## 📄 License

Free to use, modify, and distribute.

## 🙏 Credits

Dibina dengan vanilla HTML, CSS, dan JavaScript.
Sudoku puzzle generation algorithm menggunakan backtracking dengan unique solution validation.

---

Selamat bermain! 🎮🎯
