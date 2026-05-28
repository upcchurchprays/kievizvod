// ════════════════════════════════════════════════════════════════
// Молитовник — клієнтська логіка: тема, розмір, шрифт, пошук
// ════════════════════════════════════════════════════════════════

(function(){
  var root = document.documentElement;
  var LS = {
    theme: "molytovnyk-theme",
    size:  "molytovnyk-size",
    font:  "molytovnyk-font"
  };

  // ─── ТЕМА (день / ніч) ──────────────────────────────────────
  function setTheme(t){
    root.dataset.theme = t;
    localStorage.setItem(LS.theme, t);
  }
  function toggleTheme(){
    setTheme(root.dataset.theme === "day" ? "night" : "day");
  }
  document.querySelectorAll("#theme-toggle, #theme-toggle-2").forEach(function(b){
    b.addEventListener("click", toggleTheme);
  });

  // ─── РОЗМІР ШРИФТА ──────────────────────────────────────────
  var size = parseInt(localStorage.getItem(LS.size) || "22", 10);
  function applySize(){
    root.style.setProperty("--reader-size", size + "px");
    localStorage.setItem(LS.size, size);
  }
  applySize();
  var inc = document.getElementById("font-inc");
  var dec = document.getElementById("font-dec");
  if (inc) inc.addEventListener("click", function(){ size = Math.min(36, size + 2); applySize(); });
  if (dec) dec.addEventListener("click", function(){ size = Math.max(14, size - 2); applySize(); });

  // ─── ВИБІР ШРИФТА ───────────────────────────────────────────
  function setFont(f){
    root.dataset.font = f;
    localStorage.setItem(LS.font, f);
    document.querySelectorAll("[data-font]").forEach(function(b){
      b.classList.toggle("on", b.dataset.font === f);
    });
  }
  setFont(localStorage.getItem(LS.font) || "old");
  document.querySelectorAll("[data-font]").forEach(function(b){
    b.addEventListener("click", function(){ setFont(b.dataset.font); });
  });

  // ─── ПОШУК у списку молитов ─────────────────────────────────
  var search = document.getElementById("prayer-search");
  if (search) {
    search.addEventListener("input", function(){
      var q = search.value.trim().toLowerCase();
      document.querySelectorAll(".prayer-index li").forEach(function(li){
        var t = li.textContent.toLowerCase();
        li.style.display = (!q || t.indexOf(q) !== -1) ? "" : "none";
      });
    });
  }

  // ─── НАВІГАЦІЯ КЛАВІАТУРОЮ у читанні (← / →) ────────────────
  document.addEventListener("keydown", function(e){
    if (e.key === "ArrowLeft") {
      var p = document.querySelector(".reader-nav .nav-btn:not(.right)");
      if (p && p.href) location.href = p.href;
    }
    if (e.key === "ArrowRight") {
      var n = document.querySelector(".reader-nav .nav-btn.right");
      if (n && n.href) location.href = n.href;
    }
  });
})();
