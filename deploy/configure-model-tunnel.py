import argparse
import os
import re
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path


def require_private_service():
    try:
        urllib.request.urlopen('http://127.0.0.1:5195/health', timeout=5)
    except urllib.error.HTTPError as error:
        if error.code == 401:
            return
        raise
    raise RuntimeError('The model health endpoint must require authentication.')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if not args.apply:
        print('Add models.southneuhof.tech -> http://127.0.0.1:5195 to cfos-muslik.')
        print('Run with --apply as root to validate, publish DNS, and restart the tunnel.')
        return
    if os.geteuid() != 0:
        raise SystemExit('Root access is required for the tunnel configuration.')
    require_private_service()
    path = Path('/etc/cloudflared/config.yml')
    original = path.read_text()
    lines = original.splitlines(keepends=True)
    if 'cfos.southneuhof.tech' not in original:
        raise RuntimeError('The expected existing CloudflareOS route was not found.')
    if 'models.southneuhof.tech' in original:
        raise RuntimeError('The model hostname is already configured. Inspect it before changing it.')
    catchalls = [(i, match.group(1)) for i, line in enumerate(lines)
                 if (match := re.fullmatch(r'''(\s*)-\s*service:\s*["']?http_status:404["']?\s*''', line))]
    if len(catchalls) != 1 or not any(re.fullmatch(r'ingress:\s*', line) for line in lines):
        raise RuntimeError('Unsupported ingress layout. No configuration was changed.')
    index, indent = catchalls[0]
    addition = f'{indent}- hostname: models.southneuhof.tech\n{indent}  service: http://127.0.0.1:5195\n'
    candidate_text = ''.join(lines[:index]) + addition + ''.join(lines[index:])
    candidate = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', dir=path.parent, prefix='.kos-ingress-', delete=False) as file:
            candidate = Path(file.name)
            file.write(candidate_text)
        os.chmod(candidate, path.stat().st_mode & 0o777)
        subprocess.run(['/usr/bin/cloudflared', '--config', str(candidate), 'tunnel', 'ingress', 'validate'], check=True)
        subprocess.run(['/usr/bin/cloudflared', '--config', str(candidate), 'tunnel', 'route', 'dns', 'cfos-muslik', 'models.southneuhof.tech'], check=True)
        backup = path.with_name(f'config.yml.before-kos-models-{time.time_ns()}')
        shutil.copy2(path, backup)
        os.chmod(backup, 0o600)
        os.replace(candidate, path)
        candidate = None
        try:
            subprocess.run(['systemctl', 'restart', 'cloudflared.service'], check=True)
            subprocess.run(['systemctl', 'is-active', '--quiet', 'cloudflared.service'], check=True)
        except subprocess.CalledProcessError:
            shutil.copy2(backup, path)
            subprocess.run(['systemctl', 'restart', 'cloudflared.service'], check=False)
            raise
        print('Model hostname published. Existing ingress was preserved and a private backup was saved.')
    finally:
        if candidate is not None:
            candidate.unlink(missing_ok=True)


if __name__ == '__main__':
    main()
