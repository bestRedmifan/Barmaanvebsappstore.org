"use strict";

const root = document.getElementById("root");

const CREDIT_KEY = "barmaan_credit";
const QUIZ_KEY = "barmaan_quiz";
const STATS_KEY = "barmaan_stats";
const LOCATION_KEY = "barmaan_location_allowed";
const AGE_KEY = "barmaan_age_verified";
const BIRTHDAY_KEY = "barmaan_birthday";
const BIRTHDAY_CLAIM_KEY = "barmaan_birthday_claim";
const DEATH_KEY = "barmaan_death_lock";

let apps = [];
let country = null;
let credit = Number(localStorage.getItem(CREDIT_KEY) || 0);

let stats;

try {
stats = JSON.parse(
localStorage.getItem(STATS_KEY) || '{"today":0,"total":0}'
);
} catch (e) {
stats = {
today: 0,
total: 0
};
}

const VIP = {
"10393": 20,
"30493": 50,
"29373": 100,
"97283": 200,
"02832": 500,
"02833": 1000
};

function save() {
localStorage.setItem(
CREDIT_KEY,
String(credit)
);

localStorage.setItem(
STATS_KEY,
JSON.stringify(stats)
);
}

function money() {
return credit.toFixed(2) + "¢";
}

async function loadApps() {
try {
const r = await fetch(
"posts.json",
{
cache: "no-store"
}
);

if (!r.ok) {
throw new Error(
"posts.json could not be loaded"
);
}

const data = await r.json();

if (!Array.isArray(data)) {
throw new Error(
"posts.json must contain an array"
);
}

apps = data;

} catch (e) {
apps = [];

root.innerHTML = `
<div class="error">
Cannot load posts.json
</div>
`;
}
}

function requestLocation() {
root.innerHTML = `
<div class="location">

<h2>Location permission</h2>

<p>
This app store has region limit if you don't allow we can't give services
</p>

<p>
این فروشگاه برنامه محدودیت منطقه ای دارد اگر دسترسی ندهید نمی‌توانیم خدمات بدهیم
</p>

<button onclick="getLocation()">
Allow location
</button>

<button class="gray" onclick="ipLocation()">
I don't have an device that supports GPS access
</button>

</div>
`;
}

function getLocation() {
if (!navigator.geolocation) {
storeError();
return;
}

navigator.geolocation.getCurrentPosition(
async function (p) {
try {
const u =
"https://nominatim.openstreetmap.org/reverse" +
"?format=json" +
"&lat=" +
encodeURIComponent(
p.coords.latitude
) +
"&lon=" +
encodeURIComponent(
p.coords.longitude
);

const r = await fetch(
u,
{
headers: {
Accept: "application/json"
}
}
);

if (!r.ok) {
throw new Error(
"Location lookup failed"
);
}

const d = await r.json();

country = String(
(d.address &&
d.address.country_code) ||
""
).toUpperCase();

if (!country) {
throw new Error(
"Country not found"
);
}

localStorage.setItem(
LOCATION_KEY,
"yes"
);

afterLocation();

} catch (e) {
storeError();
}
},
function () {
storeError();
},
{
timeout: 10000
}
);
}

async function ipLocation() {
try {
const r = await fetch(
"https://ipapi.co/json/",
{
cache: "no-store"
}
);

if (!r.ok) {
throw new Error(
"IP lookup failed"
);
}

const d = await r.json();

country = String(
d.country_code || ""
).toUpperCase();

if (!country) {
throw new Error(
"Country not found"
);
}

/*
IP country is intentionally
not stored in localStorage.
*/
afterLocation();

} catch (e) {
storeError();
}
}

function afterLocation() {
if (localStorage.getItem(DEATH_KEY) === "yes") {
deathLock();
return;
}

if (!localStorage.getItem(AGE_KEY)) {
verifyAge();
return;
}

home();
}

function storeError() {
root.innerHTML = `
<div class="error">
<h2>Location permission is required</h2>
<p>
Please allow location access to continue.
</p>
</div>
`;
}

function verifyAge() {
root.innerHTML = `
<div class="card">

<h2>Verify your age!</h2>

<button onclick="birthdayForm()">
Let's do it!
</button>

</div>
`;
}

function birthdayForm() {
let months = "";

for (let i = 1; i <= 12; i++) {
months += `
<option value="${i}">
${i}
</option>
`;
}

let years = "";

for (let i = 1900; i <= 2100; i++) {
years += `
<option value="${i}">
${i}
</option>
`;
}

root.innerHTML = `
<div class="card">

<h2>Enter your birthday age!</h2>

<p>Month</p>

<select id="birthMonth"
onchange="updateDays()">
<option value="">Month</option>
${months}
</select>

<p>Year</p>

<select id="birthYear"
onchange="updateDays()">
<option value="">Year</option>
${years}
</select>

<p>Day</p>

<select id="birthDay">
<option value="">Day</option>
</select>

<br><br>

<button
id="birthEnter"
class="gray"
disabled
onclick="calculateAge()"
>
Enter
</button>

</div>
`;

updateDays();
}

function updateDays() {
const month =
document.getElementById("birthMonth");

const year =
document.getElementById("birthYear");

const day =
document.getElementById("birthDay");

const enter =
document.getElementById("birthEnter");

if (!month || !year || !day) {
return;
}

day.innerHTML =
'<option value="">Day</option>';

if (!month.value) {
if (enter) {
enter.disabled = true;
enter.className = "gray";
}
return;
}

const y =
Number(year.value) ||
new Date().getFullYear();

const days =
new Date(
y,
Number(month.value),
0
).getDate();

for (let i = 1; i <= days; i++) {
day.innerHTML += `
<option value="${i}">
${i}
</option>
`;
}

if (enter) {
const ok =
month.value &&
year.value &&
day.value;

enter.disabled = !ok;
enter.className =
ok ? "" : "gray";
}
}

document.addEventListener(
"change",
function (e) {
if (
e.target.id === "birthDay"
) {
const m =
document.getElementById(
"birthMonth"
);

const y =
document.getElementById(
"birthYear"
);

const b =
document.getElementById(
"birthEnter"
);

if (!m || !y || !b) {
return;
}

const ok =
m.value &&
y.value &&
e.target.value;

b.disabled = !ok;
b.className =
ok ? "" : "gray";
}
}
);

function calculateAge() {
const m =
Number(
document.getElementById(
"birthMonth"
).value
);

const d =
Number(
document.getElementById(
"birthDay"
).value
);

const y =
Number(
document.getElementById(
"birthYear"
).value
);

if (!m || !d || !y) {
return;
}

const now = new Date();

let age =
now.getFullYear() - y;

const birthdayPassed =
now.getMonth() + 1 > m ||
(
now.getMonth() + 1 === m &&
now.getDate() >= d
);

if (!birthdayPassed) {
age--;
}

confirmAge(
age,
{
type: "date",
year: y,
month: m,
day: d
}
);
}

function confirmAge(age, data) {
root.innerHTML = `
<div class="card">

<h2>
Are you ${age} years old?
</h2>

<button onclick='confirmBirthday(${JSON.stringify(
data
)})'>
Yea!
</button>

<button
class="gray"
onclick="selfieChoice()"
>
No!
</button>

</div>
`;
}

function confirmBirthday(data) {
const now = new Date();

let age =
now.getFullYear() -
Number(data.year);

if (
now.getMonth() + 1 <
Number(data.month) ||
(
now.getMonth() + 1 ===
Number(data.month) &&
now.getDate() <
Number(data.day)
)
) {
age--;
}

localStorage.setItem(
AGE_KEY,
JSON.stringify({
method: "date",
age: age,
birthYear: Number(data.year),
birthMonth: Number(data.month),
birthDay: Number(data.day),
verifiedYear:
now.getFullYear()
})
);

home();
}

function selfieChoice() {
root.innerHTML = `
<div class="card">

<h2>Take a selfie</h2>

<button onclick="startSelfie()">
Let's do it
</button>

<button
class="gray"
onclick="birthdayForm()"
>
My device isn't have camera
</button>

</div>
`;
}

async function startSelfie() {
if (!navigator.mediaDevices ||
!navigator.mediaDevices.getUserMedia) {
selfiePageError();
return;
}

root.innerHTML = `
<div class="card">

<h2>Take a selfie</h2>

<video
id="camera"
autoplay
playsinline
></video>

<br>

<button onclick="takeSelfie()">
Take selfie
</button>

<canvas
id="selfieCanvas"
style="display:none"
></canvas>

<p>
Age estimation from face is unavailable.
Please use birthday verification instead.
</p>

</div>
`;

try {
const stream =
await navigator.mediaDevices.getUserMedia({
video: true
});

const video =
document.getElementById("camera");

if (video) {
video.srcObject = stream;
}

window.selfieStream = stream;

} catch (e) {
selfiePageError();
}
}

function takeSelfie() {
const video =
document.getElementById("camera");

const canvas =
document.getElementById(
"selfieCanvas"
);

if (!video || !canvas) {
return;
}

canvas.width =
video.videoWidth;

canvas.height =
video.videoHeight;

const ctx =
canvas.getContext("2d");

ctx.drawImage(
video,
0,
0,
canvas.width,
canvas.height
);

if (window.selfieStream) {
window.selfieStream
.getTracks()
.forEach(
function (track) {
track.stop();
}
);
}

root.innerHTML = `
<div class="card">

<h2>Selfie captured</h2>

<p>
For privacy and safety, age cannot be
estimated from your face here.
</p>

<button onclick="birthdayForm()">
Use birthday verification
</button>

</div>
`;
}

function selfiePageError() {
root.innerHTML = `
<div class="error">

<h2>Camera unavailable</h2>

<p>
Your device cannot provide camera access.
</p>

<button onclick="birthdayForm()">
Back
</button>

</div>
`;
}

function getAgeInfo() {
try {
return JSON.parse(
localStorage.getItem(
AGE_KEY
) || "null"
);
} catch (e) {
return null;
}
}

function currentAge() {
const info =
getAgeInfo();

if (!info) {
return null;
}

if (info.method === "date") {
const now = new Date();

let age =
now.getFullYear() -
Number(info.birthYear);

if (
now.getMonth() + 1 <
Number(info.birthMonth) ||
(
now.getMonth() + 1 ===
Number(info.birthMonth) &&
now.getDate() <
Number(info.birthDay)
)
) {
age--;
}

return age;
}

return Number(info.age);
}

function birthdayCheck() {
const info =
getAgeInfo();

if (!info ||
info.method !== "date") {
return false;
}

const now = new Date();

return (
now.getMonth() + 1 ===
Number(info.birthMonth) &&
now.getDate() ===
Number(info.birthDay)
);
}

function showBirthday() {
const info =
getAgeInfo();

if (!info) {
return;
}

const year =
new Date().getFullYear();

const key =
String(year);

if (
localStorage.getItem(
BIRTHDAY_CLAIM_KEY
) === key
) {
return;
}

const amount =
info.method === "date" ?
300 :
200;

root.innerHTML = `
<div class="card">

<h2>
Happy birthday!!!!!!
</h2>

<button onclick="claimBirthday(${amount})">
Give me my gift!
</button>

</div>
`;
}

function claimBirthday(amount) {
credit += Number(amount);

localStorage.setItem(
BIRTHDAY_CLAIM_KEY,
String(new Date().getFullYear())
);

save();

earning();
}

function regionBlocked(app) {
const blocked =
app["Blocked region"] ??
app.blockedRegion ??
app.regionBlocked;

return (
Array.isArray(blocked) &&
blocked.includes(country)
);
}

function supportedCountry(app) {
const supported =
app["Supported country"] ??
app.supportedCountry;

return (
Array.isArray(supported) &&
supported.includes(country)
);
}

function countryState(app) {
const supported =
app["Supported country"] ??
app.supportedCountry;

const blocked =
app["Blocked region"] ??
app.blockedRegion ??
app.regionBlocked;

const hasSupported =
Array.isArray(supported) &&
supported.length > 0;

const hasBlocked =
Array.isArray(blocked) &&
blocked.length > 0;

if (hasSupported && hasBlocked) {
return "error";
}

if (hasBlocked) {
return blocked.includes(country)
? "blocked"
: "ok";
}

if (hasSupported) {
return supported.includes(country)
? "ok"
: "blocked";
}

return "coming";
}

function ageAllowed(app) {
const rule =
String(
app["Age limit"] ??
app.ageLimit ??
""
).trim();

if (!rule) {
return true;
}

const age =
currentAge();

if (age === null) {
return false;
}

if (rule.endsWith("-")) {
const n =
Number(
rule.slice(0, -1)
);

return age <= n;
}

if (rule.endsWith("+")) {
const n =
Number(
rule.slice(0, -1)
);

return age >= n;
}

const n = Number(rule);

if (!Number.isNaN(n)) {
return age === n;
}

return false;
}

function appAvailable(app) {
const state =
countryState(app);

if (state !== "ok") {
return false;
}

return ageAllowed(app);
}
function typePriceValid(app) {
const type =
String(app.type || "").trim();

const price =
Number(app.price || 0);

if (type === "Extension") {
return price >= 50 && price <= 100;
}

if (type === "Text") {
return price >= 20 && price <= 30;
}

if (type === "Game mob") {
return price >= 100 && price <= 200;
}

if (type === "Code") {
return price >= 300 && price <= 500;
}

if (type === "Media file") {
return price >= 15 && price <= 20;
}

if (type === "PWA zip") {
return price >= 30 && price <= 50;
}

return true;
}

function freeAllowed(app) {
const type =
String(app.type || "").trim();

if (
type === "Code" ||
type === "PWA zip"
) {
return false;
}

return true;
}

function typeData(app) {
const type =
String(app.type || "").trim();

if (type === "Extension") {
return `
<p>
Extension installation link
</p>
`;
}

if (type === "Text") {
return `
<p>
Text is included in posts.json
</p>
`;
}

if (type === "Game mob") {
return `
<p>
Game file
</p>
`;
}

if (type === "Code") {
return `
<p>
Code information
</p>
`;
}

if (type === "Media file") {
return `
<p>
Media file
</p>
`;
}

if (type === "PWA zip") {
return `
<p>
PWA ZIP file
</p>
`;
}

if (type === "An file") {
return `
<p>
File
</p>
`;
}

if (type === "All UI/OS") {
return `
<p>
UI / OS installation file
</p>
`;
}

return "";
}

function showAppResult(app) {
const type =
String(app.type || "").trim();

if (type === "Text") {
root.innerHTML = `
<div class="card">

<h2>
${safe(app.name)}
</h2>

<p>
${safe(
app.text ??
app.content ??
""
)}
</p>

<button onclick="home()">
Back
</button>

</div>
`;

return;
}

if (type === "Code") {
root.innerHTML = `
<div class="card">

<h2>
${safe(app.name)}
</h2>

<p>
Type of code:
${safe(
app.codeType ||
app["Type of code"] ||
""
)}
</p>

<p>
Type of
${safe(
app.codeLanguage ||
app["Type of"] ||
"code"
)}:
${safe(
app.codeSubtype ||
app["Type of code"] ||
""
)}
</p>

<pre>${safe(
app.code || ""
)}</pre>

<button onclick="home()">
Back
</button>

</div>
`;

return;
}

if (type === "Extension") {
if (app.link) {
window.open(
app.link,
"_blank"
);
}

return;
}

if (
type === "Android" ||
type === "EXE" ||
type === "Game mob" ||
type === "Media file" ||
type === "PWA zip" ||
type === "An file" ||
type === "All UI/OS"
) {
if (app.download) {
window.open(
app.download,
"_blank"
);
}

return;
}

if (
type === "iOS" ||
type === "PWA"
) {
if (app.link) {
window.open(
app.link,
"_blank"
);
}
}
}

function home() {
if (
localStorage.getItem(
LOCATION_KEY
) !== "yes"
) {
requestLocation();
return;
}

refreshLocation(function () {

if (birthdayCheck()) {
showBirthday();
return;
}

if (!apps.length) {
loadApps().then(function () {
if (apps.length) {
home();
}
});

return;
}

root.innerHTML =
"<h2>Available apps</h2>";

apps.forEach(function (app, i) {

const c =
document.createElement("div");

c.className = "card";

let html =
'<div class="app-icon">📦</div>';

html += `
<h2>
${safe(app.name)}
</h2>
`;

html += `
<p>
${safe(app.description || "")}
</p>
`;

const country =
countryState(app);

if (country === "error") {

html += `
<div class="notice">
Error
</div>
`;

} else if (country === "blocked") {

html += `
<div class="notice">
This app isn't available in your region.
</div>
`;

} else if (country === "coming") {

html += `
<div class="notice">
Coming soon
</div>
`;

} else if (!ageAllowed(app)) {

html += `
<div class="notice">
Isn't good for you this
</div>
`;

} else if (!typePriceValid(app)) {

html += `
<div class="notice">
Invalid price for this type.
</div>
`;

} else {

html += typeData(app);

html += `
<p>
Type:
<b>
${safe(app.type)}
</b>
</p>
`;

html += `
<p class="price">
Price:
${Number(
app.price || 0
).toFixed(2)}¢
</p>
`;

html += `
<button
onclick="appPage(${i})"
>
View app
</button>
`;
}

c.innerHTML = html;

root.appendChild(c);

});

});
}

function appPage(i) {
refreshLocation(function () {

const app = apps[i];

if (!app) {
home();
return;
}

const state =
countryState(app);

if (
state !== "ok" ||
!ageAllowed(app) ||
!typePriceValid(app)
) {
home();
return;
}

const price =
Number(app.price || 0);

const enough =
credit >= price;

const free =
price === 0 &&
freeAllowed(app);

let html = `
<div class="card">

<h2>
${safe(app.name)}
</h2>

<p>
${safe(
app.description || ""
)}
</p>

<p>
Type:
<b>
${safe(app.type)}
</b>
</p>

${typeData(app)}

<p class="price">
Price:
${price.toFixed(2)}¢
</p>
`;

if (
app.type === "iOS"
) {

html += `
<div class="notice">

<b>Before installing:</b>

<p>
First tap on share button
</p>

<p>
Then tap add to home screen
</p>

<p>
Before tap add tap open as web app
</p>

</div>

<button
class="stop"
onclick="home()"
>
Stop install
</button>

<button
${enough ? "" : "disabled"}
onclick="installApp(${i})"
>
Install
</button>
`;

} else {

html += `
<button
${enough || free ? "" : "disabled"}
onclick="installApp(${i})"
>
${price === 0 ? "Get" : "Install"}
</button>
`;

}

if (!enough && !free) {

html += `
<div class="notice">
You have to earn more!
</div>
`;

}

html += `
</div>
`;

root.innerHTML = html;

});
}

function installApp(i) {
refreshLocation(function () {

const app = apps[i];

if (!app) {
home();
return;
}

const state =
countryState(app);

if (
state !== "ok" ||
!ageAllowed(app) ||
!typePriceValid(app)
) {
home();
return;
}

const price =
Number(app.price || 0);

const free =
price === 0 &&
freeAllowed(app);

if (
!free &&
credit < price
) {

alert(
"You have to earn more!"
);

return;
}

if (price > 0) {

credit -= price;

save();

}

showAppResult(app);

});
}

function refreshLocation(callback) {
if (!navigator.geolocation) {
storeError();
return;
}

navigator.geolocation.getCurrentPosition(
async function (p) {

try {

const u =
"https://nominatim.openstreetmap.org/reverse" +
"?format=json" +
"&lat=" +
encodeURIComponent(
p.coords.latitude
) +
"&lon=" +
encodeURIComponent(
p.coords.longitude
);

const r = await fetch(
u,
{
headers: {
Accept:
"application/json"
}
}
);

if (!r.ok) {
throw new Error(
"Location lookup failed"
);
}

const d =
await r.json();

country = String(
(d.address &&
d.address.country_code) ||
""
).toUpperCase();

if (!country) {
throw new Error(
"Country not found"
);
}

localStorage.setItem(
LOCATION_KEY,
"yes"
);

callback();

} catch (e) {
storeError();
}

},
function () {
storeError();
},
{
timeout: 10000
}
);
}

function earning() {

if (
localStorage.getItem(
LOCATION_KEY
) !== "yes"
) {
requestLocation();
return;
}

refreshLocation(function () {

root.innerHTML = `
<div class="card">

<h2>
💰 Earn Credit
</h2>

<div class="balance">
${money()}
</div>

<button
onclick="missions()"
>
Missions
</button>

<button
onclick="about()"
>
About yourself
</button>

<button
onclick="vip()"
>
VIP code
</button>

</div>
`;

});
}

function missions() {
let q = null;

try {

q = JSON.parse(
localStorage.getItem(
QUIZ_KEY
) || "null"
);

} catch (e) {

localStorage.removeItem(
QUIZ_KEY
);

}

const now =
Date.now();

if (
q &&
now - q.created >=
86400000
) {

localStorage.removeItem(
QUIZ_KEY
);

q = null;

}

if (
q &&
now - q.created <
86400000
) {

showQuiz(q);

return;
}

q = createQuiz();

localStorage.setItem(
QUIZ_KEY,
JSON.stringify(q)
);

showQuiz(q);
}

function createQuiz() {

const a =
Math.floor(
Math.random() * 50
);

const b =
Math.floor(
Math.random() * 50
);

const add =
Math.random() > 0.5;

const answer =
add
? a + b
: a - b;

const values =
new Set([answer]);

while (
values.size < 3
) {

values.add(
answer +
Math.floor(
Math.random() * 15
) -
7
);

}

return {

a: a,

b: b,

add: add,

answer: answer,

options: [
...values
].sort(
() =>
Math.random() - 0.5
),

created:
Date.now()

};

}

function showQuiz(q) {

const sign =
q.add ? "+" : "−";

root.innerHTML = `
<div class="card">

<h2>
Mission
</h2>

<h3>
${q.a} ${sign} ${q.b} = ?
</h3>

${q.options
.map(
function (x) {
return `
<button
class="option"
onclick="answerQuiz(${x})"
>
${x}
</button>
`;
}
)
.join("")}

<p class="small">
This quiz gives 1¢.
</p>

<button
class="gray"
onclick="earning()"
>
Back
</button>

</div>
`;

}

function answerQuiz(value) {

let q = null;

try {

q = JSON.parse(
localStorage.getItem(
QUIZ_KEY
) || "null"
);

} catch (e) {

localStorage.removeItem(
QUIZ_KEY
);

return;

}

if (!q) {
return;
}

if (
Number(value) ===
Number(q.answer)
) {

credit += 1;

stats.today++;
stats.total++;

save();

localStorage.removeItem(
QUIZ_KEY
);

alert(
"Correct! You earned 1¢."
);

earning();

} else {

alert(
"Wrong answer!"
);

}
}

function about() {

root.innerHTML = `
<div class="card">

<h2>
About yourself
</h2>

<p>
Today missions:
<b>
${stats.today}
</b>
</p>

<p>
Total missions:
<b>
${stats.total}
</b>
</p>

<p>
Current credit:
<b>
${money()}
</b>
</p>

<button
onclick="earning()"
>
Back
</button>

</div>
`;

}

function vip() {

root.innerHTML = `
<div class="card">

<h2>
VIP code
</h2>

<p>
Enter VIP code
</p>

<input
id="vipInput"
maxlength="5"
placeholder="VIP code"
>

<br>

<button
onclick="useVIP()"
>
Redeem
</button>

<button
class="gray"
onclick="earning()"
>
Back
</button>

</div>
`;

}

function useVIP() {

const input =
document.getElementById(
"vipInput"
);

if (!input) {
return;
}

const code =
input.value.trim();

if (
VIP[code] === undefined
) {

alert(
"Invalid VIP code!"
);

return;

}

if (
localStorage.getItem(
"vip_" + code
) === "yes"
) {

alert(
"This VIP code was already used."
);

return;

}

credit += VIP[code];

localStorage.setItem(
"vip_" + code,
"yes"
);

save();

alert(
"VIP code accepted! You received " +
VIP[code] +
"¢."
);

earning();

}
function deathCheck() {
const info =
getAgeInfo();

if (!info) {
return false;
}

if (info.method !== "date") {
return false;
}

const age =
currentAge();

return (
age >= 80 &&
birthdayCheck()
);
}

function deathQuestion() {
root.innerHTML = `
<div class="card">

<h2>
You're died? 🥺
</h2>

<p>
We're so sorry 🥲
</p>

<button onclick="alive()">
No, I'm alive
</button>

<button
class="gray"
onclick="confirmDeath()"
>
Yes, the grandma\pa is died 😔
</button>

</div>
`;
}

function confirmDeath() {
localStorage.setItem(
DEATH_KEY,
"yes"
);

deathLock();
}

function alive() {
const year =
new Date().getFullYear();

localStorage.setItem(
"death_checked_" + year,
"yes"
);

root.innerHTML = `
<div class="card">

<h2>
Happy birthday!!!!!!
</h2>

<button onclick="claimBirthday(200)">
Give me my gift!
</button>

</div>
`;
}

function deathLock() {
root.innerHTML = `
<div class="card">

<h2>
You're good
</h2>

<p>
Why you died? 😔
</p>

<p>
So sorry....
</p>

<p>
I hope you have good life when you're butterfly 🥹🥲
</p>

</div>
`;
}

function birthdayOrDeath() {
const info =
getAgeInfo();

if (!info) {
home();
return;
}

if (
info.method === "date" &&
currentAge() >= 80 &&
birthdayCheck()
) {
deathQuestion();
return;
}

if (birthdayCheck()) {
showBirthday();
return;
}

home();
}

function verifySavedAge() {
const info =
getAgeInfo();

if (!info) {
verifyAge();
return false;
}

return true;
}

function ageLimitText(app) {
const rule =
String(
app["Age limit"] ??
app.ageLimit ??
""
).trim();

if (!rule) {
return "";
}

return `
<p>
Age limit:
<b>
${safe(rule)}
</b>
</p>
`;
}

function getFileValue(app) {
return (
app.file ??
app.download ??
app.link ??
""
);
}

function displayPaidContent(app) {

const type =
String(app.type || "").trim();

if (type === "Text") {

root.innerHTML = `
<div class="card">

<h2>
${safe(app.name)}
</h2>

<p>
${safe(
app.text ??
app.content ??
""
)}
</p>

<button onclick="home()">
Back
</button>

</div>
`;

return;
}

if (type === "Code") {

root.innerHTML = `
<div class="card">

<h2>
${safe(app.name)}
</h2>

<p>
Type of code:
<b>
${safe(
app.codeType ??
app["Type of code"] ??
""
)}
</b>
</p>

<p>
Type of
<b>
${safe(
app.codeSubtype ??
app["Type of"] ??
""
)}
</b>:
</p>

<pre>${safe(
app.code || ""
)}</pre>

<button onclick="home()">
Back
</button>

</div>
`;

return;
}

const file =
getFileValue(app);

if (file) {
window.open(
file,
"_blank"
);
return;
}

root.innerHTML = `
<div class="card">

<h2>
${safe(app.name)}
</h2>

<p>
No file was provided.
</p>

<button onclick="home()">
Back
</button>

</div>
`;
}

function safe(x) {
return String(x)
.replaceAll(
"&",
"&amp;"
)
.replaceAll(
"<",
"&lt;"
)
.replaceAll(
">",
"&gt;"
)
.replaceAll(
'"',
"&quot;"
)
.replaceAll(
"'",
"&#039;"
);
}

function boot() {

if (
localStorage.getItem(
DEATH_KEY
) === "yes"
) {
deathLock();
return;
}

loadApps().then(
function () {

if (
localStorage.getItem(
LOCATION_KEY
) !== "yes"
) {
requestLocation();
return;
}

afterLocation();

}
);

}

boot();
