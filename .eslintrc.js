module.exports = {
    extends: ["eslint:recommended", "prettier", "prettier/vue"],
    env: {
        browser: true,
        node: true,
        es6: true
    },
    globals: {
        uni: false
    },
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module"
    }
};
