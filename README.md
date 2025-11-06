## Run
```shell
# create config.js as config.example.js template
$ touch config.js

# install tailwindcss
$ npm install

# dev: when edit input.css
$ npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch  
```

## EmailJS Provider
Use [EmailJS](https://www.emailjs.com/) for email service provider to sent email directly with form. Here are the steps to configure it:

1. Create account or login at [EmailJS](https://www.emailjs.com/) page
2. Add an email service (Gmail, SMTP, or a provider that suppoerted)
3. Create an email template matching the fields you will pass (e.g. `from_name`, `from_email`, `budget`, `details`, `to_email`, `subject`)
4. Note the values:
```js
// example
EMAILJS_SERVICE_ID: 'service_xxxxxx',
EMAILJS_TEMPLATE_ID: 'template_xxxxxx',
EMAILJS_PUBLIC_KEY: 'yourEmailJSPubKey'
```

**Notes**:
- Always make sure all the EmailJS IDs when doing changes at EmailJS configuration, basically it will be always change when changes happen in EmailJS configuration

## Storing to Spreadsheets
In this mechanism, messages will be stored in spreadsheets through Google Forms first that linked to Google Spreadsheets. Here are the steps to configure it:

1. Make a Google Form with `Name`, `Email`, `Project Details`, `Investments` (labels can be anything)
2. In the Form, go `Responses` > `Link to Sheets` (this creates/links the spreadsheets)
3. Get each field's entry ID:
   - In the Form editor: Get *pre-filled link*
   - Fill dummy values > Get link > open it
   - Copy the URL and note params:
```js
// example
name: "entry.111111111"
email: "entry.222222222"
details: "entry.333333333"
budget: "entry.444444444"
```
4. Note your form action URL (pattern): `https://docs.google.com/forms/d/e/<FORM_ID>/formResponse`

**Notes**:
- Google Form need to be **published** first
- In spreadsheets, you can freely change the column name without concern the data will not stored

## Email Message Template
To edit your email message template for `direct-email` mechanism, refer to `/js/template.js`