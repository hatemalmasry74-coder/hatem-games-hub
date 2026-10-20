#!/usr/bin/env node
/* node scripts/set_app_id.js com.yourname.moodyadventures
 * Sets the Play package name (applicationId) in the ONE place that matters: capacitor.config.ts (build.gradle reads it from there).
 * The Java namespace (moody.wrapper) is independent and never needs to change. Do this BEFORE the first upload: it can never change after. */
'use strict'; const fs = require('fs'), path = require('path');
const id = process.argv[2];
if (!id || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(id)) { console.error('usage: set_app_id.js <reverse.domain.id>   (lowercase letters/digits/underscore, at least two segments)'); process.exit(1); }
if (/^com\.(example|android|google)\b/.test(id)) { console.error('Google Play rejects com.example.* / com.android.* / com.google.* ids. Use your own.'); process.exit(1); }
const p = path.join(__dirname, '..', 'capacitor.config.ts'); let s = fs.readFileSync(p, 'utf8');
s = s.replace(/appId:\s*'[^']+'/, `appId: '${id}'`).replace(/\/\/ <-- REPLACE[^\n]*/, '// set with scripts/set_app_id.js');
fs.writeFileSync(p, s); console.log('appId set to', id, '\nnow run:  npx cap sync android');
