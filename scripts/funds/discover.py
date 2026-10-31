#!/usr/bin/env python3
"""Mac-only connector: existing cloud CLI profiles + SSH; uploads public identities."""
import concurrent.futures, datetime, fcntl, json, os, pathlib, re, subprocess, sys
from observer import api, utc

HERE = pathlib.Path(__file__).resolve().parent
CONFIG = pathlib.Path.home() / '.config/personal-asset-tracker'
def command(args, timeout=90, input=None):
    proc = subprocess.run(args, input=input, text=True, capture_output=True, timeout=timeout, env={**os.environ, 'AWS_PAGER': ''})
    if proc.returncode: raise RuntimeError('COMMAND_FAILED')
    return json.loads(proc.stdout)
def aws_inventory(profile):
    prefix = ['aws', '--profile', profile, '--output', 'json']
    identity = command(prefix + ['sts', 'get-caller-identity'])
    regions = command(prefix + ['ec2', 'describe-regions', '--region', 'us-east-2'])['Regions']
    servers = []; gaps = []
    def region_scan(region):
        result = command(prefix + ['ec2', 'describe-instances', '--region', region])
        return [{'id': item['InstanceId'], 'cloud': 'AWS', 'account': identity['Account'], 'name': next((x['Value'] for x in item.get('Tags', []) if x['Key'] == 'Name'), item['InstanceId']), 'region': region, 'state': item['State']['Name'], 'ip': item.get('PublicIpAddress', '')} for r in result['Reservations'] for item in r['Instances'] if item['State']['Name'] not in ['terminated', 'shutting-down']]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(region_scan, r['RegionName']): r['RegionName'] for r in regions}
        for f in concurrent.futures.as_completed(futures):
            try: servers.extend(f.result())
            except Exception: gaps.append('AWS 区域未覆盖：' + futures[f])
    return servers, gaps
def aliyun_inventory():
    tool = pathlib.Path.home() / '.codex/skills/aliyun-swas-cli/scripts/swas_fleet.py'
    result = command([sys.executable, str(tool), 'inventory'], 360)
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
        gaps = []; discovered = []
        for name, fn in [('AWS', lambda: aws_inventory(config.get('awsProfile', 'aws-admin'))), ('Aliyun', aliyun_inventory)]:
            try:
                servers, issues = fn(); discovered.extend(servers); gaps.extend(issues)
            except Exception: gaps.append(name + ' 云清单读取失败，保留上次清单。')
        previous_servers = {s['id']: s for s in registry['servers']}
        for server in discovered:
            old = previous_servers.get(server['id'], {})
            server['alias'] = old.get('alias', server['name']); server['guestRead'] = False
            previous_servers[server['id']] = server
        routes = config.get('hosts', {}); rows = {(str(a['chainId']), a['address'].lower() if a['address'].startswith('0x') else a['address']): a for a in registry['addresses']}
        tokens = {(str(t['chainId']), t['address']): t for t in registry['tokens']}
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
                            rows[key] = {'chainId': int(chain), 'address': address, 'project': project, 'host': server['alias'], 'role': account['role'], 'kind': account['kind'], 'source': manifest['path'], 'lastSeenAt': result['observedAt']}
                    for token in manifest['tokens']:
                        chain = str(token.get('chainId') or manifest.get('chainId') or '')
                        if chain.isdigit(): tokens[(chain, token['address'])] = {**token, 'chainId': int(chain)}
        if pending_projects: gaps.append('公开清单缺少明确链 ID：' + '、'.join(sorted(pending_projects)))
        gaps.append('OpenClaw 历史入口尚未连通；未认证云账户与未接入 SSH 的服务器不代表零余额。')
        servers = []
        for server in previous_servers.values():
            server['registeredAccounts'] = sum(a['host'] == server['alias'] for a in rows.values())
            servers.append({k: server[k] for k in ['id', 'cloud', 'name', 'alias', 'region', 'state', 'guestRead', 'registeredAccounts']})
        value = {'version': 1, 'generatedAt': utc(), 'addresses': list(rows.values()), 'tokens': list(tokens.values()), 'servers': servers, 'gaps': gaps}
        api('registry', value, 'PUT', 90)
        (CONFIG / 'discovery-last.json').write_text(json.dumps({'generatedAt': value['generatedAt'], 'servers': len(servers), 'accounts': len(rows), 'gaps': gaps}, ensure_ascii=False))
        print(json.dumps({'status': 'PARTIAL' if gaps else 'OK', 'servers': len(servers), 'accounts': len(rows), 'gapCount': len(gaps)}))
if __name__ == '__main__':
    try: main()
    except Exception as exc:
        print(json.dumps({'status': 'FAILED', 'error': type(exc).__name__})); raise SystemExit(1)
