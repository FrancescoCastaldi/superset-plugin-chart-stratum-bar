import * as fs from 'fs';
import * as path from 'path';
import { get2DBarOption } from '../src/components/renderers2D';
import { get3DBarOption } from '../src/components/renderers3D';
import { cases2D, cases3D } from './__fixtures__/rendererCases';
import { probeOption } from './helpers/optionProbe';

/**
 * Characterization suite: the serialized options (plus the outputs of
 * renderItem and formatters on probe inputs) must stay identical to the
 * snapshot frozen against the pre-refactor renderers.
 *
 * Regenerate only on an intentional rendering change:
 *   STRATUM_WRITE_FIXTURES=1 npx jest rendererCharacterization
 */
const FIXTURE_PATH = path.join(__dirname, '__fixtures__', 'rendererOptions.fixture.json');

function computeAll() {
  const result: Record<string, unknown> = {};
  cases2D.forEach(c => {
    result[c.name] = probeOption(get2DBarOption(c.props), c.props);
  });
  cases3D.forEach(c => {
    result[c.name] = probeOption(get3DBarOption(c.props), c.props);
  });
  return result;
}

const actual = computeAll();

if (process.env.STRATUM_WRITE_FIXTURES === '1') {
  fs.writeFileSync(FIXTURE_PATH, `${JSON.stringify(actual, null, 1)}\n`, 'utf8');
}

const expected = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));

describe('renderer characterization (pre-refactor fixture)', () => {
  it('covers every fixture case', () => {
    expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort());
  });

  [...cases2D, ...cases3D].forEach(c => {
    it(`${c.name} matches the frozen ECharts option`, () => {
      expect(JSON.parse(JSON.stringify(actual[c.name]))).toEqual(expected[c.name]);
    });
  });
});
