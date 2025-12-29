module.exports = {
  testEnvironment: 'node',
  // This tells Jest to transform the uuid package so it understands the 'export' keyword
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    "node_modules/(?!(uuid)/)"
  ],
  moduleNameMapper: {
    '^uuid$': 'uuid'
  }
};