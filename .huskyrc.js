const tasks = (arr) => arr.join(' && ');

module.exports = {
  hooks: {
    'pre-commit': 'yarn lint-staged',
    // 'prepare-commit-msg': tasks([
    //   'exec < /dev/tty',
    //   'git cz --hook || true',
    //   'node ./git/git-commit-message.js',
    // ]),
    'pre-push': 'yarn test',
  },
};
