import { DeepPartial, SnowpackConfig } from 'snowpack';

export default <DeepPartial<SnowpackConfig>>{
  plugins: ['@snowpack/plugin-typescript', '@snowpack/plugin-postcss', '@snowpack/plugin-webpack'],
  install: ['tailwindcss/dist/base.min.css'],
  mount: {
    public: '/',
    src: '/dist',
  },
  devOptions: {
    open: 'none',
  },
};
