(() => {
      "use strict";

      const ROUNDS = 5;
      const STORE_KEY = "tezbos-rekord";

      const $ = id => document.getElementById(id);
      const stage = $("stage"), label = $("label"), big = $("big"), hint = $("hint");
      const chips = [...document.querySelectorAll(".chip")];
      const vLast = $("last"), vAvg = $("avg"), vBest = $("best");

      let state = "idle";   // idle | wait | go | early | result | done
      let times = [];
      let best = 0;
      let waitTimer = null; // setTimeout id
      let tickTimer = null; // setInterval id
      let t0 = 0;           // yashil ekran paydo bo'lgan payt
      let lastInput = 0;

      try { best = Number(localStorage.getItem(STORE_KEY)) || 0; } catch (e) { /* saqlash ishlamasa ham o'yin ishlaydi */ }

      const fmt = n => n ? n + " ms" : "—";

      function view(cls, l, b, h) {
        stage.className = "stage " + cls;
        label.textContent = l;
        big.textContent = b;
        hint.textContent = h;
      }

      function renderStats() {
        chips.forEach((c, i) => {
          c.textContent = i < times.length ? times[i] : "—";
          c.classList.toggle("on", i < times.length);
        });
        const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
        vLast.textContent = fmt(times[times.length - 1]);
        vAvg.textContent = fmt(avg);
        vBest.textContent = fmt(best);
      }

      function rating(avg) {
        if (avg < 200) return "Chaqmoqdek tez!";
        if (avg < 250) return "Juda tez.";
        if (avg < 320) return "Yaxshi natija.";
        if (avg < 400) return "O'rtacha natija.";
        return "Sekinroq. Yana urinib ko'ring.";
      }

      // 1) Urinish boshlanadi: tasodifiy vaqt kutamiz
      function begin() {
        if (times.length >= ROUNDS) times = []; // yangi to'plam
        state = "wait";
        view("wait", "Kuting…", "···", "Ekran yashil bo'lishini kuting. Hali bosmang!");
        renderStats();
        waitTimer = setTimeout(goGreen, 1200 + Math.random() * 3000);
      }

      // 2) Ekran yashil bo'ladi: hisoblagich ishga tushadi
      function goGreen() {
        state = "go";
        t0 = performance.now();
        view("go", "BOS!", "0 ms", "Hozir bosing!");
        tickTimer = setInterval(() => {
          big.textContent = Math.round(performance.now() - t0) + " ms";
        }, 10);
      }

      // 3) Bosildi
      function press() {
        const now = performance.now();
        if (state === "wait") {
          clearTimeout(waitTimer);
          state = "early";
          view("early", "Juda erta!", "—", "Bu urinish hisobga olinmadi. Yana bosing.");
        } else if (state === "go") {
          clearInterval(tickTimer);
          finish(Math.round(now - t0));
        } else {
          begin(); // idle, early, result, done
        }
      }

      function finish(t) {
        times.push(t);
        if (!best || t < best) {
          best = t;
          try { localStorage.setItem(STORE_KEY, String(best)); } catch (e) { /* e'tiborsiz */ }
        }
        renderStats();
        if (times.length < ROUNDS) {
          state = "result";
          view("result", `${times.length}-urinish`, t + " ms", "Keyingisi uchun bosing.");
        } else {
          const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
          state = "done";
          view("done", `${ROUNDS} urinish o'rtachasi`, avg + " ms", rating(avg) + " Qaytadan boshlash uchun bosing.");
        }
      }

      // pointerdown click'dan tezroq ishlaydi, reaksiya vaqti uchun muhim
      stage.addEventListener("pointerdown", e => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        lastInput = performance.now();
        press();
      });
      window.addEventListener("keydown", e => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          lastInput = performance.now();
          press();
        }
      });
      window.addEventListener("keyup", e => { if (e.key === " ") e.preventDefault(); });
      // Ekran o'qish dasturlari yuboradigan click uchun
      stage.addEventListener("click", e => {
        if (e.detail === 0 && performance.now() - lastInput > 600) press();
      });

      renderStats();
    })();