"""launchd entry point; dedicated observer credential only, never cloud/wallet secrets."""
import os, pathlib, runpy
os.umask(0o077)
config = pathlib.Path.home() / '.config/personal-asset-tracker/worker.env'
for name in ['discovery.log', 'discovery-error.log']:
    log = config.parent / name
    if log.exists() and log.stat().st_size > 1024 * 1024: log.replace(log.with_suffix(log.suffix + '.1'))
for line in config.read_text().splitlines():
    key, separator, value = line.partition('=')
    if separator and key in ['FUNDS_SITE', 'FUNDS_WORKER_TOKEN']: os.environ[key] = value
runpy.run_path(str(pathlib.Path(__file__).with_name('discover.py')), run_name='__main__')
