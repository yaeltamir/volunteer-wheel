// מספר וואטסאפ בפורמט בינלאומי (ישראל)
const phoneE164 = "972549024970";

const challenges = [
  { label: "📸 תמונה מההתנדבות" },
  { label: "🧸 חפץ שמתאר את התחושה שלי" },
  { label: "😂 סיפור משעשע מההתנדבות" },
  { label: "🎵 שיר שמתאר את ההתנדבות" },
  { label: "💡 טיפ למבחנים או להתנדבות" }
];

// צבעים עדינים סביב כחול/ורוד
const colors = ["#1f2a5a", "#c50a86", "#283a78", "#e21aa0", "#16204a"];
const textColor = "#ffffff";

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const spinBtn  = document.getElementById("spinBtn");
const waBtn    = document.getElementById("waBtn");
const againBtn = document.getElementById("againBtn");
const resultEl = document.getElementById("result");

// ציור הגלגל
const center = canvas.width / 2;
const radius = center - 18;
const slice = (Math.PI * 2) / challenges.length;

function drawWheel(rotationRad = 0){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // רקע
  ctx.beginPath();
  ctx.arc(center, center, radius+10, 0, Math.PI*2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // פלחים
  for (let i=0; i<challenges.length; i++){
    const start = rotationRad + i*slice;
    const end   = start + slice;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    // טקסט
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + slice/2);

    ctx.textAlign = "right";
    ctx.fillStyle = textColor;
    ctx.font = "bold 34px Arial";

    ctx.fillText(challenges[i].label, radius - 28, 12);

    ctx.restore();
  }

  // טבעת חיצונית
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(31,42,90,.20)";
  ctx.lineWidth = 10;
  ctx.stroke();

  // נקודה פנימית
  ctx.beginPath();
  ctx.arc(center, center, 10, 0, Math.PI*2);
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.fill();
}

// מצב סיבוב
let currentRotation = 0;
let spinning = false;
let chosenLabel = null;

drawWheel(currentRotation);

function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

function pickResultIndex(finalRotation){
  // החץ למעלה: -90°
  const pointerAngle = -Math.PI/2;
  const angle = (((2*Math.PI) - ((finalRotation - pointerAngle) % (2*Math.PI))) % (2*Math.PI));
  return Math.floor(angle / slice) % challenges.length;
}

function spin(){
  if (spinning) return;

  spinning = true;
  spinBtn.disabled = true;
  waBtn.disabled = true;
  againBtn.disabled = true;
  resultEl.textContent = "";

  const extraSpins = 6 + Math.random()*3; // 6-9
  const targetOffset = Math.random() * (2*Math.PI);
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
    } else {
      currentRotation = end % (2*Math.PI);
      const idx = pickResultIndex(currentRotation);
      chosenLabel = challenges[idx].label;

      resultEl.textContent = "🎉 האתגר שלך: " + chosenLabel;
      waBtn.disabled = false;
      againBtn.disabled = false;

      spinning = false;
      spinBtn.disabled = false;
    }
  }

  requestAnimationFrame(frame);
}

function sendWhatsApp(){
  if (!chosenLabel) return;

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
againBtn.addEventListener("click", spin);
