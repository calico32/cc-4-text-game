module.exports = {
  future: {
    // removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },

  purge: {
    mode: 'layers',
    content: [
      './src/**/*.tsx',
      './src/**/*.ts',
      './src/**/*.css',
      './public/**/*.html',
      './public/**/*.css',
    ],
  },
  darkMode: 'class',
  theme: {
    fontFamily: {
      display: ['Inter', 'system-ui', 'sans-serif'],
      body: ['Inter', 'system-ui', 'sans-serif'],
      code: ['JetBrains Mono', 'monospace'],
    },
    extend: {},
  },
  variants: {
    extend: {
      cursor: ['hover'],
      // borderWidth: ['hover'],
      // borderStyle: ['hover'],
      ringWidth: ['hover'],
      ringColor: ['hover'],
    },
  },
  plugins: [],
};
