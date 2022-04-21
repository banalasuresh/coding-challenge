const apiBase = 'https://api.github.com'

const axios = require('axios')
const config = require('./config')
const chalk = require('chalk')
const { progressBar } = require('./progress')
//var authors = [];

const http = axios.create({
  baseURL: apiBase,
  headers: {
    Authorization: `token ${config.GITHUB_PERSONAL_ACCESS_TOKEN}`,
  },
})
//console.log("http")
//console.log(http)
printCurrentUserDetails()
async function printCurrentUserDetails() {
  try {
    const response = await http.get('/user')

    //console.dir(response.data, { colors: true, depth: 4 });
    var owner = response.data.login

    // Get Repo from inputs
    const repo = getRepo()
    //console.log("Repository = " + repo);

    // Get Period from inputs
    const period = getPeriod()
    //console.log("Duration = " + period);

    console.log(
      `Fetching comments for past ${period.replace(
        'd',
        '',
      )} days for ${repo}\n`,
    )

    // Load the number of comments
    progressBar.start(100, 0)


    // Load the number of commits
    var commitResult = await printCommits(repo, period, owner)


  } catch (err) {
    console.error(chalk.red(err))
    console.dir(err.response.data, { colors: true, depth: 4 })
  }
}

function getRepo() {
  // Check to see if the --repo argument is present
  const repoIndex = process.argv.indexOf('--repo')
  const repositoy =
    process.argv.indexOf('--repo') > -1
      ? `${process.argv[repoIndex + 1]}`
      : 'repo not exist.'

  return repositoy
}

function getPeriod() {
  // Check to see if the --period argument is present
  const periodIndex = process.argv.indexOf('--period')
  const duration =
    process.argv.indexOf('--period') > -1
      ? `${process.argv[periodIndex + 1]}`
      : 'period not exist.'

  return duration
}

async function printCommits(repo, period, owner) {
  try {
    // get all authors of repo
    let repoAuthors = await http.get(`/repos/${repo}/contributors`)
    //console.log(repoAuthors.data)

    progressBar.update(25, 0)
    var authors = []
    repoAuthors.data.map((author) => {
      // push all authors to the repository
      //console.log(author)
      authors.push(author.login)
    })
    //console.log(authors);

    let daterange = period.replace('d', '');

    // Get the date for the past period number of days
    let date = new Date()
    date.setDate(date.getDate() - Number(daterange))
    var finalDate =
      date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear()
    //console.log(finalDate)
    finalDate = finalDate.split('/');
    let newDate = new Date(finalDate[2], finalDate[1] - 1, finalDate[0])
    // console.log(newDate.toISOString());

    progressBar.update(50, 0)

    var results = []

    for (i = 0; i < authors.length; i++) {
      var author = authors[i]
      let newObj = new Object()

      var commits = await http.get(
        `/users/${author}/events?since=${newDate.toISOString()}&until=${date.toISOString()}`,
      )
      //console.log(author);
      var usercommits = []
      commits.data.map((data) => {
        if (data.repo.name == repo) {
          //console.log(data.payload.commits);
          usercommits.push(data)
          //console.log(usercommits.length);
          //console.log(data)
        }
      })
      progressBar.update(75, 0)

      var commentResult = await printComments(
        repo,
        period,
        owner,
        usercommits.length,
        author,
        newDate,
        date,
      )
      //console.log(commentResult);

      newObj.id = i
      newObj.user = author
      newObj.comments = commentResult
      newObj.commits = usercommits.length

      results.push(newObj)
    }


    //console.log(results);
    // Sort by number of comments
    results = results.sort((a, b) => {
      return b.comments - a.comments
    })

    progressBar.update(100, 0)
    progressBar.stop()
    for (j = 0; j < results.length; j++) {
      let result = results[j]

      console.log(
        `${result.comments} Comments, ${result.user} (${result.commits} commits)`,
      )
    }

    //console.log("result");
    ///console.log(results);
  } catch (err) {
    console.error(chalk.red(err))
    console.dir(err.response.data, { colors: true, depth: 4 })
  }
}

async function printComments(
  repo,
  period,
  owner,
  commits,
  author,
  newDate,
  date,
) {
  try {

    //console.log("print comments", owner, repo)
    var repoCommits = await http.get(
      `/repos/${repo}/comments?since=${newDate.toISOString()}&until=${date.toISOString()}`,
    ) // Commit comments
    let issues = await http.get(
      `/repos/${repo}/issues?since=${newDate.toISOString()}&until=${date.toISOString()}`,
    ) // issue comments
    let pulls = await http.get(
      `/repos/${repo}/pulls/comments?since=${newDate.toISOString()}&until=${date.toISOString()}`,
    ) // pull request comments

    // console.log(repoCommits.data.length)

    let issueComments = []
    var commitComments = []
    var pullsComments = []
    var totalComments = 0

    // Go thorugh repo Comments and group by user
    repoCommits.data.map((data) => {
      if (data.user.login == author) {
        commitComments.push(data)
      }
    })

    // Go thorugh issue Comments and group by user
    issues.data.map((issue) => {
      if (issue.user.login == author) {
        issueComments.push(issue)
      }
    })

    // Go thorugh pull Comments and group by user
    pulls.data.map((pull) => {
      if (pull.user.login == author) {
        issueComments.push(pull)
      }
    })

    // Add all three types of comments count
    totalComments =
      Number(commitComments.length) +
      Number(issueComments.length) +
      Number(pullsComments.length)

    return totalComments
    // Print the output

  } catch (err) {
    console.error(chalk.red(err))
    console.dir(err.response.data, { colors: true, depth: 4 })
  }
}

