"""Capture genuine Chrome DevTools UI against the live individual database."""
import functools
import http.server
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import time
import urllib.request

import mss
import mss.tools
from playwright.sync_api import sync_playwright
import websocket

ROOT = Path.cwd()
DOCS = ROOT / 'docs'
DOCS.mkdir(exist_ok=True)


def wait_for(call, timeout=45):
    deadline = time.monotonic() + timeout
    last = None
    while time.monotonic() < deadline:
        try:
            result = call()
            if result:
                return result
        except Exception as exc:
            last = exc
        time.sleep(.2)
    raise TimeoutError(f'Browser readiness timeout: {last}')


def http_json(url):
    with urllib.request.urlopen(url, timeout=5) as response:
        return json.load(response)


class CDP:
    def __init__(self, address):
        self.connection = websocket.create_connection(address, timeout=35)
        self.next_id = 0
        self.events = []

    def send(self, method, params=None):
        self.next_id += 1
        current = self.next_id
        self.connection.send(json.dumps({'id': current, 'method': method, 'params': params or {}}))
        while True:
            result = json.loads(self.connection.recv())
            if result.get('id') == current:
                if 'error' in result:
                    raise RuntimeError(f'{method}: {result["error"]}')
                return result.get('result', {})
            self.events.append(result)

    def evaluate(self, expression):
        result = self.send('Runtime.evaluate', {'expression': expression, 'awaitPromise': True, 'returnByValue': True})
        if result.get('exceptionDetails'):
            raise RuntimeError(str(result['exceptionDetails']))
        return result.get('result', {}).get('value')


def capture(name):
    # This is a new, unedited screen capture of the actual Chrome display.
    with mss.mss() as screen:
        frame = screen.grab(screen.monitors[0])
        mss.tools.to_png(frame.rgb, frame.size, output=str(DOCS / name))


def window_bounds(browser, target_id, **bounds):
    window_id = browser.send('Browser.getWindowForTarget', {'targetId': target_id})['windowId']
    browser.send('Browser.setWindowBounds', {'windowId': window_id, 'bounds': {'windowState': 'normal'}})
    browser.send('Browser.setWindowBounds', {'windowId': window_id, 'bounds': bounds})


chrome = None
server = None
metadata = {'method': 'Actual headful Chrome and its official DevTools frontend, captured together through Xvfb on a GitHub-hosted Linux runner. No mocked responses or reconstructed screenshots.', 'source_commit': os.environ.get('GITHUB_SHA'), 'screenshots': [], 'restored': False}
try:
    project_url = os.environ['SUPABASE_URL']
    public_key = os.environ['SUPABASE_PUBLISHABLE_KEY']
    if not public_key.startswith('sb_publishable_'):
        raise ValueError('Only a modern browser-safe publishable key is accepted.')
    (ROOT / 'config.js').write_text('export const SUPABASE_URL = ' + json.dumps(project_url) + ';\nexport const SUPABASE_PUBLISHABLE_KEY = ' + json.dumps(public_key) + ';\n')
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 3000), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    profile = tempfile.mkdtemp(prefix='individual-evidence-')
    executable = shutil.which('google-chrome') or shutil.which('chromium')
    if not executable:
        raise RuntimeError('A genuine Chrome browser is required.')
    chrome = subprocess.Popen([executable, '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check', '--remote-allow-origins=*', '--remote-debugging-port=9222', '--window-size=960,1400', '--window-position=0,0', '--user-data-dir=' + profile, 'about:blank'], stdout=subprocess.DEVNULL, stderr=open(ROOT / 'chrome-evidence.log', 'w'))
    version = wait_for(lambda: http_json('http://127.0.0.1:9222/json/version'))
    metadata['chrome'] = version['Browser']
    browser = CDP(version['webSocketDebuggerUrl'])
    targets = http_json('http://127.0.0.1:9222/json/list')
    app = next(target for target in targets if target['type'] == 'page')
    app_id = app['id']
    app_cdp = CDP(app['webSocketDebuggerUrl'])
    app_cdp.send('Network.enable')
    inspector_url = app['devtoolsFrontendUrl']
    if inspector_url.startswith('/'):
        inspector_url = 'http://127.0.0.1:9222' + inspector_url
    frontend_id = browser.send('Target.createTarget', {'url': inspector_url, 'newWindow': True})['targetId']
    frontend = wait_for(lambda: next((target for target in http_json('http://127.0.0.1:9222/json/list') if target['id'] == frontend_id and target.get('webSocketDebuggerUrl')), None))
    dev = CDP(frontend['webSocketDebuggerUrl'])
    print('Opened genuine Chrome DevTools frontend', flush=True)
    dev.evaluate("(async()=>{window.evidenceUI=await import('./ui/legacy/legacy.js');await window.evidenceUI.InspectorView.InspectorView.instance().showPanel('network');return true;})()")

    with sync_playwright() as playwright:
        controlled = playwright.chromium.connect_over_cdp('http://127.0.0.1:9222')
        context = controlled.contexts[0]
        page = next(page for page in context.pages if page.url == 'about:blank')
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://localhost:3000/?screen=browse', wait_until='domcontentloaded')
        page.locator('.workshop-card').first.wait_for(timeout=90000)
        assert page.locator('.workshop-card').count() == 8
        page.locator('#search').fill('Laro')
        with page.expect_response(lambda response: '/rest/v1/products?' in response.url and 'name=ilike' in response.url, timeout=45000) as received:
            page.get_by_role('button', name='Search', exact=True).click()
        response = received.value
        rows = response.json()
        assert response.status == 200 and len(rows) == 2
        page.locator('.workshop-card').first.wait_for()
        assert page.locator('.workshop-card').count() == 2
        metadata['filtered_request'] = {'url': response.url, 'status': response.status, 'rows': rows}
        window_bounds(browser, frontend_id, left=0, top=0, width=1920, height=1400)
        browser.send('Target.activateTarget', {'targetId': frontend_id})
        selected = dev.evaluate("""(async()=>{
          const logs=await import('./models/logs/logs.js');
          const panel=await window.evidenceUI.InspectorView.InspectorView.instance().showPanel('network');
          const request=logs.NetworkLog.NetworkLog.instance().requests().find(r=>r.url().includes('/rest/v1/products?')&&r.url().includes('name=ilike')&&r.statusCode===200);
          if(!request)throw new Error('The real filtered request is missing from DevTools');
          const details=await panel.selectAndActivateRequest(request,'response');
          if(!details)throw new Error('DevTools did not open its real Response view');
          return {url:request.url(),status:request.statusCode};
        })()""")
        metadata['devtools_selected_request'] = selected
        time.sleep(2)
        # Hover the native URL tooltip so the complete query remains readable.
        tooltip = dev.evaluate("""(()=>{const found=[];function visit(root){for(const e of root.querySelectorAll('*')){if((e.getAttribute('title')||'').includes('name=ilike')){const r=e.getBoundingClientRect();if(r.width&&r.height)found.push({x:r.x+r.width/2,y:r.y+r.height/2});}if(e.shadowRoot)visit(e.shadowRoot);}}visit(document);return found[0]||null;})()""")
        if tooltip:
            extra = dev.evaluate('({x:window.screenX,y:window.screenY,toolbar:window.outerHeight-window.innerHeight})')
            subprocess.run(['xdotool', 'mousemove', str(round(extra['x'] + tooltip['x'])), str(round(extra['y'] + extra['toolbar'] + tooltip['y']))], check=True)
            time.sleep(1.2)
        capture('network-list.png')
        metadata['screenshots'].append('network-list.png')
        print('Captured the actual filtered request and Response pane', flush=True)

        app_cdp.send('Network.setBlockedURLs', {'urls': ['*rest/v1/products*']})
        page.get_by_role('button', name='Search', exact=True).click()
        page.locator('.error-panel').wait_for(timeout=15000)
        assert page.get_by_role('button', name='Retry', exact=True).is_visible()
        dev.evaluate("window.evidenceUI.InspectorView.InspectorView.instance().showPanel('console').then(()=>true)")
        window_bounds(browser, app_id, left=0, top=0, width=960, height=1400)
        window_bounds(browser, frontend_id, left=960, top=0, width=960, height=1400)
        browser.send('Target.activateTarget', {'targetId': app_id})
        browser.send('Target.activateTarget', {'targetId': frontend_id})
        time.sleep(1.5)
        metadata['rendered_error'] = page.locator('.error-panel').inner_text()
        capture('console-error.png')
        metadata['screenshots'].append('console-error.png')
        print('Captured the rendered error and actual Console together', flush=True)
        app_cdp.send('Network.setBlockedURLs', {'urls': []})
        with page.expect_response(lambda response: '/rest/v1/products?' in response.url and response.status == 200, timeout=45000):
            page.get_by_role('button', name='Retry', exact=True).click()
        page.locator('.workshop-card').first.wait_for()
        assert page.locator('.workshop-card').count() == 2
        assert not page.locator('.error-panel').count()
        assert not errors, errors
        metadata['restored'] = True
        metadata['uncaught_app_exceptions'] = errors
        (DOCS / 'capture-devtools.json').write_text(json.dumps(metadata, indent=2) + '\n')
        print('Genuine capture and post-failure Retry checks passed', flush=True)
except Exception as exc:
    metadata['error'] = repr(exc)
    (DOCS / 'capture-debug.json').write_text(json.dumps(metadata, indent=2) + '\n')
    try:
        capture('capture-debug.png')
    except Exception:
        pass
    raise
finally:
    if server:
        server.shutdown()
    if chrome:
        chrome.terminate()
