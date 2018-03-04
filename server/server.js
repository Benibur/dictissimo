const express    = require('express')
const app        = express()
const bodyParser = require('body-parser')
const fs         = require('fs')
const beautify   = require('json-beautify')
const path     = require('path')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/dico',(req, res)=>{
  res.json(require('./dico.json'))
})

app.post('/dico',(req, res)=>{
  fs.writeFileSync(path.join(__dirname,'./dico.json'), beautify(req.body,null, 2, 80) )
  res.send('ok')
})

app.use(express.static('client/bin'))

app.listen(3000)
console.log('server listenning on port 3000');
