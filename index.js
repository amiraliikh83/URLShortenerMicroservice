const express = require('express');
const urlparser = require('url');
const dns = require('dns');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db('urlshortner');
const urls = db.collection("urls");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', (req, res) => {
  console.log(req.body);
  const url = req.body.url;

  
  dns.lookup(urlparser.parse(url).hostname, async (err, address) => {
    if (err || !address) {
      return res.json({ error: "invalid URL" });
    } else {
      try {
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url,
          short_url: urlCount + 1 
        };

        await urls.insertOne(urlDoc);

        return res.json({ original_url: url, short_url: urlCount + 1 });
      } catch (error) {
        console.log(error);
        return res.json({ error: "Error saving URL" });
      }
    }
  });
});

app.get('/api/shorturl/:short_url' , async (req , res) => {
  const shorturl = req.params.short_url
  const urlDoc = await urls.findOne({short_url : +shorturl})
  res.redirect(urlDoc.url)
})

app.listen(port, () => {
  console.log('Listening on port 3000');
});
