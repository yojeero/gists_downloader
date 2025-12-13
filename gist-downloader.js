const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const cliProgress = require('cli-progress');

program
  .name('gist-downloader')
  .description('Download all gists for a GitHub user')
  .requiredOption('-u, --user <username>', 'GitHub username')
  .option('-o, --output <dir>', 'Output directory', './gists')
  .option('-t, --token <token>', 'GitHub personal access token')
  .parse(process.argv);

const options = program.opts();

const api = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'User-Agent': 'gist-downloader',
    ...(options.token && {
      Authorization: `token ${options.token}`
    })
  }
});

async function downloadWithProgress(url, filePath) {
  const response = await axios.get(url, { responseType: 'stream' });
  const total = Number(response.headers['content-length']) || 0;

  const bar = new cliProgress.SingleBar(
    {
      format: '    {bar} {percentage}% | {value}/{total} bytes'
    },
    cliProgress.Presets.shades_classic
  );

  if (total) bar.start(total, 0);

  let downloaded = 0;
  response.data.on('data', chunk => {
    downloaded += chunk.length;
    if (total) bar.update(downloaded);
  });

  await streamToFile(response.data, filePath);

  if (total) bar.stop();
}

function streamToFile(stream, filePath) {
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    stream.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function downloadGists(user, outputDir) {
  console.log(`Fetching gists for ${user}...\n`);

  const { data: gists } = await api.get(`/users/${user}/gists`);

  if (!gists.length) {
    console.log('No gists found.');
    return;
  }

  const gistBar = new cliProgress.SingleBar(
    {
      format: 'Gists |{bar}| {value}/{total}'
    },
    cliProgress.Presets.shades_classic
  );

  gistBar.start(gists.length, 0);

  for (const gist of gists) {
    const safeName = (gist.description || `gist-${gist.id}`)
      .replace(/[<>:"/\\|?*]+/g, '_');

    const dir = path.join(outputDir, safeName);
    await fs.promises.mkdir(dir, { recursive: true });

    console.log(`\n📁 ${safeName}`);

    for (const key in gist.files) {
      const file = gist.files[key];
      const filePath = path.join(dir, file.filename);

      console.log(`  ⬇ ${file.filename}`);
      await downloadWithProgress(file.raw_url, filePath);
    }

    gistBar.increment();
  }

  gistBar.stop();
  console.log('\n✅ All gists downloaded.');
}

downloadGists(options.user, options.output).catch(err => {
  if (err.response) {
    console.error('GitHub API error:', err.response.status);
  } else {
    console.error('Error:', err.message);
  }
  process.exit(1);
});
