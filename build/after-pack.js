// Runs after electron-builder has packed the app and before the installer is made:
// signs the app with castlabs' free VMP service so Widevine (Spotify sound) works on every PC.
const { execFileSync } = require('child_process');
exports.default = async function (ctx) {
  if (ctx.electronPlatformName !== 'win32') return;
  if (!process.env.EVS_ACCOUNT_NAME || !process.env.EVS_PASSWD) throw new Error('EVS_ACCOUNT_NAME and EVS_PASSWD are not set: Spotify sound needs the signature, so the build stops here.');
  const py = process.env.PYTHON || 'python';
  console.log('VMP signing', ctx.appOutDir);
  execFileSync(py, ['-m', 'castlabs_evs.vmp', '--no-ask', 'sign-pkg', '--streaming', ctx.appOutDir], { stdio: 'inherit' });
  execFileSync(py, ['-m', 'castlabs_evs.vmp', '--no-ask', 'verify-pkg', ctx.appOutDir], { stdio: 'inherit' });
};
