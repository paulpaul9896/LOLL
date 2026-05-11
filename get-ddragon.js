import https from 'https';

https.get('https://ddragon.leagueoflegends.com/api/versions.json', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const versions = JSON.parse(data);
    console.log(versions[0]);
  });
});
