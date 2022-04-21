const cliProgress = require('cli-progress')

// create a new progress bar instance and use shades_classic theme
const progressBar = new cliProgress.SingleBar(
  {},
  cliProgress.Presets.shades_classic,
)

module.exports = { progressBar }
