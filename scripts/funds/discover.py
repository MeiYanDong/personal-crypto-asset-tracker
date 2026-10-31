#!/usr/bin/env python3
"""Mac-only connector: existing cloud CLI profiles + SSH; uploads public identities."""
import concurrent.futures, datetime, fcntl, importlib.util, json, os, pathlib, re, signal, subprocess, sys, tempfile, time
from observer import api, utc
from limits import LIMITS, Admission

HERE = pathlib.Path(__file__).resolve().parent
CONFIG = pathlib.Path.home() / '.config/personal-asset-tracker'
STARTED = time.monotonic()
def command(args, timeout=90, input=None, parse=True):
    timeout = min(timeout, 600 - (time.monotonic() - STARTED))
    if timeout <= 0: raise TimeoutError('DISCOVERY_DEADLINE')
    # Bound CLI/SSH output while it is produced, rather than after capture_output.
    with tempfile.TemporaryFile() as output:
        proc = subprocess.Popen(args, stdin=subprocess.PIPE, stdout=output, stderr=subprocess.DEVNULL,
                                start_new_session=True, env={**os.environ, 'AWS_PAGER': '', 'AWS_MAX_ATTEMPTS': '2'})
        try:
            if input: proc.stdin.write(input.encode())
            proc.stdin.close(); started = time.monotonic()
            while proc.poll() is None:
                if time.monotonic() - started > timeout or os.fstat(output.fileno()).st_size > 4 * 1024 * 1024: raise RuntimeError('COMMAND_LIMIT')
                time.sleep(.1)
            if proc.returncode or os.fstat(output.fileno()).st_size > 4 * 1024 * 1024: raise RuntimeError('COMMAND_FAILED_OR_LIMIT')
            output.seek(0); return json.load(output) if parse else output.read().decode()
        finally:
            if proc.poll() is None:
                os.killpg(proc.pid, signal.SIGKILL); proc.wait()
def aws_inventory(profile):
    prefix = ['aws', '--profile', profile, '--output', 'json']
    identity = command(prefix + ['sts', 'get-caller-identity'])
    regions = command(prefix + ['ec2', 'describe-regions', '--region', 'us-east-2'])['Regions']
    servers = []; gaps = []
    def region_scan(region):
        result = command(prefix + ['ec2', 'describe-instances', '--region', region, '--no-paginate', '--max-results', '100'])
        if result.get('NextToken'): gaps.append('AWS 区域超出单页发现上限，待接入：' + region)
        return [{'id': item['InstanceId'], 'cloud': 'AWS', 'account': identity['Account'], 'name': next((x['Value'] for x in item.get('Tags', []) if x['Key'] == 'Name'), item['InstanceId']), 'region': region, 'state': item['State']['Name'], 'ip': item.get('PublicIpAddress', '')} for r in result['Reservations'] for item in r['Instances'] if item['State']['Name'] not in ['terminated', 'shutting-down']]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        if len(regions) > 32: gaps.append('AWS 区域超过 32 个，超出部分待接入。')
        futures = {pool.submit(region_scan, r['RegionName']): r['RegionName'] for r in regions[:32]}
        for f in concurrent.futures.as_completed(futures):
            try: servers.extend(f.result())
            except Exception: gaps.append('AWS 区域未覆盖：' + futures[f])
    return servers, gaps
def aliyun_inventory():
    tool = pathlib.Path.home() / '.codex/skills/aliyun-swas-cli/scripts/swas_fleet.py'
    spec = importlib.util.spec_from_file_location('funds_swas_fleet', tool)
    module = importlib.util.module_from_spec(spec); sys.modules[spec.name] = module; spec.loader.exec_module(module)
    started = time.monotonic()
    class BoundedRunner(module.AliyunRunner):
        calls = 0
        def run_text(self, arguments):
            remaining = 360 - (time.monotonic() - started)
            if self.calls >= 120 or remaining <= 0: raise module.FleetError('RESOURCE_LIMIT: cloud inventory')
            if '--page-number' in arguments and int(arguments[arguments.index('--page-number') + 1]) > 1: raise module.FleetError('RESOURCE_LIMIT: first page only')
            self.calls += 1
            try: return command([self.executable, *arguments], min(30, remaining), parse=False)
            except Exception: raise module.CliError('bounded cloud command failed') from None
    result = module.build_inventory(BoundedRunner(), None, None, module.DEFAULT_ANNOTATIONS)
    servers = []
    for row in result['instances']:
        servers.append({'id': row['instance_id'], 'cloud': 'Aliyun', 'name': row.get('instance_name') or row['instance_id'], 'region': row['region_id'], 'state': row['status'], 'ip': row.get('public_ip', '')})
    gaps = []
    if not result['coverage'].get('absence_is_conclusive'): gaps.append('阿里云部分账户或区域未覆盖；尚未认证的账户需要一次接入。')
    return servers, gaps
def scan_server(server, route, script):
    if server['state'].lower() not in ['running']: return None, '服务器未运行，沿用已登记地址：' + server['alias']
    if not route: return None, '新服务器待配置 SSH 入口：' + server['alias']
    args = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=8', '-o', 'StrictHostKeyChecking=yes'] + route['ssh']
    expected = route.get('hostname', '')
    if expected and not re.fullmatch(r'[a-zA-Z0-9_.-]+', expected): raise ValueError('INVALID_HOSTNAME')
    args += [('sudo -n ' if route.get('sudo') else '') + 'nice -n 19 python3 - ' + expected]
    try: return command(args, 40, script), None
    except Exception: return None, 'SSH 未读取，沿用已登记地址：' + server['alias']
def main():
    config = json.loads((CONFIG / 'discovery.json').read_text())
    with (CONFIG / 'discovery.lock').open('w') as lock:
        try: fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError: return
        registry = api('registry')
        if not registry: raise ValueError('INITIAL_REGISTRY_REQUIRED')
        admission = Admission(registry)
        gaps = []; discovered = []
        for name, fn in [('AWS', lambda: aws_inventory(config.get('awsProfile', 'aws-admin'))), ('Aliyun', aliyun_inventory)]:
            try:
                servers, issues = fn(); discovered.extend(servers); gaps.extend(issues)
            except Exception: gaps.append(name + ' 云清单读取失败，保留上次清单。')
        previous_servers = {s['id']: s for s in registry['servers']}
        for server in discovered:
            if server['id'] not in previous_servers and len(previous_servers) >= LIMITS['servers']:
                admission.pending['servers'] += 1; continue
            old = previous_servers.get(server['id'], {})
            server['alias'] = old.get('alias', server['name']); server['guestRead'] = False
            previous_servers[server['id']] = server
        routes = config.get('hosts', {}); rows = admission.rows; tokens = admission.tokens
        project_chains = {}; global_chains = {}
        for a in registry['addresses']:
            project_chains.setdefault((a['host'], a['project']), set()).add(str(a['chainId']))
            global_chains.setdefault(a['project'], set()).add(str(a['chainId']))
        script = (HERE / 'public_manifests.py').read_text()
        pending_projects = set()
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            futures = {pool.submit(scan_server, s, routes.get(s['alias']), script): s for s in previous_servers.values()}
            for future in concurrent.futures.as_completed(futures):
                server = futures[future]
                server['guestRead'] = False
                try: result, issue = future.result()
                except Exception: result, issue = None, '服务器发现失败：' + server['alias']
                if issue: gaps.append(issue)
                if not result: continue
                server['guestRead'] = True
                if result.get('errors'): gaps.append('部分公开清单未能读取：' + server['alias'])
                for manifest in result.get('files', []):
                    project = manifest['project']; known = project_chains.get((server['alias'], project), global_chains.get(project, set()))
                    for account in manifest['accounts']:
                        chain = str(account.get('chainId') or manifest.get('chainId') or (next(iter(known)) if len(known) == 1 else ''))
                        if not chain.isdigit(): pending_projects.add(project); continue
                        address = account['address'].lower() if account['address'].startswith('0x') else account['address']; key = (chain, address)
                        if key in rows:
                            # Keep curated ownership across replicas/backups; location is not ownership.
                            if rows[key]['host'] == server['alias']: rows[key]['lastSeenAt'] = result['observedAt']
                        else:
                            admission.account({'chainId': int(chain), 'address': address, 'project': project, 'host': server['alias'], 'role': account['role'], 'kind': account['kind'], 'source': manifest['path'], 'lastSeenAt': result['observedAt']})
                    for token in manifest['tokens']:
                        chain = str(token.get('chainId') or manifest.get('chainId') or '')
                        if chain.isdigit(): admission.token({**token, 'chainId': int(chain)})
        if any(admission.pending.values()): gaps.append('资源额度内自动接入；本轮超额发现待接入（可能含重复来源）：' + json.dumps(admission.pending, ensure_ascii=False) + '。已有账户继续更新，未接入部分不计为零。')
        if pending_projects: gaps.append('公开清单缺少明确链 ID：' + '、'.join(sorted(pending_projects)))
        gaps.append('OpenClaw 历史入口尚未连通；未认证云账户与未接入 SSH 的服务器不代表零余额。')
        servers = []
        for server in previous_servers.values():
            server['registeredAccounts'] = sum(a['host'] == server['alias'] for a in rows.values())
            servers.append({k: server[k] for k in ['id', 'cloud', 'name', 'alias', 'region', 'state', 'guestRead', 'registeredAccounts']})
        value = {'version': 1, 'generatedAt': utc(), 'addresses': list(rows.values()), 'tokens': list(tokens.values()), 'servers': servers, 'gaps': gaps, 'pending': admission.pending}
        api('registry', value, 'PUT', 90)
        (CONFIG / 'discovery-last.json').write_text(json.dumps({'generatedAt': value['generatedAt'], 'servers': len(servers), 'accounts': len(rows), 'pending': admission.pending, 'gaps': gaps}, ensure_ascii=False))
        print(json.dumps({'status': 'PARTIAL' if gaps else 'OK', 'servers': len(servers), 'accounts': len(rows), 'gapCount': len(gaps)}))
if __name__ == '__main__':
    def deadline(_signum, _frame): raise SystemExit('DISCOVERY_DEADLINE')
    signal.signal(signal.SIGALRM, deadline); signal.alarm(600)
    try: main()
    except Exception as exc:
        print(json.dumps({'status': 'FAILED', 'error': type(exc).__name__})); raise SystemExit(1)
