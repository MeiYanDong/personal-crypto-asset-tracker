"""Convert an audited public-address census to private funds storage files."""
import json, os, pathlib, sys
os.umask(0o077)
source = pathlib.Path(sys.argv[1]); target = pathlib.Path(sys.argv[2]); target.mkdir(parents=True, exist_ok=True)
def read(name): return json.loads((source / name).read_text())
def write(name, value): (target / ('funds-' + name + '.json')).write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')))
original = read('final-registry.json'); inventory = read('server-inventory.json'); sol = read('solana-final.json')
tokens = original['tokens']
for token in tokens:
    if token['symbol'] == 'MM': token['valuation'] = 'reference'
accounts = [{**{k: r[k] for k in ['chainId', 'address', 'project', 'host', 'role', 'kind']}, 'source': '2026-11-01 公开地址核对', 'lastSeenAt': original['generatedAt']} for r in original['addresses']]
accounts.append({'chainId': 501, 'address': sol['address'], 'project': sol['project'], 'host': 'hongkong', 'role': 'owner', 'kind': 'wallet', 'source': '已核对的公开地址'})
registry = {'version': 1, 'generatedAt': original['generatedAt'], 'addresses': accounts, 'tokens': tokens, 'servers': inventory['instances'], 'gaps': ['首次导入为 2026-11-01 地址核对结果，等待自动发现更新。', 'Manga 主机和 OpenClaw 入口未连通；部分停机服务器使用既有公开地址清单。', '阿里云 intl 账户尚未认证，账户范围仍为 PARTIAL。']}
write('registry', registry)
for file in source.glob('balances-*-final.json'):
    data = json.loads(file.read_text())
    data['rows'] = [{'address': r['address'], 'balances': r['balances']} for r in data['rows']]
    data['errors'] = [str(e.get('error', 'UNKNOWN')) if isinstance(e, dict) else str(e) for e in data['errors']]
    for asset in data['assets']:
        if asset['symbol'] == 'MM': asset['valuation'] = 'reference'
    write('chain-' + str(data['chainId']), {k: data[k] for k in ['chainId', 'startedAt', 'finishedAt', 'assets', 'rows', 'errors', 'blockNumber', 'blockHash', 'blockTimestamp', 'finality']})
balances = {'native': str(sol['results']['native']['value'])}; assets = [{'chainId': 501, 'address': None, 'symbol': 'SOL', 'decimals': 9}]
for key in ['spl', 'token2022']:
    for row in sol['results'][key]['value']:
        info = row['account']['data']['parsed']['info']; token = info['mint']; amount = info['tokenAmount']
        balances[token] = str(int(balances.get(token, '0')) + int(amount['amount']))
        assets.append({'chainId': 501, 'address': token, 'symbol': 'USDC' if token == 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' else token[:8], 'decimals': amount['decimals']})
write('chain-501', {'chainId': 501, 'startedAt': sol['observedAt'], 'finishedAt': sol['observedAt'], 'finality': 'FINALIZED', 'assets': assets, 'rows': [{'address': sol['address'], 'balances': balances}], 'errors': []})
print(json.dumps({'accounts': len(accounts), 'servers': len(registry['servers']), 'tokens': len(tokens)}))
