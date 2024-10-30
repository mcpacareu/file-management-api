module.exports = {
    testEnvironment: "node",
    moduleFileExtensions: ["js", "json"],
    rootDir: ".",
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.js$",
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/$1"
    }
  };
  