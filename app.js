var express = require('express');
var path = require('path');
var interviews = require('./interviews');
var test_interviews = require('./interviews_test');
var blogs = require('./blog');
var apps = require('./apps');    // Shopify apps the store uses
var software = require('./software');// Third party software the store uses
var blog = require('./blog');
var bodyParser = require('body-parser');
var request = require('request');
var _ = require('underscore');

var app = express();
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var port = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function(req, res) {
  var newInterviews = {}
  for (var i in interviews) {
      if(interviews[i]['status'] == 'published') {
        newInterviews[i] = interviews[i]
      }
  };

  res.render('index', {
    interviews : newInterviews
  });
});

app.get('/blog', function(req, res) {
  res.render('blog', {
    blog : blog
  });
});

app.get('/about', function(req, res) {
  res.render('about');
});

app.get('/shopify-case-studies/:store', function(req,res, next) {
  var s = interviews[req.params.store];
  var shop_apps = []  // List of dictionaries for apps
  var shop_software = []  // List of dictionaries for apps
  for (var app in s.apps) {
    // If json file for store is in apps.json
    if (s.apps[app] in apps ){
      shop_apps.push(apps[s.apps[app]]);
    } else {
      // App not in apps.json yet
      console.log(s.apps[app], " not found in app.json")
    }
  };

  for (var a in s.software) {
    // If json file for store is in apps.json
    if (s.software[a] in software ){
      shop_software.push(software[s.software[a]]);
    } else {
      // App not in apps.json yet
      console.log(s.software[a], " not found in software.json")
    }
  };

  res.render('interviews/' + s.store_name.replace(new RegExp(" ", "g"), "_").toLowerCase(), {
    title : s.store_name,
    content : s.responses,
    date :s.date,
    author: s.author,
    link: s.store_link,
    page_link: "http://www.builtwithshopify.com/shopify-case-studies/" + req.params.store,
    founders: s.founders,
    start_date: s.start_date,
    revenue: s.revenue,
    apps : shop_apps,
    software : shop_software,
    employees : s.employees,
    location : s.location,
    store_description: s.store_description,
    orders_month : s.orders_month,
    facebook : s.facebook,
    twitter : s.twitter,
    instagram : s.instagram,
    pinterest : s.pinterest

  });
});

// app.get('/shopify-case-studies-test/:store', function(req,res, next) {
//   var s = test_interviews[req.params.store];
//   var shop_apps = []  // List of dictionaries for apps
//   var shop_software = []  // List of dictionaries for apps
//   for (var app in s.apps) {
//     // If json file for store is in apps.json
//     if (s.apps[app] in apps ){
//       shop_apps.push(apps[s.apps[app]]);
//     } else {
//       // App not in apps.json yet
//       console.log(s.apps[app], " not found in app.json")
//     }
//   };
//
//   for (var a in s.software) {
//     // If json file for store is in apps.json
//     if (s.software[a] in software ){
//       shop_software.push(software[s.software[a]]);
//     } else {
//       // App not in apps.json yet
//       console.log(s.software[a], " not found in software.json")
//     }
//   };
//
//   res.render('interviews/' + s.store_name.replace(new RegExp(" ", "g"), "_").toLowerCase(), {
//     title : s.store_name,
//     content : s.responses,
//     date :s.date,
//     author: s.author,
//     link: s.store_link,
//     page_link: "http://www.builtwithshopify.com/shopify-case-studies/" + req.params.store,
//     founders: s.founders,
//     start_date: s.start_date,
//     revenue: s.revenue,
//     apps : shop_apps,
//     software : shop_software,
//     employees : s.employees,
//     country : s.country,
//     store_description: s.store_description,
//     orders_month : s.orders_month
//   });
// });

app.get('/blog/:post', function(req,res, next) {
  var post = blog[req.params.post];
  res.render('blog/' + post.title.replace(new RegExp(" ", "g"), "_").toLowerCase(), {
    title : post.title,
    content : post.post,
    date : post.date,
    author: post.author,
    description: post.description,
    category: post.category
  })
});

app.get('/shopify-resources', function(req, res) {
  res.render('resources');
});

app.get('/resources', function(req, res) {
  res.redirect('/shopify-resources');
});

app.get('/contact', function(req, res) {
  res.render('contact');
});

app.get('/subscribe', function(req, res) {
  res.render('subscribe');
});

app.post('/contact', function(req, res) {
  // using SendGrid's v3 Node.js Library
  // https://github.com/sendgrid/sendgrid-nodejs

  var helper = require('sendgrid').mail;

  var from_email = new helper.Email(req.body.email);
  var to_email = new helper.Email("josh@builtwithshopify.com");
  var subject = "Built With Shopify Contact";
  var content = new helper.Content("text/plain", req.body.message);
  var mail = new helper.Mail(from_email, subject, to_email, content);

  var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
  var request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  });

  sg.API(request, function(error, response) {
    console.log(response.statusCode);
    console.log(response.body);
    console.log(response.headers);
    if (error) {
      console.log(error);
      res.status(500).send('Oops. Something broke.')
    } else {
      res.redirect('/contact-complete');
    }

  })
});

app.get('/contact-complete', function(req, res) {
  res.render('contact-complete');
});

app.get('/submit', function(req, res) {
  res.render('submit');
});

app.post('/submit', function(req, res) {
  var helper = require('sendgrid').mail;

  var from_email = new helper.Email(req.body.email);
  var to_email = new helper.Email("josh@builtwithshopify.com");
  var subject = "Built With Shopify Store Submission";

  var user_response = ""
  for (var response in req.body) {
    user_response += String(response) + ":" + String(req.body[response]) + "\r\n";
  };
  var content = new helper.Content("text/plain", user_response);
  var mail = new helper.Mail(from_email, subject, to_email, content);

  var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
  var request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  });

  sg.API(request, function(error, response) {
    console.log(response.statusCode);
    console.log(response.body);
    console.log(response.headers);
    if (error) {
      console.log(error);
      res.status(500).send('Oops. Something broke.')
    } else {
      res.redirect('/submit-complete');
    }

  })
});

app.get('/submit-complete', function(req, res) {
  res.render('submit-complete');
})

// Store meta information
app.post('/alexa-ranking', function(req, res) {
  // console.log(req.body)
  request.get('http://data.alexa.com/data?cli=10&url=' + req.body.link, function(err,response,body) {
    if (err) {
      res.send("N.A")
    } else {
      res.send(response);
    };
  });
})

app.listen(port, function() {
  console.log('Example app listening on port: ', port);
});
