#!/usr/bin/env python3
"""Read-only, bounded RPC collector. Public addresses only; no signing library."""
import concurrent.futures, datetime, fcntl, gzip, json, os, pathlib, time, urllib.request

MC = '0xca11bde05977b3631167028862be2a173976ca11'
URLS = {
    1: ['https://ethereum-rpc.publicnode.com'], 10: ['https://optimism-rpc.publicnode.com', 'https://mainnet.optimism.io'],
    56: ['https://bsc-rpc.publicnode.com'], 196: ['https://rpc.xlayer.tech', 'https://xlayerrpc.okx.com'],
    999: ['https://rpc.hyperliquid.xyz/evm'], 4663: ['https://robinhood-rpc.publicnode.com', 'https://rpc.mainnet.chain.robinhood.com'],
    8453: ['https://base-rpc.publicnode.com', 'https://mainnet.base.org']}
READ_METHODS = {'eth_chainId', 'eth_getBlockByNumber', 'eth_getCode', 'eth_call', 'eth_getBalance', 'getBalance', 'getTokenAccountsByOwner'}
CORE = {'ETH', 'BNB', 'HYPE', 'OKB', 'WETH', 'USDG', 'USDC', 'USDT', 'MM'}
def utc(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def http(url, value=None, headers=None, method=None, timeout=25):
    request = urllib.request.Request(url, None if value is None else json.dumps(value, separators=(',', ':')).encode(), {'Content-Type': 'application/json', 'Accept-Encoding': 'gzip', 'User-Agent': 'asset-funds-observer/1', **(headers or {})}, method=method)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read(16 * 1024 * 1024)
        return json.loads(gzip.decompress(body) if response.getheader('Content-Encoding') == 'gzip' else body)
def rpc(url, method, params):
    if method not in READ_METHODS: raise ValueError('READ_METHOD_REQUIRED')
    result = http(url, {'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params})
    if 'error' in result: raise ValueError('RPC_ERROR_' + str(result['error'].get('code')))
    return result['result']
def api(path, value=None, method=None, timeout=35):
    return http(os.environ['FUNDS_SITE'].rstrip('/') + '/api/funds/' + path, value,
                {'x-asset-tracker-token': os.environ['FUNDS_WORKER_TOKEN']}, method, timeout)
def word(n): return int(n).to_bytes(32, 'big')
def encode(calls):
    chunks = []
    for target, data in calls:
        raw = bytes.fromhex(data.removeprefix('0x'))
        chunks.append(bytes.fromhex(target[2:]).rjust(32, b'\0') + word(1) + word(96) + word(len(raw)) + raw + b'\0' * (-len(raw) % 32))
    offset = 32 * len(chunks); offsets = []
    for chunk in chunks: offsets.append(word(offset)); offset += len(chunk)
    return '0x82ad56cb' + (word(32) + word(len(chunks)) + b''.join(offsets) + b''.join(chunks)).hex()
def decode(result, count):
    raw = bytes.fromhex(result.removeprefix('0x'))
    def at(n):
        if n < 0 or n + 32 > len(raw): raise ValueError('TRUNCATED_MULTICALL')
        return int.from_bytes(raw[n:n + 32], 'big')
    base = at(0)
    if at(base) != count: raise ValueError('MULTICALL_COUNT')
    head = base + 32; values = []
    for i in range(count):
        p = head + at(head + 32 * i); ok = at(p); q = p + at(p + 32); size = at(q)
        if ok not in [0, 1]: raise ValueError('MULTICALL_FLAG')
        values.append(str(at(q + 32)) if ok and size == 32 else None)
    return values
def collect(chain, accounts, tokens):
    started = utc(); verified = []
    for url in URLS[chain]:
        try:
            if int(rpc(url, 'eth_chainId', []), 16) == chain: verified.append(url)
        except Exception: pass
    if not verified: raise ValueError('NO_VERIFIED_RPC')
    def call(method, params):
        for retry in range(2):
            for url in verified:
                try: return rpc(url, method, params)
                except Exception: pass
            time.sleep(.5)
        raise ValueError('RPC_UNAVAILABLE')
    block = call('eth_getBlockByNumber', ['latest', False]); tag = block['number']
    if call('eth_getCode', [MC, tag]) == '0x': raise ValueError('NO_MULTICALL')
    assets = [{'chainId': chain, 'address': None, 'symbol': {56: 'BNB', 196: 'OKB', 999: 'HYPE'}.get(chain, 'ETH'), 'decimals': 18}] + tokens
    rows = []; work = []; errors = []
    for asset in assets[1:]:
        try:
            actual = int(call('eth_call', [{'to': asset['address'], 'data': '0x313ce567'}, tag]), 16)
            if actual != asset['decimals']: raise ValueError('DECIMALS_MISMATCH')
        except Exception: asset['_invalid'] = True; errors.append('TOKEN_DECIMALS_UNVERIFIED:' + asset['address'])
    for index, account in enumerate(accounts):
        row = {'address': account['address'], 'balances': {}}; rows.append(row)
        for asset in assets:
            if account['role'] == 'sender' and asset['symbol'] not in CORE: continue
            key = asset['address'] or 'native'; row['balances'][key] = None
            if asset.get('_invalid'): continue
            data = ('0x70a08231' if asset['address'] else '0x4d2301cc') + account['address'][2:].zfill(64)
            work.append((index, key, asset['address'] or MC, data))
    retry_budget = 32
    for offset in range(0, len(work), 160):
        batch = work[offset:offset + 160]
        try: values = decode(call('eth_call', [{'to': MC, 'data': encode([(w[2], w[3]) for w in batch])}, tag]), len(batch))
        except Exception: values = [None] * len(batch); errors.append('BATCH_FAILED:' + str(offset))
        # A single failed element is retried without repeating successful batches.
        for item, value in zip(batch, values):
            if value is None and retry_budget > 0:
                retry_budget -= 1
                try: value = str(int(call('eth_getBalance', [rows[item[0]]['address'], tag]), 16)) if item[1] == 'native' else str(int(call('eth_call', [{'to': item[2], 'data': item[3]}, tag]), 16))
                except Exception: pass
            rows[item[0]]['balances'][item[1]] = value
        time.sleep(.2)
    if call('eth_getBlockByNumber', [tag, False])['hash'] != block['hash']: raise ValueError('BLOCK_CHANGED')
    if rows and rows[0]['balances'].get('native') is not None:
        if str(int(call('eth_getBalance', [rows[0]['address'], tag]), 16)) != rows[0]['balances']['native']: raise ValueError('DECODE_CHECK_FAILED')
    return {'chainId': chain, 'startedAt': started, 'finishedAt': utc(), 'blockNumber': tag, 'blockHash': block['hash'], 'blockTimestamp': block['timestamp'], 'finality': 'PINNED_BLOCK_HASH_RECHECKED', 'assets': assets, 'rows': rows, 'errors': errors}
def collect_solana(accounts):
    started = utc(); rows = []; assets = {'native': {'chainId': 501, 'address': None, 'symbol': 'SOL', 'decimals': 9}}; errors = []
    def call(method, params):
        for url in ['https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com']:
            try: return rpc(url, method, params)
            except Exception: pass
        raise ValueError('SOL_RPC_UNAVAILABLE')
    for account in accounts:
        address = account['address']; balances = {'native': None}
        try: balances['native'] = str(call('getBalance', [address, {'commitment': 'finalized'}])['value'])
        except Exception: errors.append('SOL_BALANCE_UNAVAILABLE')
        for program in ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb']:
            try:
                result = call('getTokenAccountsByOwner', [address, {'programId': program}, {'encoding': 'jsonParsed', 'commitment': 'finalized'}])
                for item in result['value']:
                    info = item['account']['data']['parsed']['info']; token = info['mint']; amount = info['tokenAmount']
                    assets[token] = {'chainId': 501, 'address': token, 'symbol': 'USDC' if token == 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' else token[:8], 'decimals': amount['decimals']}
                    balances[token] = str(int(balances.get(token, '0')) + int(amount['amount']))
            except Exception: errors.append('SPL_BALANCES_UNAVAILABLE')
        rows.append({'address': address, 'balances': balances})
    return {'chainId': 501, 'startedAt': started, 'finishedAt': utc(), 'finality': 'FINALIZED', 'assets': list(assets.values()), 'rows': rows, 'errors': errors}
def main():
    directory = pathlib.Path(os.environ.get('FUNDS_STATE_DIR', '/var/lib/asset-funds-observer')); directory.mkdir(parents=True, exist_ok=True)
    with (directory / 'lock').open('w') as lock:
        try: fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError: return
        state_file = directory / 'schedule.json'
        state = json.loads(state_file.read_text()) if state_file.exists() else {}
        job = api('job'); request = (job.get('request') or {}).get('requestedAt', '')
        now = time.time(); force = request > state.get('request', '')
        if now - state.get('fleet', 0) < 900 and not force and now - state.get('personal', 0) < 3600: return
        errors = []; api('worker', {'attemptedAt': utc(), 'error': ''}, 'PUT')
        if now - state.get('fleet', 0) >= 900 or force:
            registry = api('registry')
            if not registry: raise ValueError('NO_REGISTRY')
            chains = sorted({int(a['chainId']) for a in registry['addresses']})
            def run(chain):
                accounts = [a for a in registry['addresses'] if int(a['chainId']) == chain]
                if chain == 501: result = collect_solana(accounts)
                elif chain in URLS: result = collect(chain, accounts, [dict(t) for t in registry['tokens'] if int(t['chainId']) == chain])
                else: raise ValueError('CHAIN_ADAPTER_REQUIRED')
                api('chain', result, 'PUT', 90)
                nulls = sum(v is None for r in result['rows'] for v in r['balances'].values())
                if nulls or result['errors']: return 'Solana 部分代币账户查询失败，保留上次结果' if chain == 501 else f'链 {chain}：部分余额或代币精度尚未核实'
                return None
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
                futures = {pool.submit(run, c): c for c in chains}
                for future in concurrent.futures.as_completed(futures):
                    try:
                        issue = future.result()
                        if issue: errors.append(issue)
                    except Exception as exc: errors.append(f'{futures[future]}:{type(exc).__name__}')
            state['fleet'] = time.time(); state['request'] = request
        if now - state.get('personal', 0) >= 3600 or force:
            api('worker', {'personalAttemptedAt': utc()}, 'PUT')
            try:
                api('personal-refresh', {}, 'POST', 330)
                api('worker', {'personalCompletedAt': utc()}, 'PUT'); state['personal'] = time.time()
            except Exception as exc:
                errors.append('PERSONAL:' + type(exc).__name__)
                state['personal'] = time.time() - 2700  # Retry in 15 min, not every poll.
        api('worker', {'completedAt': utc(), 'error': '; '.join(errors)}, 'PUT')
        temp = state_file.with_suffix('.tmp'); temp.write_text(json.dumps(state)); temp.replace(state_file)
        print(json.dumps({'completedAt': utc(), 'status': 'PARTIAL' if errors else 'OK', 'errors': errors}), flush=True)
if __name__ == '__main__':
    try: main()
    except Exception as exc:
        # Exception text can contain request headers/URLs. Never print it.
        print(json.dumps({'status': 'FAILED', 'error': type(exc).__name__}), flush=True)
        raise SystemExit(1)
