import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/TrustQuery.js',
  output: {
    file: 'dist/trustquery.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    resolve()
  ]
};
