import concurrent.futures, gzip, io, json, os, pathlib, tempfile, unittest
from unittest.mock import patch
import observer
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

if __name__ == '__main__': unittest.main()
