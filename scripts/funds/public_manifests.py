"""Runs over SSH stdin. Read ONLY explicitly public manifests and own status fields."""
import datetime, json, os, pathlib, re, resource, signal, socket, sys
resource.setrlimit(resource.RLIMIT_AS, (128 * 1024 * 1024, 128 * 1024 * 1024))
resource.setrlimit(resource.RLIMIT_CPU, (4, 5))
signal.alarm(15)
host = socket.gethostname()
if len(sys.argv) > 1 and sys.argv[1] and host != sys.argv[1]:
    print(json.dumps({'error': 'HOSTNAME_MISMATCH'})); raise SystemExit(2)
names = {'funds-public.json', 'wallet-public.json', 'wallet.public.json', 'senders-public.json', 'fleet-public.json', 'own-addresses.json', 'public-wallets.json', 'wallets-public.json', 'status.json'}
skip = {'private', 'backups', 'archive', 'archives', 'releases', 'node_modules', 'docker', 'containerd', 'snapd', 'apt', 'dpkg', 'systemd', 'journal', 'cloud', 'postgresql', 'mysql', 'redis', 'signed', 'signed-transactions'}
address_re = re.compile(r'^(0x[0-9a-fA-F]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$')
files = []; errors = []; read_bytes = 0; directories_seen = 0; accounts_seen = 0; tokens_seen = 0
for base in ['/var/lib', '/opt']:
    for parent, directories, filenames in os.walk(base, followlinks=False):
        directories_seen += 1
        if directories_seen > 2000:
            errors.append('DIRECTORY_LIMIT'); break
        rel = pathlib.Path(parent).relative_to(base)
        directories[:] = [n for n in directories if n not in skip and not n.startswith(('.', 'backup')) and not any(x in n for x in ['-backups', '-preflight', 'diagnostics']) and len(rel.parts) < 4 and not pathlib.Path(parent, n).is_symlink()]
        for name in filenames:
            if name not in names: continue
            path = pathlib.Path(parent, name)
            if path.is_symlink(): continue
            size = path.stat().st_size
            if size > 4 * 1024 * 1024 or read_bytes + size > 16 * 1024 * 1024 or len(files) >= 128:
                if len(errors) < 16: errors.append('FILE_LIMIT:' + str(path))
                continue
            read_bytes += size
            try:
                document = json.loads(path.read_text())
                if not isinstance(document, dict): continue
                project = document.get('project') or (rel.parts[0] if rel.parts else '')
                if not isinstance(project, str) or not project: continue
                rows = []; chain = document.get('chainId')
                def add(value, role='owner', kind='wallet', chain_id=chain):
                    global accounts_seen
                    if isinstance(value, str) and address_re.fullmatch(value):
                        if accounts_seen >= 10000:
                            if len(errors) < 16: errors.append('ACCOUNT_LIMIT')
                            return
                        accounts_seen += 1
                        rows.append({'address': value, 'role': str(role)[:32], 'kind': str(kind)[:32], 'chainId': chain_id})
                if name == 'funds-public.json':
                    for row in document.get('accounts', []):
                        if isinstance(row, dict) and row.get('owned') is True:
                            add(row.get('address'), row.get('role', 'owner'), row.get('kind', 'wallet'), row.get('chainId', chain))
                else:
                    # Do not recursively extract arbitrary contracts, counterparties, or rivals.
                    for key in ['address', 'owner', 'beneficiary', 'wallet', 'walletA', 'walletB']: add(document.get(key))
                    if name == 'status.json':
                        if len(rel.parts) > 2: continue
                        add(document.get('executor'), 'custody', 'executor')
                        for field in ['queue', 'fleet']:
                            nested = document.get(field)
                            if isinstance(nested, dict): add(nested.get('executorMulti') or nested.get('executor'), 'custody', 'executor')
                    for key in ['addresses', 'senders', 'wallets']:
                        for row in document.get(key, []) if isinstance(document.get(key), list) else []:
                            add(row.get('address') if isinstance(row, dict) else row, 'sender' if key == 'senders' or 'fleet' in name else 'owner', chain_id=row.get('chainId', chain) if isinstance(row, dict) else chain)
                tokens = []
                if name == 'funds-public.json':
                    for token in document.get('assets', []):
                        if isinstance(token, dict) and address_re.fullmatch(str(token.get('address', ''))) and isinstance(token.get('decimals'), int) and 0 <= token['decimals'] <= 36:
                            if tokens_seen >= 256:
                                if len(errors) < 16: errors.append('TOKEN_LIMIT')
                                break
                            tokens_seen += 1
                            tokens.append({k: token.get(k) for k in ['chainId', 'address', 'symbol', 'decimals', 'valuation']})
                files.append({'path': str(path), 'project': project, 'chainId': chain, 'accounts': rows, 'tokens': tokens})
            except Exception:
                if len(errors) < 16: errors.append(str(path))
print(json.dumps({'hostname': host, 'observedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'files': files, 'errors': errors}, separators=(',', ':')))
