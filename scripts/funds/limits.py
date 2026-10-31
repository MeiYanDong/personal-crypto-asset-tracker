"""Fixed capacity, admission and per-process transport budget; no auto scaling."""
import json, pathlib, threading, time

HERE = pathlib.Path(__file__).resolve().parent
LIMITS = json.loads((HERE / 'funds-limits.json' if (HERE / 'funds-limits.json').exists() else HERE.parent.parent / 'shared/funds-limits.json').read_text())
CORE = {'ETH', 'BNB', 'HYPE', 'OKB', 'WETH', 'USDG', 'USDC', 'USDT', 'MM'}

class LimitExceeded(Exception): pass

def identity(row):
    address = row['address'] or 'native'
    return str(row['chainId']), address.lower() if address.startswith('0x') else address

def weight(account, tokens):
    if int(account['chainId']) == 501: return 256  # Bound unsolicited SPL mint growth too.
    return 1 + sum(str(t['chainId']) == str(account['chainId']) and (account['role'] != 'sender' or t['symbol'] in CORE) for t in tokens)

def validate(registry):
    if (len(registry['addresses']) > LIMITS['accounts'] or len(registry['tokens']) > LIMITS['tokens']
        or len(registry['servers']) > LIMITS['servers']
        or sum(int(a['chainId']) == 501 for a in registry['addresses']) > LIMITS['solanaAccounts']
        or any(int(a['chainId']) not in LIMITS['chains'] for a in registry['addresses'])
        or sum(weight(a, registry['tokens']) for a in registry['addresses']) > LIMITS['balanceItems']):
        raise LimitExceeded('REGISTRY_CAPACITY')

class Admission:
    def __init__(self, registry):
        validate(registry)
        self.rows = {identity(a): a for a in registry['addresses']}
        self.tokens = {identity(t): t for t in registry['tokens']}
        self.items = sum(weight(a, self.tokens.values()) for a in self.rows.values())
        self.pending = {'accounts': 0, 'tokens': 0, 'servers': 0}
        self.samples = []
    def account(self, row):
        key = identity(row)
        if key in self.rows: return True
        cost = weight(row, self.tokens.values())
        sol_full = int(row['chainId']) == 501 and sum(int(a['chainId']) == 501 for a in self.rows.values()) >= LIMITS['solanaAccounts']
        if sol_full or int(row['chainId']) not in LIMITS['chains'] or len(self.rows) >= LIMITS['accounts'] or self.items + cost > LIMITS['balanceItems']:
            self.pending['accounts'] += 1
            if len(self.samples) < 8: self.samples.append(row['host'] + '/' + row['project'])
            return False
        self.rows[key] = row; self.items += cost
        return True
    def token(self, token):
        if identity(token) in self.tokens: return True  # Keep verified metadata.
        cost = sum(int(a['chainId']) != 501 and str(a['chainId']) == str(token['chainId']) and (a['role'] != 'sender' or token['symbol'] in CORE) for a in self.rows.values())
        if int(token['chainId']) not in LIMITS['chains'] or len(self.tokens) >= LIMITS['tokens'] or self.items + cost > LIMITS['balanceItems']:
            self.pending['tokens'] += 1; return False
        self.tokens[identity(token)] = token; self.items += cost
        return True

class TransportBudget:
    def __init__(self):
        self.lock = threading.Lock(); self.started = time.monotonic()
        self.http = 0; self.rpc = 0; self.bytes = 0
    def check(self):
        if time.monotonic() - self.started >= LIMITS['runSeconds']: raise LimitExceeded('RUN_DEADLINE')
    def request(self, rpc=False):
        with self.lock:
            self.check()
            if self.http >= LIMITS['httpRequestsPerRun'] or (rpc and self.rpc >= LIMITS['rpcRequestsPerRun']): raise LimitExceeded('REQUEST_BUDGET')
            self.http += 1; self.rpc += int(rpc)
    def charge(self, size):
        with self.lock:
            self.check()
            if self.bytes + size > LIMITS['transferBytesPerRun']: raise LimitExceeded('TRANSFER_BUDGET')
            self.bytes += size
    def read(self, stream):
        chunks = []; total = 0
        while True:
            # Reserve before reading, including concurrent chains and failed requests.
            self.charge(65536)
            part = stream.read(65536)
            with self.lock: self.bytes -= 65536 - len(part)
            total += len(part)
            if total > LIMITS['responseBytes']: raise LimitExceeded('RESPONSE_SIZE')
            chunks.append(part)
            if not part: return b''.join(chunks)

def reserve_runs(state, now):
    """Persist returned state BEFORE I/O. Interrupted/failed attempts consume a slot."""
    day = time.strftime('%Y-%m-%d', time.gmtime(now))
    counts = state.get('daily', {})
    if counts.get('day') != day: counts = {'day': day, 'fleet': 0, 'personal': 0}
    due = {}
    for kind in ('fleet', 'personal'):
        if not isinstance(counts.get(kind, 0), int) or not 0 <= counts.get(kind, 0) <= LIMITS[kind + 'RunsPerDay']: raise LimitExceeded('INVALID_BUDGET_STATE')
        due[kind] = now - state.get(kind + 'Attempt', state.get(kind, 0)) >= LIMITS[kind + 'IntervalSeconds'] and counts.get(kind, 0) < LIMITS[kind + 'RunsPerDay']
        if due[kind]:
            state[kind + 'Attempt'] = now; counts[kind] = counts.get(kind, 0) + 1
    state['daily'] = counts
    return due
