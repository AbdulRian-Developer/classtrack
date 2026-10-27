// Applies ClassTrack branding and signing to the generated Capacitor Android project.
// Run after `npx cap add android` and before `npx cap sync android`.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const app = path.join(root, 'android', 'app');
const res = path.join(app, 'src', 'main', 'res');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function must(cond, msg) { if (!cond) { console.error('customize-android: ' + msg); process.exit(1); } }
function copyDir(src, dst) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copyDir(s, d); }
    else fs.copyFileSync(s, d);
  }
}
function edit(file, fn) {
  const before = fs.readFileSync(file, 'utf8');
  const after = fn(before);
  must(after !== before, `no change made to ${path.relative(root, file)}`);
  fs.writeFileSync(file, after);
}

must(fs.existsSync(app), 'android/app not found. Run `npx cap add android` first.');

// 1. Icons, splash screens and launcher background colour
copyDir(path.join(root, 'android-res'), res);

// 2. Dark window + splash background so there is no white flash on launch
edit(path.join(res, 'values', 'styles.xml'), (x) => x
  .replace(/(<style name="AppTheme\.NoActionBarLaunch"[^>]*>)/, `$1
        <item name="windowSplashScreenBackground">#12151C</item>
        <item name="android:windowBackground">@drawable/splash</item>`)
  .replace(/(<style name="AppTheme\.NoActionBar"[^>]*>)/, `$1
        <item name="android:windowBackground">@color/ic_launcher_background</item>`));

// 3. Version + signing (a fixed key so new APKs install over old ones and keep data)
const runNo = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10);
const versionCode = 100 + runNo;
edit(path.join(app, 'build.gradle'), (g) => {
  g = g.replace(/versionCode \d+/, `versionCode ${versionCode}`)
       .replace(/versionName "[^"]*"/, `versionName "${pkg.version}"`);
  must(g.includes('buildTypes {'), 'buildTypes block not found in build.gradle');
  g = g.replace('buildTypes {', `signingConfigs {
        classtrack {
            storeFile file(System.getenv("CT_KEYSTORE") ?: "../../android-keys/classtrack-dev.jks")
            storePassword System.getenv("CT_STORE_PASS") ?: "classtrack"
            keyAlias System.getenv("CT_KEY_ALIAS") ?: "classtrack"
            keyPassword System.getenv("CT_KEY_PASS") ?: "classtrack"
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.classtrack
        }`);
  g = g.replace(/release \{\n(\s*)minifyEnabled false/, (m, sp) => `release {\n${sp}signingConfig signingConfigs.classtrack\n${sp}minifyEnabled false`);
  must(g.includes('signingConfig signingConfigs.classtrack\n            minifyEnabled') || /release \{\s*signingConfig/.test(g), 'could not add signing to release build');
  return g;
});

console.log(`customize-android: done (versionName ${pkg.version}, versionCode ${versionCode})`);
