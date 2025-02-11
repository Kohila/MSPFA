// This script is executed once initially on the client.

import * as MSPFA from 'lib/client/MSPFA';
import Dialog from 'lib/client/Dialog';

(global as any).MSPFA = MSPFA;

window.addEventListener('error', event => {
	if (/bot/i.test(navigator.userAgent)) {
		return;
	}

	if (event.filename.startsWith(`${location.origin}/`)) {
		new Dialog({
			title: 'Uncaught Error',
			content: (
				<>
					<div className="red">
						{event.message}
					</div>
					<br />
					<div className="translucent">
						{event.error.stack || (
							`${event.error.message}\n    at ${event.filename}:${event.lineno}${event.colno ? `:${event.colno}` : ''}`
						)}
					</div>
				</>
			)
		});
	}
});