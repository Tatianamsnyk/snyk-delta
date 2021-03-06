import * as nock from 'nock';
import * as path from 'path';
import * as fs from 'fs';
//process.argv.push('-d');
import * as debug from 'debug';

import { getDelta } from '../../src/lib/index';
import { ModuleOptions } from '../../src/lib/utils/utils';
const fixturesFolderPath = path.resolve(__dirname, '..') + '/fixtures/';

const originalLog = console.log;
let consoleOutput: Array<string> = [];
const mockedLog = (output: string): void => {
  consoleOutput.push(output);
};
beforeAll(() => {
  console.log = mockedLog;
});

beforeEach(() => {
  consoleOutput = [];
});
afterAll(() => {
  setTimeout(() => {
    console.log = originalLog;
  }, 500);
});

beforeEach(() => {
  return nock('https://snyk.io')
    .persist()
    .post(/.*/)
    .reply(200, (uri) => {
      switch (uri) {
        case '/api/v1/org/playground/project/ab9e037f-9020-4f77-9c48-b1cb0295a4b6/issues':
          return fs.readFileSync(
            fixturesFolderPath + 'apiResponses/test-goof.json',
          );
        case '/api/v1/org/playground/project/c51c80c2-66a1-442a-91e2-4f55b4256a72/issues':
          return fs.readFileSync(
            fixturesFolderPath + 'apiResponses/test-goof.json',
          );
        case '/api/v1/org/playground/projects':
          return fs.readFileSync(
            fixturesFolderPath +
              'apiResponsesForProjects/list-all-projects-org-playground.json',
          );
        default:
      }
    })
    .get(/.*/)
    .reply(200, (uri) => {
      switch (uri) {
        case '/api/v1/org/playground/project/ab9e037f-9020-4f77-9c48-b1cb0295a4b6/issues':
          return fs.readFileSync(
            fixturesFolderPath + 'apiResponses/test-goof.json',
          );
        default:
      }
    });
});

describe('Test End 2 End - Module', () => {
  it('Test module mode - no new issue', async () => {
    const result = await getDelta(
      fs
        .readFileSync(fixturesFolderPath + 'snykTestsOutputs/test-goof.json')
        .toString(),
    );
    expect(consoleOutput).toContain('No new issues found !');
    expect(result).toEqual(0);
  });

  it('Test module debug mode - no new issue', async () => {
    const result = await getDelta(
      fs
        .readFileSync(fixturesFolderPath + 'snykTestsOutputs/test-goof.json')
        .toString(),
      true,
    );
    expect(debug('snyk')).toBeTruthy();
    expect(consoleOutput).toContain('No new issues found !');
    expect(result).toEqual(0);
  });

  it('Test module mode - 1 new issue', async () => {
    const result = await getDelta(
      fs
        .readFileSync(
          fixturesFolderPath +
            'snykTestsOutputs/test-goof-with-one-more-vuln.json',
        )
        .toString(),
    );

    const expectedOutput = [
      'New issue introduced !',
      'Security Vulnerability:',
      '  1/1: Regular Expression Denial of Service (ReDoS) [High Severity]',
      '    Via: express-fileupload@0.0.5 => @snyk/nodejs-runtime-agent@1.14.0 => acorn@5.7.3',
      '    Fixed in: acorn 5.7.4, 6.4.1, 7.1.1',
      '    Fixable by upgrade:  @snyk/nodejs-runtime-agent@1.14.0=>acorn@5.7.4',
    ];

    expectedOutput.forEach((line: string) => {
      expect(consoleOutput.join()).toContain(line);
    });
    expect(result).toEqual(1);
  });
});
