import { CypressConfigTransformer } from './change-config-transformer';

describe('Update Cypress Config', () => {
  const configContent = `
import { defineConfig } from 'cypress';
import { componentDevServer } from '@nrwl/cypress/plugins/next';


export default defineConfig({
  baseUrl: 'blah its me',
  component: {
    devServer: componentDevServer('tsconfig.cy.json', 'babel'),
    pluginsFile: false,
    video: true,
    chromeWebSecurity: false,
    fixturesFolder: 'cypress/fixtures',
    specPattern: '**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
    videosFolder: '../../dist/cypress/apps/n/videos',
    screenshotsFolder: '../../dist/cypress/apps/n/screenshots',
  },
  e2e: {
    fileServerFolder: '.',
    fixturesFolder: './src/fixtures',
    integrationFolder: './src/e2e',
    supportFile: './src/support/e2e.ts',
    specPattern: '**/*.cy.{js,ts}',
    pluginsFile: false,
    video: true,
    videosFolder: '../../dist/cypress/apps/myapp4299814-e2e/videos',
    screenshotsFolder: '../../dist/cypress/apps/myapp4299814-e2e/screenshots',
    chromeWebSecurity: false,
  }
});
  `;

  it('should add and update existing properties', () => {
    const actual = CypressConfigTransformer.addOrUpdateProperties(
      configContent,
      {
        blah: 'i am a top level property',
        baseUrl: 'http://localhost:1234',
        component: {
          fixturesFolder: 'cypress/fixtures/cool',
          devServer: { tsConfig: 'tsconfig.spec.json', compiler: 'swc' },
          // @ts-ignore
          blah: 'i am a random property',
        },
        e2e: {
          video: false,
        },
      }
    );

    expect(actual).toMatchSnapshot();
  });

  it('should overwrite existing config', () => {
    const actual = CypressConfigTransformer.addOrUpdateProperties(
      configContent,
      {
        baseUrl: 'http://overwrite:8080',
        component: {
          devServer: { tsConfig: 'tsconfig.spec.json', compiler: 'swc' },
        },
        e2e: {
          video: false,
        },
      },
      true
    );

    expect(actual).toMatchSnapshot();
  });

  it('should remove properties', () => {
    const actual = CypressConfigTransformer.removeProperties(configContent, [
      'baseUrl',
      'component.pluginsFile',
      'component.devServer',
      'component.specPattern',
      'component.video',
      'e2e.chromeWebSecurity',
      'e2e.screenshotsFolder',
      'e2e.video',
    ]);
    expect(actual).toMatchSnapshot();
  });

  it('should read existing config object', () => {
    const actual = CypressConfigTransformer.readConfig(configContent);
    expect(actual).toMatchSnapshot();
  });
});
