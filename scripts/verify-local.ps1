param([string]$NodePath = 'node')
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
  & $NodePath --input-type=module -e "const [major, minor] = process.versions.node.split('.').map(Number); if (major < 24 || (major === 24 && minor < 12)) { console.error('Node >=24.12.0 required'); process.exit(1); } console.log('Node', process.version);"
  if ($LASTEXITCODE -ne 0) { throw 'Node version check failed' }
  & $NodePath node_modules/typescript/lib/tsc.js --noEmit
  if ($LASTEXITCODE -ne 0) { throw 'Typecheck failed' }
  & $NodePath --import ./scripts/register-typescript.mjs --test 'src/core/*.test.ts' firestore.rules.test.ts
  if ($LASTEXITCODE -ne 0) { throw 'Unit tests failed' }
  & $NodePath node_modules/vite/bin/vite.js build
  if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
  Write-Output 'Typecheck, unit tests and build passed. npm audit and browser/Emulator tests are separate checks.'
} finally {
  Pop-Location
}
