import concurrent.futures, gzip, io, json, os, pathlib, tempfile, unittest
from unittest.mock import patch
import observer
import discover
from limits import LIMITS, Admission, LimitExceeded, TransportBudget, reserve_runs, validate

def account(n, chain=1):
    return {'chainId': chain, 'address': '0x' + format(n, '040x'), 'project': 'test', 'host': 'test', 'role': 'owner'}
def registry(count=0, tokens=0):
    return {'addresses': [account(i) for i in range(count)], 'tokens': [{'chainId': 1, 'address': '0x' + format(i + 1000000, '040x'), 'symbol': 'T', 'decimals': 18} for i in range(tokens)], 'servers': []}

class LimitsTest(unittest.TestCase):
    def test_wallet_burst_and_token_fanout(self):
        initial = registry(6000, 4); admission = Admission(initial)
        for i in range(6000, 106000): admission.account(account(i))
        self.assertEqual(len(admission.rows), 8000)
        self.assertEqual(admission.items, 40000)
        self.assertEqual(admission.pending['accounts'], 98000)
        self.assertEqual(list(admission.rows.values())[:6000], initial['addresses'])
        self.assertFalse(admission.token({'chainId': 1, 'address': '0x' + 'a' * 40, 'symbol': 'NEW', 'decimals': 18}))
        self.assertEqual(len(admission.tokens), 4)
    def test_unknown_chain_and_solana(self):
        admission = Admission(registry())
        self.assertFalse(admission.account(account(1, 12345)))
        for i in range(20): admission.account(account(i, 501))
        self.assertEqual(len(admission.rows), 8)
        self.assertEqual(admission.items, 2048)
        with self.assertRaises(LimitExceeded): validate(registry(8001))
    def test_daily_reservation_and_restart(self):
        state = {}; now = 1800000000
        self.assertTrue(reserve_runs(state, now)['fleet'])
        # Reservation survives serialization and an interrupted run.
        state = json.loads(json.dumps(state))
        self.assertFalse(reserve_runs(state, now + 899)['fleet'])
        self.assertTrue(reserve_runs(state, now + 900)['fleet'])
        state['daily']['fleet'] = LIMITS['fleetRunsPerDay']
        self.assertFalse(reserve_runs(state, now + 1800)['fleet'])
        self.assertTrue(reserve_runs(state, now + 86400)['fleet'])
    def test_parallel_requests_and_bytes(self):
        b = TransportBudget()
        def request(_):
            try: b.request(True); return True
            except LimitExceeded: return False
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            self.assertEqual(sum(pool.map(request, range(1000))), 400)
        self.assertEqual(b.rpc, 400)
        b.charge(LIMITS['transferBytesPerRun'])
        with self.assertRaises(LimitExceeded): b.charge(1)
        with self.assertRaises(LimitExceeded): b.read(io.BytesIO(b'x'))
    def test_compressed_bomb(self):
        class Response(io.BytesIO):
            def getheader(self, name): return 'gzip'
        body = gzip.compress(b'0' * (LIMITS['responseBytes'] + 1))
        with patch.object(observer, 'BUDGET', TransportBudget()), patch('urllib.request.urlopen', return_value=Response(body)):
            with self.assertRaises(LimitExceeded): observer.http('https://example.invalid')
    def test_failed_start_has_backoff_without_network_poll(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {'FUNDS_STATE_DIR': directory}):
            with patch.object(observer, 'api', side_effect=RuntimeError('offline')) as api:
                with self.assertRaises(RuntimeError): observer.main()
                self.assertEqual(api.call_count, 1)
                state = json.loads(pathlib.Path(directory, 'schedule.json').read_text())
                self.assertEqual(state['daily']['fleet'], 1)
                observer.main()
                self.assertEqual(api.call_count, 1)
    def test_truncated_source_is_visible_without_removing_accounts(self):
        initial = registry(1)
        initial['servers'] = [{'id': 'one', 'alias': 'test', 'name': 'test', 'cloud': 'test', 'region': 'test', 'state': 'running', 'guestRead': True}]
        saved = []
        def api(path, value=None, *args):
            if value is None: return initial
            saved.append(value)
        with tempfile.TemporaryDirectory() as directory:
            pathlib.Path(directory, 'discovery.json').write_text('{"hosts":{}}')
            with patch.object(discover, 'CONFIG', pathlib.Path(directory)), patch.object(discover, 'api', side_effect=api), \
                 patch.object(discover, 'aws_inventory', return_value=([], [])), patch.object(discover, 'aliyun_inventory', return_value=([], [])), \
                 patch.object(discover, 'scan_server', return_value=({'errors': ['FILE_LIMIT'], 'files': [], 'observedAt': ''}, None)), patch('sys.stdout', io.StringIO()):
                discover.main()
        self.assertEqual(saved[0]['pending']['sources'], 1)
        self.assertEqual(saved[0]['addresses'], initial['addresses'])
        self.assertTrue(any('UNKNOWN' in gap for gap in saved[0]['gaps']))
    def test_successful_fallback_is_reused(self):
        seen = []
        primary, backup = observer.URLS[4663]
        def rpc(url, method, params):
            seen.append((url, method))
            if method == 'eth_chainId': return hex(4663)
            if method == 'eth_getBlockByNumber': return {'number': '0x1', 'hash': '0x01', 'timestamp': '0x1'}
            if method == 'eth_getCode': return '0x01'
            if method == 'eth_getBalance': return '0x0'
            if url == primary: raise ValueError('RPC_ERROR_429')
            return '0x'
        with patch.object(observer, 'rpc', side_effect=rpc), patch.object(observer, 'decode', side_effect=lambda result, count: ['0'] * count), patch('time.sleep'):
            result = observer.collect(4663, [account(i, 4663) for i in range(320)], [])
        self.assertEqual(len(result['rows']), 320)
        self.assertEqual(seen.count((primary, 'eth_call')), 1)
        self.assertEqual(seen.count((backup, 'eth_call')), 2)
    def test_failed_batches_open_circuit_and_direct_retries_are_single(self):
        seen = []
        def rpc(url, method, params):
            seen.append(method)
            if method == 'eth_chainId': return hex(4663)
            if method == 'eth_getBlockByNumber': return {'number': '0x1', 'hash': '0x01', 'timestamp': '0x1'}
            if method == 'eth_getCode': return '0x01'
            raise ValueError('RPC_ERROR_429')
        with patch.object(observer, 'rpc', side_effect=rpc), patch('time.sleep'):
            with self.assertRaisesRegex(ValueError, 'BATCH_CIRCUIT_OPEN'):
                observer.collect(4663, [account(i, 4663) for i in range(1600)], [])
        self.assertEqual(seen.count('eth_getBalance'), 32)
        self.assertEqual(seen.count('eth_call'), 12)

if __name__ == '__main__': unittest.main()
