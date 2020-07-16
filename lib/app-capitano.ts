/*
Copyright 2016-2020 Balena

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import * as capitano from 'capitano';
import * as actions from './actions';
import * as events from './events';
import { promisify } from 'util';

capitano.permission('user', (done) =>
	require('./utils/patterns').checkLoggedIn().then(done, done),
);

capitano.command({
	signature: '*',
	action(_params, _options, done) {
		capitano.execute({ command: 'help' }, done);
		process.exitCode = process.exitCode || 1;
	},
});

capitano.globalOption({
	signature: 'help',
	boolean: true,
	alias: 'h',
});

capitano.globalOption({
	signature: 'version',
	boolean: true,
	alias: 'v',
});

// ---------- Help Module ----------
capitano.command(actions.help.help);

// ---------- OS Module ----------
capitano.command(actions.os.initialize);

// ---------- Config Module ----------
capitano.command(actions.config.read);
capitano.command(actions.config.write);
capitano.command(actions.config.inject);
capitano.command(actions.config.reconfigure);
capitano.command(actions.config.generate);

// ---------- Preload Module ----------
capitano.command(actions.preload);

// ------------ Local build and deploy -------
capitano.command(actions.build);
capitano.command(actions.deploy);

// ------------ Push/remote builds -------
capitano.command(actions.push.push);

export function run(argv: string[]) {
	const cli = capitano.parse(argv.slice(2));
	const runCommand = function () {
		const capitanoExecuteAsync = promisify(capitano.execute);
		if (cli.global?.help) {
			return capitanoExecuteAsync({
				command: `help ${cli.command ?? ''}`,
			});
		} else {
			return capitanoExecuteAsync(cli);
		}
	};

	const trackCommand = function () {
		const getMatchCommandAsync = promisify(capitano.state.getMatchCommand);
		return getMatchCommandAsync(cli.command).then(function (command) {
			// cmdSignature is literally a string like, for example:
			//     "push <applicationOrDevice>"
			// ("applicationOrDevice" is NOT replaced with its actual value)
			// In case of failures like an nonexistent or invalid command,
			// command.signature.toString() returns '*'
			const cmdSignature = command.signature.toString();
			return events.trackCommand(cmdSignature);
		});
	};

	return Promise.all([trackCommand(), runCommand()]).catch(
		require('./errors').handleError,
	);
}
