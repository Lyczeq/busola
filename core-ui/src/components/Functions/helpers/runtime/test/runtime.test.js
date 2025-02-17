import {
  prettyRuntime,
  runtimeToMonacoEditorLang,
  getDefaultDependencies,
  isJson,
} from '../runtime';

describe('prettyRuntime', () => {
  test.each([
    ['python39', 'Python 3.9'],
    ['nodejs14', 'Node.js 14'],
    ['nodejs12', 'Node.js 12 - Deprecated'],
    [undefined, 'Unknown: undefined'],
    [null, 'Unknown: null'],
    ['custom-one', 'Unknown: custom-one'],
  ])('.prettyRuntime(%s, %s)', (runtime, expected) => {
    const result = prettyRuntime(runtime);
    expect(result).toBe(expected);
  });
});

describe('runtimeToMonacoEditorLang', () => {
  test.each([
    ['python39', { language: 'python', dependencies: 'plaintext' }],
    ['nodejs14', { language: 'javascript', dependencies: 'json' }],
    ['nodejs12', { language: 'javascript', dependencies: 'json' }],
    ['', { language: 'plaintext', dependencies: 'plaintext' }],
    [undefined, { language: 'plaintext', dependencies: 'plaintext' }],
    [null, { language: 'plaintext', dependencies: 'plaintext' }],
  ])('.runtimeToMonacoEditorLang(%s, %p)', (runtime, expected) => {
    const result = runtimeToMonacoEditorLang(runtime);
    expect(result).toEqual(expected);
  });
});

describe('getDefaultDependencies', () => {
  test.each([
    ['test-name', 'python39', ''],
    [
      'test-name',
      'nodejs14',
      `{ 
  "name": "test-name",
  "version": "1.0.0",
  "dependencies": {}
}`,
    ],
    [
      'other-test-name',
      'nodejs12',
      `{ 
  "name": "other-test-name",
  "version": "1.0.0",
  "dependencies": {}
}`,
    ],
    [null, 'python39', ''],
    [undefined, 'nodejs14', ''],
    [undefined, 'nodejs12', ''],
    ['', 'nodejs12', ``],
  ])('.getDefaultDependencies(%s, %s)', (name, runtime, expected) => {
    const result = getDefaultDependencies(name, runtime);
    expect(result).toEqual(expected);
  });
});

describe('isJson', () => {
  test.each([
    [JSON.stringify({ a: 1, b: 2 }), true],
    [JSON.stringify({ a: 1, b: 2 }).slice(1), false],
    [9, false],
    ['data', false],
    [null, false],
    [undefined, false],
    [{}, false],
    [{ a: 2, b: 2 }, false], // should fail on objects, as we accept string input!
    [[1, 2, 3], false],
  ])('.isJson(%s)', (item, expected) => {
    const result = isJson(item);
    expect(result).toEqual(expected);
  });
});
