import https from 'node:https';

const ids = ['2879207150', '1510950268', '2487022095', '2004998206'];
const params = new URLSearchParams();
params.append('itemcount', ids.length.toString());
ids.forEach((id, idx) => {
  params.append(`publishedfileids[${idx}]`, id);
});

const postData = params.toString();

const req = https.request({
  hostname: 'api.steampowered.com',
  path: '/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(raw);
      console.log(JSON.stringify(data.response.publishedfiledetails.map(i => ({
        id: i.publishedfileid,
        result: i.result,
        title: i.title,
        preview_url: Boolean(i.preview_url)
      })), null, 2));
    } catch (e) {
      console.error(e);
    }
  });
});

req.write(postData);
req.end();
