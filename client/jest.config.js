module.exports = {
    transform: {
      "^.+\\.[jt]sx?$": "babel-jest", // use babel-jest for js/jsx
    },
    transformIgnorePatterns: [
      "/node_modules/(?!(axios)/)", // 👈 allow axios to be transformed
    ],
    moduleNameMapper: {
      "\\.(css|less|scss|sass)$": "identity-obj-proxy", // mock CSS files
    },
    testEnvironment: "jsdom",
  };