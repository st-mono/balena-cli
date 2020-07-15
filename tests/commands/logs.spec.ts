/**
 * @license
 * Copyright 2020 Balena Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { expect } from 'chai';

import { BalenaAPIMock } from '../balena-api-mock';
import { cleanOutput, runCommand } from '../helpers';
import { SupervisorMock } from '../supervisor-mock';

describe('balena logs', function () {
	let api: BalenaAPIMock;
	let supervisor: SupervisorMock;

	this.beforeEach(() => {
		api = new BalenaAPIMock();
		supervisor = new SupervisorMock();
		api.expectGetWhoAmI();
		api.expectGetMixpanel({ optional: true });
	});

	this.afterEach(() => {
		// Check all expected api calls have been made and clean up.
		api.done();
		supervisor.done();
	});

	it('should reach the expected endpoints on a local device', async () => {
		supervisor.expectGetPing();
		supervisor.expectGetLogs();

		const { err, out } = await runCommand('logs 1.2.3.4');

		expect(err).to.be.empty;

		const removeTimestamps = (logLine: string) =>
			logLine.replace(/(?<=\[Logs\]) \[.+?\]/, '');
		const cleanedOut = cleanOutput(out, true).map((l) => removeTimestamps(l));

		expect(cleanedOut).to.deep.equal([
			'[Logs] Streaming logs',
			'[Logs] [bar] bar 8 (332) Linux 4e3f81149d71 4.19.75 #1 SMP PREEMPT Mon Mar 23 11:50:49 UTC 2020 aarch64 GNU/Linux',
			'[Logs] [foo] foo 8 (200) Linux cc5df60d89ee 4.19.75 #1 SMP PREEMPT Mon Mar 23 11:50:49 UTC 2020 aarch64 GNU/Linux',
			'[Error] Connection to device lost',
		]);
	});
});
