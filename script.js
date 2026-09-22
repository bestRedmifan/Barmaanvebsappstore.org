"use strict";
const root = document.getElementById("root");
const CREDIT_KEY = "barmaan_credit";
const QUIZ_KEY = "barmaan_quiz";
const STATS_KEY = "barmaan_stats";
const LOCATION_KEY = "barmaan_location_allowed";
let apps = [];
let country = null;
let credit = Number(localStorage.getItem(CREDIT_KEY) || 0);
let stats;
try {
stats = JSON.parse(
localStorage.getItem(STATS_KEY) || '{"today":0,"total":0}'
);
} catch (e) {
stats = { today: 0, total: 0 };
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
localStorage.setItem(CREDIT_KEY, String(credit));
localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}
function money() {
return credit.toFixed(2) + "¢";
}
async function loadApps() {
try {
const r = await fetch("posts.json", { cache: "no-store" });
if (!r.ok) {
throw new Error("posts.json could not be loaded");
}
const data = await r.json();
if (!Array.isArray(data)) {
throw new Error("posts.json must contain an array");
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
<button onclick="getLocation()">Allow location</button>
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
encodeURIComponent(p.coords.latitude) +
"&lon=" +
encodeURIComponent(p.coords.longitude);
const r = await fetch(u, {
headers: {
Accept: "application/json"
}
});
if (!r.ok) {
throw new Error("Location lookup failed");
}
const d = await r.json();
country = String(
(d.address && d.address.country_code) || ""
).toUpperCase();
if (!country) {
throw new Error("Country not found");
}
localStorage.setItem(LOCATION_KEY, "yes");
home();
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
function storeError() {
root.innerHTML = `
<div class="error">
<h2>This app store isn't available in your country</h2>
<p>If you're traveling try again later</p>
</div>
`;
}
function regionBlocked(app) {
const blocked = app.regionBlocked;
return (
Array.isArray(blocked) &&
blocked.includes(country)
);
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
encodeURIComponent(p.coords.latitude) +
"&lon=" +
encodeURIComponent(p.coords.longitude);
const r = await fetch(u, {
headers: {
Accept: "application/json"
}
});
if (!r.ok) {
throw new Error("Location lookup failed");
}
const d = await r.json();
country = String(
(d.address && d.address.country_code) || ""
).toUpperCase();
if (!country) {
throw new Error("Country not found");
}
localStorage.setItem(LOCATION_KEY, "yes");
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
function home() {
if (localStorage.getItem(LOCATION_KEY) !== "yes") {
requestLocation();
return;
}
refreshLocation(function () {
if (!apps.length) {
loadApps().then(function () {
if (apps.length) {
home();
}
});
return;
}
root.innerHTML = "<h2>Available apps</h2>";
apps.forEach(function (app, i) {
const c = document.createElement("div");
c.className = "card";
let html = '<div class="app-icon">📦</div>';
html += `<h2>${safe(app.name)}</h2>`;
html += `
<p>
${safe(app.description || "")}
</p>
`;
if (app.blocked === true) {
html += `
<div class="blocked">
<b>
This app is a bad app or various app we want to your device stay safe
</b>
<p>
این برنامه برنامه بد یا ویروسی یا بد افزار بوده ما می‌خواهیم دستگاه شما سالم بماند
</p>
</div>
`;
} else if (regionBlocked(app)) {
html += `
<div class="notice">
This app isn't available in your region.
</div>
`;
} else {
html += `
<p>
Type: <b>${safe(app.type)}</b>
</p>
`;
html += `
<p class="price">
Price: ${Number(app.price || 0).toFixed(2)}¢
</p>
`;
html += `
<button onclick="appPage(${i})">
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
if (!app || app.blocked === true || regionBlocked(app)) {
home();
return;
}
const price = Number(app.price || 0);
let html = `
<div class="card">
<h2>${safe(app.name)}</h2>
<p>
${safe(app.description || "")}
</p>
<p>
Type: <b>${safe(app.type)}</b>
</p>
<p class="price">
Price: ${price.toFixed(2)}¢
</p>
`;
if (app.type === "iOS") {
html += `
<div class="notice">
<b>Before installing:</b>
<p>First tap on share button</p>
<p>Then tap add to home screen</p>
<p>Before tap add tap open as web app</p>
</div>
<button class="stop" onclick="home()">
Stop install
</button>
<button onclick="installApp(${i})">
Install
</button>
`;
} else {
const enough = credit >= price;
html += `
<button
${enough ? "" : "disabled"}
onclick="installApp(${i})"
>
Install
</button>
`;
if (!enough) {
html += `
<div class="notice">
You have to earn more!
</div>
`;
}
}
html += "</div>";
root.innerHTML = html;
});
}
function installApp(i) {
refreshLocation(function () {
const app = apps[i];
if (!app || app.blocked === true || regionBlocked(app)) {
home();
return;
}
const price = Number(app.price || 0);
if (app.type !== "iOS" && credit < price) {
alert("You have to earn more!");
return;
}
if (app.type !== "iOS") {
credit -= price;
save();
}
if (app.type === "Android" || app.type === "EXE") {
if (app.download) {
window.open(app.download, "_blank");
}
}
if (app.type === "iOS" || app.type === "PWA") {
if (app.link) {
window.open(app.link, "_blank");
}
}
});
}
function earning() {
if (localStorage.getItem(LOCATION_KEY) !== "yes") {
requestLocation();
return;
}
refreshLocation(function () {
root.innerHTML = `
<div class="card">
<h2>💰 Earn Credit</h2>
<div class="balance">
${money()}
</div>
<button onclick="missions()">
Missions
</button>
<button onclick="about()">
About yourself
</button>
<button onclick="vip()">
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
localStorage.getItem(QUIZ_KEY) || "null"
);
} catch (e) {
localStorage.removeItem(QUIZ_KEY);
}
const now = Date.now();
if (q && now - q.created >= 86400000) {
localStorage.removeItem(QUIZ_KEY);
q = null;
}
if (q && now - q.created < 86400000) {
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
const a = Math.floor(Math.random() * 50);
const b = Math.floor(Math.random() * 50);
const add = Math.random() > 0.5;
const answer = add
? a + b
: a - b;
const values = new Set([answer]);
while (values.size < 3) {
values.add(
answer +
Math.floor(Math.random() * 15) -
7
);
}
return {
a: a,
b: b,
add: add,
answer: answer,
options: [...values].sort(
() => Math.random() - 0.5
),
created: Date.now()
};
}
function showQuiz(q) {
const sign = q.add ? "+" : "−";
root.innerHTML = `
<div class="card">
<h2>Mission</h2>
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
localStorage.getItem(QUIZ_KEY) || "null"
);
} catch (e) {
localStorage.removeItem(QUIZ_KEY);
return;
}
if (!q) {
return;
}
if (Number(value) === Number(q.answer)) {
credit += 1;
stats.today++;
stats.total++;
save();
localStorage.removeItem(QUIZ_KEY);
alert("Correct! You earned 1¢.");
earning();
} else {
alert("Wrong answer!");
}
}
function about() {
root.innerHTML = `
<div class="card">
<h2>About yourself</h2>
<p>
Today missions:
<b>${stats.today}</b>
</p>
<p>
Total missions:
<b>${stats.total}</b>
</p>
<p>
Current credit:
<b>${money()}</b>
</p>
<button onclick="earning()">
Back
</button>
</div>
`;
}
function vip() {
root.innerHTML = `
<div class="card">
<h2>VIP code</h2>
<p>Enter VIP code</p>
<input
id="vipInput"
maxlength="5"
placeholder="VIP code"
>
<br>
<button onclick="useVIP()">
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
const input = document.getElementById("vipInput");
if (!input) {
return;
}
const code = input.value.trim();
if (VIP[code] === undefined) {
alert("Invalid VIP code!");
return;
}
if (localStorage.getItem("vip_" + code) === "yes") {
alert("This VIP code was already used.");
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
function safe(x) {
return String(x)
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");
}
loadApps().then(function () {
if (
localStorage.getItem(LOCATION_KEY) === "yes"
) {
home();
} else {
requestLocation();
}
});
