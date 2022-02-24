#!/usr/bin/env node

/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2020 Metrological
 *
 * Licensed under the Apache License, Version 2.0 (the License);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// load and parse (optional) .env file with
const program = require('commander')
const didYouMean = require('didyoumean2').default
const chalk = require('chalk')

const uploadAction = require('../src/upload')

program
    .version('AppUpload ' + require('../package').version) //We can change this later. Ignore for now
    .usage('metroupload <command> [options]') //We can change this later. Ignore for now

program
    .command('upload')
    .arguments('<path>') //Takes the path from command line as argument
    .description(
        [
            '🚀',
            ' '.repeat(3),
            'Upload the Lightning App to the Metrological Back Office to be published in an App Store',
        ].join('')
    ).arguments('', '')
    .action(path => uploadAction(path)) //Passing the path to upload script


program.on('command:*', () => {
    const suggestion = didYouMean(
        program.args[0] || '',
        program.commands.map(command => command._name)
    )

    console.log("Sorry, that command doesn't seems to exist ...")
    console.log('')
    if (suggestion) {
        console.log('Perhaps you meant: ' + chalk.yellow('lng ' + suggestion) + '?')
        console.log('')
    }
    console.log('Use ' + chalk.yellow('lng -h') + ' to see a full list of available commands')
    process.exit(1)
})

program.parse(process.argv)

if (!process.argv.slice(2).length) {
    program.outputHelp()
}
