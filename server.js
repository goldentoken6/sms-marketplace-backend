const express = require('express')
const mysql = require('mysql')
const app = express()
const port = 2480
const cors = require('cors')
const axios = require('axios')
const passport = require('passport')
const passportJWT = require('passport-jwt')
const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt
const keys = require('./keys')
const router = express.Router()
const authRouter = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const request = require('request')
const fs = require('fs')
const path = require('path')
const { nextTick } = require('process')
const cron = require('node-cron')
var https = require('follow-redirects').https
const { phone } = require('phone')

//Live
const accountSid = 'AC92f6bd829a6df95dd478d5bb4ef115ee'
const authToken = '856723d701438b3bec1552aa3dc28a26'
const TWILIO_NUMBER = '+15076525945'
const MESSAGING_SERVICE_ID = 'MGa0829bf23cbafa1669b150a340e153e8'
const infobipAPIKey =
  '9ebe3d9d3c1b158bf7825d1d3fa82b01-20405fa7-bc0b-49da-aac6-27b6d947ca8b'
const NUM_VERIFY_API_KEY = 'Z9y0kcSs5aCF2btoBDOADteB6586HjWh'
const REALVALIDTO_API_KEY = 'SnI2RitiRkMrQUpVT1BKNDBBL2JoZz09'
const REALVALIDTO_API_SECRET = 'ffb974b584ec1f57cc014da4d14f7495'

const dbconfig = require('./dbconfig')

// Auth Token : 856723d701438b3bec1552aa3dc28a26
// Account Sid: AC92f6bd829a6df95dd478d5bb4ef115ee

//Test
// const accountSid = 'AC4e99214c2459c5dd5f6dd9de50d3d6a2';
// const authToken = '3592c35e3d6714a2f2ab969ed376fd30';
const twilioClient = require('twilio')(accountSid, authToken)

const stripe = require('stripe')(
  'sk_test_51Mj17oEsgEGihK8LsMJeQXV3hiXvuv4B0jErwOlWjqezdw8mKXe1lBkJ0v1ymVN182Zfp5j2fXVMOaxnuIKSSUbH0023y8LLxO'
)

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

let db = mysql.createConnection({
  host: dbconfig.MYSQL_HOST,
  user: dbconfig.MYSQL_USER,
  password: dbconfig.MYSQL_PWD,
  database: dbconfig.DB_NAME
})

db.connect(err => {
  if (err) {
    console.log('Database Connection Failed !!!', err)
  } else {
    console.log('connected to Database')
  }
})

app.use(passport.initialize())
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: keys.secretOrKey
    },
    (jwtPayload, cb) => {
      //find the user in db if needed. This functionality may be omitted if you store everything you'll need in JWT payload.
      return db.query(
        'select * from tbl_clients where id = ?',
        [jwtPayload.id],
        (err, result) => {
          if (err) {
            return cb(err)
          } else {
            return cb(null, result)
          }
        }
      )
    }
  )
)

genToken = user => {
  return jwt.sign(
    {
      iss: 'Joan_Louji',
      sub: user.id,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 1)
    },
    'joanlouji'
  )
}

router.post('/create', (req, res) => {
  const name = req.body.name
  const pwd = req.body.pwd
  const email = req.body.email
  const smscost = req.body.smscost
  const role = req.body.role
  const newUser = { name, email, pwd, role, smscost }

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.pwd, salt, (err, hash) => {
      if (err) throw err
      newUser.pwd = hash
      db.query(
        'INSERT INTO tbl_clients (name, email, pwd, role, sms_cost) VALUES (?,?,?,?,?)',
        [name, email, hash, role, smscost],
        (err, result) => {
          if (err) {
            return res.status(201).send({ response: 'fail' })
          } else {
            return res.status(200).send({ response: 'success' })
          }
        }
      )
    })
  })
})

router.post('/login', (req, res) => {
  const email = req.body.email
  const pwd = req.body.pwd

  db.query(
    'select * from tbl_clients where email = ?',
    [email],
    (err, user) => {
      if (err) {
        return res.status(201).send({ response: 'fail' })
      } else {
        if (user.length < 1) {
          return res.status(201).send({ response: 'fail' })
        }
        bcrypt.compare(pwd, user[0].pwd).then(isMatch => {
          if (isMatch) {
            // User Matched
            // db.query('select * from tbl_settings', [], (err, settings) => {
            //   if (err) {
            //     next(err)
            //   } else {
                
            //   }
            // })
            const payload = {
              id: user[0].id,
              name: user[0].name,
              email: user[0].email,
              role: user[0].role,
              smsCost: user[0].sms_cost
            } // Create JWT Payload
            // Sign Token
            jwt.sign(
              payload,
              keys.secretOrKey,
              { expiresIn: 3600 },
              (err, token) => {
                res.json({
                  success: true,
                  token: token
                })
              }
            )
          } else {
            return res.status(201).json({ message: 'Password incorrect' })
          }
        })
      }
    }
  )
})

//query data from db
router.post('/dbquery', (req, res, next) => {
  const table = req.body.table
  console.log('table', table)
  db.query('select * from ?', [table], (err, user) => {
    if (err) {
      return next(err)
    } else {
      if (user.length < 1) {
        return res.status(201).send({ response: 'fail' })
      }

      return res.json(user)
    }
  })
})

router.post('/numberquery', (req, res, next) => {
  const id = req.body.userid
  console.log('id', id)
  db.query(
    'select * from tbl_numbers where client_id = ?',
    [id],
    (err, user) => {
      if (err) {
        return next(err)
      } else {
        return res.json(user)
      }
    }
  )
})

router.post('/paymentquery', (req, res, next) => {
  const id = req.body.userid
  db.query('select * from tbl_payment where userid = ? ', [id], (err, user) => {
    if (err) {
      return next(err)
    } else {
      return res.json(user)
    }
  })
})

router.post('/setpayment', async (req, res) => {
  const id = req.body.userid
  const email = req.body.email
  const cardname = req.body.cardOwner
  const cardnumber = req.body.cardNumber
  const expiredate = req.body.cardExpirationDate
  const securitycode = req.body.cardSecurityCode

  let current = null

  console.log('setpayment', req.body)

  db.query('DELETE FROM tbl_payment where userid = ?', [id], (err, result) => {
    if (err) {
      console.log(err)
      return res.status(201).send({ response: 'fail' })
    }
  })

  let customer = await stripe.customers.search({
    query: `name: '${cardname}' AND email: '${email}'`
  })

  let customer_id

  if (customer) {
    if (customer.data.length == 0) {
      customer = await stripe.customers.create({
        name: cardname,
        email: email
      })
      customer_id = customer.id
    } else {
      customer_id = customer.data[0].id
    }
  }

  console.log('customer_id >>>', customer_id)

  db.query(
    'INSERT INTO tbl_payment (cardname, cardnumber, expiredate, securitycode, userid, customer_id) VALUES (?,?,?,?,?,?)',
    [cardname, cardnumber, expiredate, securitycode, id, customer_id],
    (err, result) => {
      if (err) {
        console.log(err)
        return res.status(201).send({ response: 'fail' })
      } else {
        return res.status(200).send({ response: 'success' })
      }
    }
  )
})

router.get('/clients', (req, res, next) => {
  let query =
    "SELECT A.id, A.name, A.email, COUNT(DISTINCT B.id) as smsCount, COUNT(DISTINCT C.id) as numbersCount FROM tbl_clients as A LEFT JOIN tbl_sms as B ON A.id = B.client_id LEFT JOIN tbl_numbers as C ON A.id = C.client_id WHERE A.role != 'admin' GROUP BY A.id, A.name, A.email"
  db.query(query, [], (err, user) => {
    if (err) {
      return next(err)
    } else {
      return res.json(user)
    }
  })
})

router.delete('/deleteClients', (req, res, next) => {
  console.log('deleteClients >>>', req.body)
  const jsonArray = req.body.ids
  const clientIds = JSON.parse(jsonArray)
  console.log('clientIds >>> ', clientIds)

  if (clientIds.length == 0) {
    return res.json({ result: 'success' })
  }

  let id_array = '('
  clientIds.forEach(id => {
    id_array += id.toString() + ','
  })
  id_array = id_array.slice(0, -1)
  id_array += ')'

  let query = 'DELETE FROM tbl_clients WHERE id in ' + id_array
  db.query(query, [], err => {
    if (err) {
      return next(err)
    } else {
      return res.json({ result: 'success' })
    }
  })
})

router.get('/client/:id', (req, res, next) => {
  console.log('get client >>>', req.params)
  const client_id = req.params.id

  // let query = "SELECT * FROM client_view WHERE id = ?"
  let query = `SELECT A.id, A.name, A.email, A.sms_cost as smsCost, COUNT(B.id) as smsCount, COUNT(C.id) as numbersCount FROM tbl_clients as A LEFT JOIN tbl_sms as B ON A.id = B.client_id LEFT JOIN tbl_numbers as C ON A.id = C.client_id WHERE A.id = ${client_id} GROUP BY A.id`
  db.query(query, [client_id], (err, client) => {
    if (err) {
      return next(err)
    } else {
      return res.json(client)
    }
  })
})

router.put('/client/:id', (req, res, next) => {
  console.log('update client >>>', req.params, req.body);
  const client_id = req.params.id
  const client_data = req.body.data;

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(client_data.pwd, salt, (err, hash) => {
      if (err) throw err
      client_data.pwd = hash
      db.query(
        'UPDATE tbl_clients SET name = ?, email = ?, pwd = ?, sms_cost = ? WHERE id = ?',
        [client_data.name, client_data.email, hash, client_data.smsCost, client_id],
        (err, result) => {
          if (err) {
            return res.status(400).send({ response: 'fail' })
          } else {
            return res.status(200).send({ response: 'success' })
          }
        }
      )
    })
  })
})


router.post('/numbers', (req, res, next) => {
  console.log('numbers >>> ', req.body)

  const id = req.body.userid
  const numbers = req.body.numbers

  numbers.forEach(number => {
    console.log('number >>> ', number)
    number = number.trim()
    if (number == undefined || number == '') return
    let query =
      'INSERT INTO tbl_numbers (client_id, number, type, status) VALUES (?, ?, ?, ?)'
    db.query(query, [id, number, '', 'subscribed'], (err, number) => {
      if (err) {
        console.log(err)
      } else {
        console.log(number)
      }
    })
    /*twilioClient.lookups.v2
      .phoneNumbers(number)
      .fetch({fields: 'line-type-intelligence'})
      .then((pn) => {
        console.log(pn.lineTypeIntelligence);
        console.log(pn.lineTypeIntelligence.type);
      })
      .catch((err) => {
        console.log('Error >>>', err);
      });*/
  })
  res.json({ result: 'success' })
})

router.post('/checkduplicate', (req, res, next) => {
  console.log('checkduplicate >>> ', req.body)

  const id = req.body.userid
  const numbers = req.body.numbers
  if (numbers.length == 0) return res.json({ result: ok })

  let query = 'SELECT * FROM tbl_numbers WHERE client_id = ?'
  db.query(query, [id], (err, dbnumbers) => {
    if (err) {
      next(err)
    } else {
      let returnNumbers = []
      numbers.forEach(number => {
        number = number.trim()
        if (dbnumbers.length > 0) {
          let index = this.dbnumbers.findIndex(
            element => element.number == number
          )
          if (index > -1) {
            this.clients.splice(index, 1)
          } else {
            returnNumbers.push(number)
          }
        } else {
          returnNumbers.push(number)
        }
      })
      let uniqueNumbers = returnNumbers.filter((c, index) => {
        return returnNumbers.indexOf(c) === index
      })

      console.log('uniqueNumbers >>> ', uniqueNumbers)
      return res.json(uniqueNumbers)
    }
  })
})

router.post('/payCredit', (req, res, next) => {
  console.log('payCredit >>> ', req.body)
  db.query(
    'SELECT * FROM tbl_payment WHERE userid = ?',
    [req.body.userid],
    async (err, result) => {
      if (err) {
        return next(err)
      } else {
        const cardInfo = result[0]
        if (cardInfo == undefined) {
          return res.status(201).send({ result: 'fail', message: 'Please setup payment method' })
        }
        console.log('cardInfo >>> ', cardInfo)
        const expireMonth = cardInfo.expiredate.split('/')[0]
        const expireYear = cardInfo.expiredate.split('/')[1]
        try {
          const card_token = await stripe.tokens.create({
            card: {
              name: cardInfo.cardname,
              number: cardInfo.cardnumber,
              exp_month: expireMonth,
              exp_year: expireYear,
              cvc: cardInfo.securitycode
            }
          })
          // console.log('card token >>>', card_token);

          const card = await stripe.customers.createSource(
            cardInfo.customer_id,
            {
              source: `${card_token.id}`
            }
          )
          // console.log('card >>>', card);

          const createCharge = await stripe.charges.create({
            receipt_email: req.body.email,
            amount: parseFloat((req.body.amount * 100).toFixed(1)),
            currency: 'USD',
            card: card.id,
            customer: cardInfo.customer_id
          })
          db.query(
            'INSERT INTO tbl_pay_history (client_id, amount) VALUES (?, ?)',
            [req.body.userid, req.body.amount],
            (err, results) => {
              if (err) {
                return res.status(201).send({ result: 'fail', message: 'Insert payment history failed' })
              } else {
                return res.json({ result: 'success' })
              }
            }
          )
          // console.log('createCharge >>>', createCharge);
        } catch (error) {
          console.log('error >> ', error)
          return res.status(201).send({ result: 'fail', message: error })
        }
      }
    }
  )
  //return res.json({result: 'success'});
})

router.post('/filterNumbers', (req, res, next) => {
  db.query(
    "SELECT * FROM tbl_numbers WHERE client_id = ? AND type = ''",
    [req.body.userid],
    async (err, results) => {
      if (err) {
        return next(err)
      } else {
        let i = 0
        let number_array = []
        const number_map = new Map()
        for (i = 0; i < results.length; i++) {
          const phoneObj = phone(results[i].number)
          if (phoneObj.isValid) {
            const nationalNumber = phoneObj.phoneNumber.replace(
              phoneObj.countryCode,
              ''
            )
            number_map.set(nationalNumber, results[i].id)
          }
          number_array.push(results[i].number)
        }
        if (number_array.length == 0) {
          return res.json({ result: 'success' })
        }
        try {
          const response = await axios.post(
            'https://app.realvalidito.com/phonelookup/validate',
            {
              api_key: REALVALIDTO_API_KEY,
              api_secret: REALVALIDTO_API_SECRET,
              numbers: number_array
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )

          if (response.status === 200 && response.data.status == 'success') {
            const data = response.data.data
            let promises = []
            number_map.forEach((value, key, map) => {
              if (data[key] != undefined && data[key].status == 'Valid') {
                promises.push(
                  new Promise((resolve, reject) => {
                    db.query('UPDATE tbl_numbers SET type = ? WHERE id = ?', [
                      data[key].number_type.toLowerCase(),
                      value
                    ])
                  })
                )
              }
            })
            // console.log('before Promise.all');
            Promise.all(promises)
              .then(results => {
                return res.json({ result: 'success' })
              })
              .catch(error => {
                return next(error)
              })
          }
        } catch (err) {
          console.error('=========Error========', err)
          return next(err)
        }

        // var options = {
        //   method: 'POST',
        //   hostname: 'zjzemx.api.infobip.com',
        //   path: '/number/1/query',
        //   headers: {
        //     Authorization: `App ${infobipAPIKey}`,
        //     'Content-Type': 'application/json',
        //     Accept: 'application/json'
        //   },
        //   maxRedirects: 20
        // }
        // var req = https.request(options, function (result) {
        //   var chunks = []

        //   result.on('data', function (chunk) {
        //     chunks.push(chunk)
        //     console.log('chunk >>>', chunk);
        //   })

        //   result.on('end', function (chunk) {
        //     var body = Buffer.concat(chunks)
        //     console.log('body >>>',body.toString())
        //     body = JSON.parse(body.toString());
        //     if (body.requestError != undefined) {
        //       return res.status(401).send(body.requestError.serviceException);
        //     } else {
        //       return res.json(body);
        //     }
        //   })

        //   result.on('error', function (error) {
        //     console.error('error >>>', error)
        //     return res.status(201).send(error);
        //   })
        // })
        // console.log('number_array >>>', number_array)
        // var postData = JSON.stringify({
        //   to: number_array
        // })
        // req.write(postData)
        // req.end()

        /*for (i = 0; i < results.length; i++) {
          const result = results[i]
          try {
            const pn = await twilioClient.lookups.v2
              .phoneNumbers(result.number)
              .fetch({ fields: 'line_type_intelligence' })
            console.log('pn >>>', pn)
            if (pn.valid) {
              if (
                pn.lineTypeIntelligence.type == 'mobile' ||
                pn.lineTypeIntelligence.type == 'landline'
              ) {
                const queryResult = db.query(
                  'UPDATE tbl_numbers SET type=? WHERE client_id = ? AND number = ?',
                  [pn.lineTypeIntelligence.type, req.body.userid, result.number]
                )
                // console.log('queryResult >>>', queryResult);
              }
            }
          } catch (err) {}
        }*/
        //return res.json({ result: 'success' })
      }
    }
  )
})

router.post('/deletesms', (req, res, next) => {
  console.log('deletesms >>> ', req.body)
  const client_id = req.body.userid
  const histories = req.body.histories

  let id_array = '('
  histories.forEach(id => {
    id_array += id.toString() + ','
  })
  id_array = id_array.slice(0, -1)
  id_array += ')'
  const query = `DELETE FROM tbl_sms WHERE client_id = ${client_id} AND id in ${id_array}`
  db.query(query, [], (err, result) => {
    if (err) {
      return next(err)
    } else {
      return res.json({ result: 'success' })
    }
  })
})

router.post('/deleteNumber', (req, res, next) => {
  console.log('deleteNumber >>> ', req.body)
  const client_id = req.body.userid
  const numberIds = req.body.numberIds

  let id_array = '('
  numberIds.forEach(id => {
    id_array += id.toString() + ','
  })
  id_array = id_array.slice(0, -1)
  id_array += ')'
  const query = `DELETE FROM tbl_numbers WHERE client_id = ${client_id} AND id in ${id_array}`
  db.query(query, [], (err, result) => {
    if (err) {
      return next(err)
    } else {
      return res.json({ result: 'success' })
    }
  })
})

router.post('/getMobileNumbers', (req, res, next) => {
  console.log('getMobileNumbers', req.body)
  db.query(
    "SELECT * FROM tbl_numbers WHERE client_id = ? AND type = 'mobile' AND status = 'subscribed'",
    [req.body.userid],
    async (err, results) => {
      if (err) {
        return next(err)
      } else {
        return res.json({ result: results })
      }
    }
  )
})

router.post('/schedulesms', async (req, res, next) => {
  console.log('schedulesms', req.body)
  const userid = req.body.userid
  const numbers = req.body.numbers
  const senddate = req.body.senddate
  const content = req.body.content
  const number_array = numbers.split(',')

  let promises = []
  number_array.forEach(number => {
    promises.push(
      new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO tbl_sms (client_id, content, number, send_at) VALUES (?, ?, ?, ?)',
          [userid, content, number, senddate],
          (err, results) => {
            if (err) {
              reject(err)
            } else {
              resolve(results)
            }
          }
        )
      })
    )
  })

  Promise.all(promises)
    .then(results => {
      console.log(results)
      return res.json({ result: results })
    })
    .catch(error => {
      console.error(error)
      return next(err)
    })
})

cron.schedule('* * * * *', () => {
  console.log('cron job run')
  const ts = Date.now() / 1000
  db.query(
    'SELECT * FROM tbl_sms WHERE send_status = 0 AND (send_at - ?) < 60',
    [ts],
    async (err, results) => {
      if (err) {
      } else {
        if (results.length > 0) {
          let promises = []
          results.map(result => {
            db.query(
              'UPDATE tbl_sms SET send_status = 1 WHERE id = ?',
              [result.id],
              () => {}
            )
            promises.push(
              twilioClient.messages.create({
                to: result.number,
                from: MESSAGING_SERVICE_ID,
                body: result.content
              })
            )
          })

          Promise.all(promises)
            .then(messages => {
              console.log('Message sent!', messages)
            })
            .catch(err => console.error(err))
        }
      }
    }
  )

  db.query('SELECT * FROM tbl_numbers', [], (err, results) => {
    if (err) {
    } else {
      results.forEach(async result => {
        twilioClient.lookups.v1
          .phoneNumbers(result.number)
          .fetch({ addOns: 'twilio_carrier', addOnsData: { opt_out_db: true } })
          .then(number => {
            // console.log(number);
            if (number.addOns.status == 'successful') {
              // console.log(number.addOns.results.twilio_carrier.result.opt_out_db);
              try {
                db.query('UPDATE tbl_numbers SET status=? WHERE number=?', [
                  number.addOns.results.twilio_carrier.result.opt_out_db
                    ? 'unsubscribed'
                    : 'subscribed',
                  result.number
                ])
              } catch (err) {}
            } else {
              db.query('UPDATE tbl_numbers SET status=? WHERE number=?', [
                'unsubscribed',
                result.number
              ])
            }
          })
          .catch(error => {
            console.error(error)
          })
      })
    }
  })
})

router.get('/sms/:id', (req, res, next) => {
  console.log('get sms history >>>', req.params)
  const client_id = req.params.id

  let query = 'SELECT * FROM tbl_sms WHERE client_id = ?'
  db.query(query, [client_id], (err, sms_history) => {
    if (err) {
      return next(err)
    } else {
      return res.json(sms_history)
    }
  })
})

router.get('/allsms', (req, res, next) => {
  let query =
    'SELECT A.*, B.`name` FROM tbl_sms AS A LEFT JOIN tbl_clients AS B ON A.client_id = B.id'
  db.query(query, [], (err, sms_history) => {
    if (err) {
      return next(err)
    } else {
      return res.json(sms_history)
    }
  })
})

router.get('/sms_content/:id', (req, res, next) => {
  console.log('get sms content >>>', req.params)
  const sms_id = req.params.id

  let query = 'SELECT * FROM tbl_sms WHERE id = ?'
  db.query(query, [sms_id], (err, sms_history) => {
    if (err) {
      return next(err)
    } else {
      return res.json(sms_history)
    }
  })
})

router.get('/sms_analytics/:id', async (req, res, next) => {
  console.log('get sms analytics >>>', req.params)
  const client_id = req.params.id

  let week_query = `SELECT count FROM ( SELECT YEAR(FROM_UNIXTIME(B.send_at)) as year, MONTH(FROM_UNIXTIME(B.send_at)) as month, WEEK(FROM_UNIXTIME(B.send_at)) as week, COUNT(*) as count FROM (SELECT * FROM tbl_sms WHERE client_id=${client_id}) AS B GROUP BY year, month, week) as A WHERE A.year = YEAR(CURRENT_DATE) AND A.month = MONTH(CURRENT_DATE) AND A.week = WEEK(CURRENT_DATE)`

  let month_query = `SELECT count FROM ( SELECT YEAR(FROM_UNIXTIME(B.send_at)) as year, MONTH(FROM_UNIXTIME(B.send_at)) as month, COUNT(*) as count FROM (SELECT * FROM tbl_sms WHERE client_id=${client_id}) AS B GROUP BY year, month) as A WHERE A.year = YEAR(CURRENT_DATE) AND A.month = MONTH(CURRENT_DATE)`

  let year_query = `SELECT count FROM ( SELECT YEAR(FROM_UNIXTIME(B.send_at)) as year, COUNT(*) as count FROM (SELECT * FROM tbl_sms WHERE client_id=${client_id}) AS B GROUP BY year) as A WHERE A.year = YEAR(CURRENT_DATE)`

  let analytics = `SELECT MONTH(FROM_UNIXTIME(B.send_at)) as month, COUNT(*) as count FROM (SELECT * FROM tbl_sms WHERE client_id=${client_id}) AS B GROUP BY MONTH(FROM_UNIXTIME(B.send_at)) ORDER BY MONTH(FROM_UNIXTIME(B.send_at))`

  const queries = [week_query, month_query, year_query, analytics]

  let promises = []
  queries.forEach(query => {
    promises.push(
      new Promise((resolve, reject) => {
        db.query(query, [], (err, results) => {
          if (err) {
            reject(err)
          } else {
            resolve(results)
          }
        })
      })
    )
  })

  Promise.all(promises)
    .then(results => {
      console.log('results >>>', results)
      const week_count = results[0][0] == undefined ? 0 : results[0][0]['count']
      const month_count =
        results[1][0] == undefined ? 0 : results[1][0]['count']
      const year_count = results[2][0] == undefined ? 0 : results[2][0]['count']
      console.log('week count >>>', week_count)
      console.log('month count >>>', month_count)
      console.log('year count >>>', year_count)
      const month_analytics = results[3]
      console.log('month analytics >>>', month_analytics)
      return res.json({
        week: week_count,
        month: month_count,
        year: year_count,
        analytics: month_analytics
      })
    })
    .catch(err => {
      console.error(err)
      return next(err)
    })

  // db.query(queries.join(';'), (err, results) => {
  //   if (err) {
  //     return next(err);
  //   } else {
  //     const result1 = results[0];
  //     console.log('result1 >>> ', result1);
  //     // const result2 = results[1];
  //     // console.log('result2 >>> ', result2);
  //     // const result3 = results[2];
  //     // const result4 = results[3];

  //     // console.log('result3 >>> ', result3);
  //     // console.log('result4 >>> ', result4);
  //     return res.json('ok');
  //   }
  // });
})

router.get('/sms_analytics', async (req, res, next) => {
  console.log('get sms analytics >>>', req.params)

  let week_query = `SELECT count FROM ( SELECT YEAR(FROM_UNIXTIME(send_at)) as year, MONTH(FROM_UNIXTIME(send_at)) as month, WEEK(FROM_UNIXTIME(send_at)) as week, COUNT(*) as count FROM tbl_sms GROUP BY year, month, week) as A WHERE A.year = YEAR(CURRENT_DATE) AND A.month = MONTH(CURRENT_DATE) AND A.week = WEEK(CURRENT_DATE)`

  let month_query = `SELECT count FROM ( SELECT YEAR(FROM_UNIXTIME(send_at)) as year, MONTH(FROM_UNIXTIME(send_at)) as month, COUNT(*) as count FROM tbl_sms GROUP BY year, month) as A WHERE A.year = YEAR(CURRENT_DATE) AND A.month = MONTH(CURRENT_DATE)`

  let year_query = `SELECT count FROM ( SELECT YEAR(FROM_UNIXTIME(send_at)) as year, COUNT(*) as count FROM tbl_sms GROUP BY year) as A WHERE A.year = YEAR(CURRENT_DATE)`

  let analytics = `SELECT MONTH(FROM_UNIXTIME(send_at)) as month, COUNT(*) as count FROM tbl_sms GROUP BY MONTH(FROM_UNIXTIME(send_at)) ORDER BY MONTH(FROM_UNIXTIME(send_at))`

  const queries = [week_query, month_query, year_query, analytics]

  let promises = []
  queries.forEach(query => {
    promises.push(
      new Promise((resolve, reject) => {
        db.query(query, [], (err, results) => {
          if (err) {
            reject(err)
          } else {
            resolve(results)
          }
        })
      })
    )
  })

  Promise.all(promises)
    .then(results => {
      console.log('results >>>', results)
      const week_count = results[0][0] == undefined ? 0 : results[0][0]['count']
      const month_count =
        results[1][0] == undefined ? 0 : results[1][0]['count']
      const year_count = results[2][0] == undefined ? 0 : results[2][0]['count']
      console.log('week count >>>', week_count)
      console.log('month count >>>', month_count)
      console.log('year count >>>', year_count)
      const month_analytics = results[3]
      console.log('month analytics >>>', month_analytics)
      return res.json({
        week: week_count,
        month: month_count,
        year: year_count,
        analytics: month_analytics
      })
    })
    .catch(err => {
      console.error(err)
      return next(err)
    })

  // db.query(queries.join(';'), (err, results) => {
  //   if (err) {
  //     return next(err);
  //   } else {
  //     const result1 = results[0];
  //     console.log('result1 >>> ', result1);
  //     // const result2 = results[1];
  //     // console.log('result2 >>> ', result2);
  //     // const result3 = results[2];
  //     // const result4 = results[3];

  //     // console.log('result3 >>> ', result3);
  //     // console.log('result4 >>> ', result4);
  //     return res.json('ok');
  //   }
  // });
})

router.get('/pay_history', (req, res, next) => {
  let query =
    'SELECT SUM(amount) as total_amount, client_id, tbl_clients.`name` FROM tbl_pay_history LEFT JOIN tbl_clients ON tbl_pay_history.client_id = tbl_clients.id GROUP BY client_id'
  db.query(query, [], (err, pay_history) => {
    if (err) {
      return next(err)
    } else {
      return res.json(pay_history)
    }
  })
})

router.get('/settings', (req, res, next) => {
  console.log('get settings')
  let query = `SELECT * FROM tbl_settings`
  db.query(query, [], (err, results) => {
    if (err) {
      return next(err)
    } else {
      return res.json(results)
    }
  })
})

router.post('/settings', (req, res, next) => {
  console.log('update settings', req.body)
  const sms_cost = req.body.sms_cost
  const query = 'UPDATE tbl_settings SET sms_cost = ?'
  db.query(query, [sms_cost], (err, results) => {
    if (err) {
      return next(err)
    } else {
      return res.json(results)
    }
  })
})

app.use('/', router)
app.use('/auth', passport.authenticate('jwt', { session: false }), authRouter)

app.listen(port, () => {
  console.log(`connected on port ${port}`)
})
module.exports = app
