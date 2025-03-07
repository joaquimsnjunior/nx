export interface Schema {
  appName: string;
  mfeType: 'host' | 'remote';
  port?: number;
  remotes?: string[];
  host?: string;
  federationType?: 'static' | 'dynamic';
  routing?: boolean;
  skipFormat?: boolean;
  skipPackageJson?: boolean;
  e2eProjectName?: string;
}
