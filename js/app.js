const phoneE164 = "972549024970";

const challenges = [
  { icon: "📸", text: "תמונה מההתנדבות" },
  { icon: "🧸", text: "חפץ שמתאר את מצבך במבחנים" },
  { icon: "😂", text: "סיפור משעשע מההתנדבות" },
  { icon: "🎵", text: "שיר שמתאר את ההתנדבות" },
  { icon: "💡", text: "טיפ למבחנים / התנדבות" }
];

const weights = [10, 1, 2, 3, 1];

// צבעים פסטליים (בהירים)
const colors = ["#ffd9c2", "#ffc2c2", "#e3c2c3", "#d8c7fa", "#c2cdff"];
const stroke = "rgba(31,42,90,.10)";
const textColor = "#1f2a5a"; // כחול לוגו

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const confCanvas = document.getElementById("confetti");
const confCtx = confCanvas.getContext("2d");

const spinBtn  = document.getElementById("spinBtn");
const waBtn    = document.getElementById("waBtn");
const formBtn = document.getElementById("formBtn");
const resultEl = document.getElementById("result");

const center = canvas.width / 2;
const radius = center - 22;
const slice = (Math.PI * 2) / challenges.length;

const FORM_BASE_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSc5GmXFJgC0RE5bJWibs-0ga1D5IfkufvZOP8pVzEQDzOUIlw/viewform";

const ENTRY_RESULT = "entry.1193308041";


let currentRotation = 0;
let spinning = false;
let chosenIndex = null;


// ---------- ציור גלגל ----------
function drawWheel(rotationRad = 0){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // רקע
  ctx.beginPath();
  ctx.arc(center, center, radius+16, 0, Math.PI*2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // פלחים
  for (let i=0; i<challenges.length; i++){
    const start = rotationRad + i*slice;
    const end   = start + slice;

    // פלח
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    // קו מפריד דק
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 6;
    ctx.stroke();

    // ----- טקסט ואייקון: בלי סיבוב, תמיד ישר -----
    const mid = start + slice/2;

    // נקודת מרכז הפלח (כמה פנימה כדי לא להתנגש בשפה)
    const rText = radius * 0.68;
    const x = center + Math.cos(mid) * rText;
    const y = center + Math.sin(mid) * rText;

    // אייקון למעלה
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor;

    ctx.font = '32px "Heebo", sans-serif';
    ctx.fillText(challenges[i].icon, x, y - 16);

    // טקסט מתחת
    ctx.font = '800 20px "Heebo", sans-serif';
    ctx.fillText(challenges[i].text, x, y + 18);
  }

  // טבעת חיצונית
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(31,42,90,.18)";
  ctx.lineWidth = 10;
  ctx.stroke();
}

// לצייר רק אחרי שהפונט נטען (כדי שהטקסט בגלגל יהיה באותו פונט)
(async function init(){
  try{
    if (document.fonts && document.fonts.load) {
      await document.fonts.load('800 20px "Heebo"');
      await document.fonts.load('32px "Heebo"');
    }
  } catch (e) {
    // אם לא נטען – נמשיך עם fallback
  }
  drawWheel(currentRotation);
})();

function pickWeightedIndex(ws){
  const total = ws.reduce((a,b)=>a+b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < ws.length; i++){
    r -= ws[i];
    if (r <= 0) return i;
  }
  return ws.length - 1;
}

function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

function pickResultIndex(finalRotation){
  // החץ למעלה: -90°
  const pointerAngle = -Math.PI/2;
  const angle = (((2*Math.PI) - ((finalRotation - pointerAngle) % (2*Math.PI))) % (2*Math.PI));
  return Math.floor(angle / slice) % challenges.length;
}

// ---------- קונפטי ----------
function launchConfetti(){
  const el = confCanvas;
  el.style.opacity = "1";

  const W = confCanvas.width, H = confCanvas.height;
  const pieces = Array.from({length: 90}, () => ({
    x: W/2 + (Math.random()*120 - 60),
    y: H/2 + (Math.random()*40 - 20),
    vx: Math.random()*10 - 5,
    vy: Math.random()*-10 - 6,
    g: 0.35 + Math.random()*0.15,
    r: 3 + Math.random()*4,
    a: 1,
    c: ["#c50a86","#1f2a5a","#ffbfe6","#dbeafe","#ede9fe"][Math.floor(Math.random()*5)]
  }));

  const start = performance.now();
  const dur = 900;

  function frame(now){
    const t = Math.min(1, (now-start)/dur);
    confCtx.clearRect(0,0,W,H);

    pieces.forEach(p=>{
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.a = 1 - t;

      confCtx.globalAlpha = Math.max(0, p.a);
      confCtx.beginPath();
      confCtx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      confCtx.fillStyle = p.c;
      confCtx.fill();
    });

    confCtx.globalAlpha = 1;

    if (t < 1){
      requestAnimationFrame(frame);
    } else {
      confCtx.clearRect(0,0,W,H);
      el.style.opacity = "0";
    }
  }

  requestAnimationFrame(frame);
}

// ---------- סיבוב ----------
function spin(){
  if (spinning) return;

  spinning = true;
  spinBtn.disabled = true;
  waBtn.disabled = true;
  formBtn.disabled = true;
  resultEl.textContent = "";

  const extraSpins = 6 + Math.random()*3;
  // ✅ בוחרים מראש לאיזה פלח נרצה להגיע (בהטיה)
  const desiredIndex = pickWeightedIndex(weights);

  // מחשבים את הזווית המדויקת שתגרום למחט לבחור את desiredIndex
  const pointerAngle = -Math.PI / 2;
  const a = (desiredIndex + 0.5) * slice;                // אמצע הפלח
  const desiredMod = (pointerAngle + 2*Math.PI - a + 2*Math.PI) % (2*Math.PI);

  // offset שיביא אותנו בדיוק ל-desiredMod בסוף הסיבוב
  const targetOffset = (desiredMod - (currentRotation % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);

  const start = currentRotation;
  const end = currentRotation + extraSpins*(2*Math.PI) + targetOffset;

  const duration = 2200;
  const startTime = performance.now();

  function frame(now){
    const t = Math.min(1, (now - startTime)/duration);
    const eased = easeOutCubic(t);
    const rot = start + (end - start)*eased;

    drawWheel(rot);

    if (t < 1){
      requestAnimationFrame(frame);
    }
    else {
      currentRotation = end % (2*Math.PI);
      chosenIndex = pickResultIndex(currentRotation);

      const chosen = challenges[chosenIndex];
      const chosenLabel = `${chosen.text} ${chosen.icon}`; // ✅ אין יותר undefined


      resultEl.innerHTML = `
         האתגר שלך: 🎉 <br>
        <span class="result-value">${chosenLabel}</span>
      `;

      // resultEl.textContent = `🎉 האתגר שלך: <br> ${chosenLabel}`;
      waBtn.disabled = false;
      formBtn.disabled = false;

      launchConfetti();

      spinning = false;
      spinBtn.disabled = false;
    }
  }

  requestAnimationFrame(frame);
}

function openForm(){
  if (chosenIndex === null) return;

  const chosen = challenges[chosenIndex];
  const chosenLabel = `${chosen.icon} ${chosen.text}`;

  const url =
    `${FORM_BASE_URL}?usp=pp_url&${ENTRY_RESULT}=` +
    encodeURIComponent(chosenLabel);

  window.open(url, "_blank");
}

formBtn.addEventListener("click", openForm);


function sendWhatsApp(){
  if (chosenIndex === null) return;

  const chosen = challenges[chosenIndex];
  const chosenLabel = `${chosen.icon} ${chosen.text}`;

  const message =
`היי! התנדבתי בתקופת מבחנים 🙌
סובבתי את גלגל האתגרים ויצא לי:
${chosenLabel}

הנה התוצר שלי:`;

  const url = "https://wa.me/" + phoneE164 + "?text=" + encodeURIComponent(message);
  window.open(url, "_blank");
}

spinBtn.addEventListener("click", spin);
waBtn.addEventListener("click", sendWhatsApp);
