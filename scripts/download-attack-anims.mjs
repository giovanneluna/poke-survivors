#!/usr/bin/env node
/**
 * Download Attack/Shoot/Charge animation spritesheets from PMDCollab.
 * For each Pokémon:
 *   1. Fetches AnimData.xml → parses frameWidth/frameHeight/frameCount
 *   2. Downloads the spritesheet PNG
 *   3. Outputs a JSON config for ENEMY_ATTACK_SPRITES
 *
 * Usage: node scripts/download-attack-anims.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BASE = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite';
const OUT_DIR = join(process.cwd(), 'public', 'assets', 'pokemon');

// ── Pokemon → Dex + Animation Type ──────────────────────────────────────
const POKEMON = [
  // name,          dex,    animType
  ['rattata',       '0019', 'attack'],
  ['pidgey',        '0016', 'attack'],
  ['zubat',         '0041', 'attack'],
  ['geodude',       '0074', 'charge'],   // charger behavior
  ['gastly',        '0092', 'shoot'],    // ranged
  ['caterpie',      '0010', 'attack'],
  ['weedle',        '0013', 'attack'],
  ['spearow',       '0021', 'attack'],
  ['ekans',         '0023', 'attack'],
  ['oddish',        '0043', 'attack'],
  ['mankey',        '0056', 'attack'],
  ['haunter',       '0093', 'shoot'],    // ranged
  ['machop',        '0066', 'attack'],
  ['golbat',        '0042', 'attack'],
  ['raticate',      '0020', 'attack'],   // boss
  ['arbok',         '0024', 'attack'],   // boss
  ['nidoking',      '0034', 'attack'],   // boss
  ['snorlax',       '0143', 'attack'],   // boss
  ['metapod',       '0011', 'attack'],
  ['kakuna',        '0014', 'attack'],
  ['gloom',         '0044', 'attack'],
  ['paras',         '0046', 'attack'],
  ['venonat',       '0048', 'attack'],
  ['drowzee',       '0096', 'shoot'],    // ranged
  ['cubone',        '0104', 'attack'],
  ['butterfree',    '0012', 'attack'],
  ['parasect',      '0047', 'attack'],
  ['venomoth',      '0049', 'attack'],
  ['hypno',         '0097', 'shoot'],    // ranged
  ['marowak',       '0105', 'attack'],
  ['pidgeotto',     '0017', 'attack'],
  ['graveler',      '0075', 'attack'],
  ['machoke',       '0067', 'attack'],
  ['koffing',       '0109', 'attack'],
  ['magnemite',     '0081', 'attack'],
  ['tentacool',     '0072', 'attack'],
  ['rhyhorn',       '0111', 'charge'],   // rammer behavior
  ['weezing',       '0110', 'attack'],
  ['magneton',      '0082', 'attack'],
  ['tentacruel',    '0073', 'attack'],
  ['rhydon',        '0112', 'charge'],   // rammer behavior
  ['scyther',       '0123', 'attack'],
  ['mr-mime',       '0122', 'attack'],
  ['hitmonlee',     '0106', 'charge'],   // leaper behavior
  ['electabuzz',    '0125', 'attack'],
  ['alakazam',      '0065', 'attack'],
  ['electrode',     '0101', 'attack'],
  ['crobat',        '0169', 'charge'],   // dasher behavior
  ['beedrill',      '0015', 'attack'],   // boss
  ['vileplume',     '0045', 'attack'],   // boss
  ['primeape',      '0057', 'attack'],   // boss
  ['gengar',        '0094', 'attack'],   // boss
  ['fearow',        '0022', 'attack'],   // boss
  ['pidgeot',       '0018', 'attack'],   // boss
  ['machamp',       '0068', 'attack'],   // boss
  ['golem',         '0076', 'attack'],   // boss
];

// Map animType to PMDCollab anim name (capitalized)
const ANIM_NAME_MAP = {
  attack: 'Attack',
  shoot:  'Shoot',
  charge: 'Charge',
};

// ── Parse AnimData.xml ──────────────────────────────────────────────────
function parseAnimData(xml, animName) {
  // Find the <Anims> section, then find the specific <Anim> with matching <Name>
  // PMDCollab XML format: <Anims><Anim><Name>Attack</Name><FrameWidth>64</FrameWidth>...

  // Check for CopyOf first
  const animRegex = new RegExp(
    `<Anim>\\s*<Name>${animName}</Name>([\\s\\S]*?)</Anim>`,
    'i'
  );
  const match = xml.match(animRegex);
  if (!match) return null;

  const block = match[1];

  // Check if it's a CopyOf
  const copyMatch = block.match(/<CopyOf>(\w+)<\/CopyOf>/);
  if (copyMatch) {
    // Recursively resolve CopyOf
    return parseAnimData(xml, copyMatch[1]);
  }

  const fw = block.match(/<FrameWidth>(\d+)<\/FrameWidth>/);
  const fh = block.match(/<FrameHeight>(\d+)<\/FrameHeight>/);

  // Count Duration entries to get frame count
  const durations = block.match(/<Duration>/g);
  const frameCount = durations ? durations.length : 0;

  if (!fw || !fh || frameCount === 0) return null;

  return {
    frameWidth: parseInt(fw[1]),
    frameHeight: parseInt(fh[1]),
    frameCount,
  };
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  const errors = [];
  let downloaded = 0;

  for (const [name, dex, animType] of POKEMON) {
    const animName = ANIM_NAME_MAP[animType];
    const pngName = `${animName}-Anim.png`;
    const outFileName = `${name}-${animType}.png`;
    const outPath = join(OUT_DIR, outFileName);

    process.stdout.write(`[${downloaded + 1}/${POKEMON.length}] ${name} (${animName})... `);

    // Skip if already downloaded
    if (existsSync(outPath)) {
      // Still need to parse AnimData for config
      try {
        const xmlRes = await fetch(`${BASE}/${dex}/AnimData.xml`);
        if (!xmlRes.ok) throw new Error(`AnimData 404`);
        const xml = await xmlRes.text();
        let parsed = parseAnimData(xml, animName);

        // Fallback: if Shoot/Charge not found, try Attack
        if (!parsed && animType !== 'attack') {
          parsed = parseAnimData(xml, 'Attack');
          if (parsed) {
            console.log(`(fallback to Attack) CACHED`);
          }
        }

        if (parsed) {
          results.push({ name, dex, animType, outFileName, ...parsed });
          console.log(`CACHED (${parsed.frameWidth}×${parsed.frameHeight}, ${parsed.frameCount}f)`);
        } else {
          console.log('CACHED (no parse)');
          errors.push({ name, reason: 'cached but cannot parse AnimData' });
        }
      } catch {
        console.log('CACHED (no AnimData)');
      }
      downloaded++;
      continue;
    }

    try {
      // 1. Fetch AnimData.xml
      const xmlRes = await fetch(`${BASE}/${dex}/AnimData.xml`);
      if (!xmlRes.ok) throw new Error(`AnimData.xml: ${xmlRes.status}`);
      const xml = await xmlRes.text();

      let parsed = parseAnimData(xml, animName);
      let actualAnimName = animName;

      // Fallback: if Shoot/Charge not found, try Attack
      if (!parsed && animType !== 'attack') {
        parsed = parseAnimData(xml, 'Attack');
        actualAnimName = 'Attack';
        if (parsed) {
          console.log(`(fallback to Attack) `);
        }
      }

      if (!parsed) {
        errors.push({ name, reason: `${animName} anim not found in AnimData.xml` });
        console.log('SKIP (anim not found)');
        downloaded++;
        continue;
      }

      // 2. Download spritesheet
      const pngUrl = `${BASE}/${dex}/${actualAnimName}-Anim.png`;
      const pngRes = await fetch(pngUrl);
      if (!pngRes.ok) {
        // Try fallback to Attack if primary failed
        if (actualAnimName !== 'Attack') {
          const fallbackUrl = `${BASE}/${dex}/Attack-Anim.png`;
          const fallbackRes = await fetch(fallbackUrl);
          if (fallbackRes.ok) {
            const fallbackParsed = parseAnimData(xml, 'Attack');
            if (fallbackParsed) {
              const buf = Buffer.from(await fallbackRes.arrayBuffer());
              const fallbackFileName = `${name}-attack.png`;
              writeFileSync(join(OUT_DIR, fallbackFileName), buf);
              results.push({ name, dex, animType: 'attack', outFileName: fallbackFileName, ...fallbackParsed });
              console.log(`FALLBACK Attack (${fallbackParsed.frameWidth}×${fallbackParsed.frameHeight}, ${fallbackParsed.frameCount}f)`);
              downloaded++;
              continue;
            }
          }
        }
        errors.push({ name, reason: `${actualAnimName}-Anim.png: ${pngRes.status}` });
        console.log(`SKIP (PNG ${pngRes.status})`);
        downloaded++;
        continue;
      }

      const buf = Buffer.from(await pngRes.arrayBuffer());
      const actualOutFileName = actualAnimName !== animName
        ? `${name}-attack.png`
        : outFileName;
      writeFileSync(join(OUT_DIR, actualOutFileName), buf);

      results.push({
        name,
        dex,
        animType: actualAnimName !== animName ? 'attack' : animType,
        outFileName: actualOutFileName,
        ...parsed,
      });

      console.log(`OK (${parsed.frameWidth}×${parsed.frameHeight}, ${parsed.frameCount}f)`);
      downloaded++;

      // Rate limit: small delay
      await new Promise(r => setTimeout(r, 100));

    } catch (err) {
      errors.push({ name, reason: err.message });
      console.log(`ERROR: ${err.message}`);
      downloaded++;
    }
  }

  // ── Generate config output ──────────────────────────────────────────
  console.log(`\n=== RESULTS ===`);
  console.log(`Downloaded: ${results.length}/${POKEMON.length}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    for (const e of errors) {
      console.log(`  - ${e.name}: ${e.reason}`);
    }
  }

  // Generate TypeScript config
  const tsLines = results.map(r => {
    const key = r.name.replace(/-/g, '');
    const spriteKey = `${r.name}-${r.animType}`;
    return `  ${key}: { key: '${spriteKey}', path: 'assets/pokemon/${r.outFileName}', frameWidth: ${r.frameWidth}, frameHeight: ${r.frameHeight}, frameCount: ${r.frameCount}, directions: 8 as const, animType: '${r.animType}' as const },`;
  });

  const tsConfig = `// Auto-generated by download-attack-anims.mjs
// ${results.length} attack animation configs
export const ENEMY_ATTACK_SPRITES = {
${tsLines.join('\n')}
} as const;
`;

  const configPath = join(process.cwd(), 'scripts', 'attack-anim-config.ts');
  writeFileSync(configPath, tsConfig);
  console.log(`\nConfig written to: ${configPath}`);
}

main().catch(console.error);
