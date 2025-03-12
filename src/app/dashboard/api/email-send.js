// const myHeaders = new Headers();
// myHeaders.append("Content-Type", "application/json");
// myHeaders.append("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI5ZTMyNjYxLTdmNmMtNGQwZC04ODVmLTFkZGFiYWEwYjI3OCIsImlhdCI6MTc0MDc0NDE1MywiZXhwIjoxNzQwNzQ3NzUzfQ.PsNh24iykG5LvpostqToYi2zKjv0sHyN_agtCfyZ5Vg");

// const raw = JSON.stringify({
//   "to": "anuoluwapochrist7@gmail.com",
//   "cc": [],
//   "bcc": [],
//   "subject": "Testing",
//   "body": "testing",
//   "signature": "Chris Sign",
//   "email_id": "2e464724-1767-42c8-8017-6151fe7fddda"
// });

// const requestOptions = {
//   method: "POST",
//   headers: myHeaders,
//   body: raw,
//   redirect: "follow"
// };

// fetch("https://email-service-latest-agqz.onrender.com/api/v1/emails/send", requestOptions)
//   .then((response) => response.text())
//   .then((result) => console.log(result))
//   .catch((error) => console.error(error));