/* ===========================================================
   IMT & PEMFC Lab — shared header/footer + nav behavior
   Every page includes this after <div id="site-header"></div>
   and <div id="site-footer"></div>, plus <body data-page="..." data-base="...">
   =========================================================== */
(function () {
  var NAV = [
    { id: "home", label: "Home", href: "index.html" },
    {
      id: "member", label: "Member", href: "member/index.html",
      children: [
        { id: "professor", label: "Professor", href: "member/professor.html" },
        { id: "research-professor", label: "Research Professor", href: "member/research-professor.html" },
        { id: "postdoctoral-fellow", label: "Postdoctoral Fellow", href: "member/postdoctoral-fellow.html" },
        { id: "phd-candidate", label: "Ph.D Candidate", href: "member/phd-candidate.html" },
        { id: "master-student", label: "Master Student", href: "member/master-student.html" },
        { id: "undergraduate-student", label: "Undergraduate Student", href: "member/undergraduate-student.html" },
        { id: "alumni", label: "Alumni", href: "member/alumni.html" }
      ]
    },
    { id: "research", label: "Research", href: "research/index.html" },
    {
      id: "publication", label: "Publication", href: "publication/index.html",
      children: [
        { id: "paper", label: "Paper", href: "publication/paper.html" },
        { id: "patent", label: "Patent", href: "publication/patent.html" },
        { id: "conference", label: "Conference", href: "publication/conference.html" }
      ]
    },
    { id: "achievement", label: "Achievement", href: "achievement/index.html" },
    { id: "event", label: "Event", href: "event/index.html" },
    { id: "benefit", label: "Benefit", href: "benefit/index.html" },
    { id: "contact", label: "Contact", href: "contact/index.html" }
  ];

  var base = document.body.getAttribute("data-base") || "";
  var currentPage = document.body.getAttribute("data-page") || "";

  function chevSvg() {
    return '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';
  }

  function renderNavItem(item) {
    var isActive = item.id === currentPage;
    if (!item.children) {
      return (
        '<div class="nav-item' + (isActive ? " active" : "") + '">' +
          '<a class="nav-link" href="' + base + item.href + '">' + item.label + "</a>" +
        "</div>"
      );
    }
    var subLinks = item.children
      .map(function (child) {
        var childActive = child.id === currentPage;
        return '<a href="' + base + child.href + '"' + (childActive ? ' class="active"' : "") + ">" + child.label + "</a>";
      })
      .join("");
    return (
      '<div class="nav-item' + (isActive ? " active" : "") + '">' +
        '<button class="nav-link" type="button" aria-expanded="false">' + item.label + chevSvg() + "</button>" +
        '<div class="dropdown">' + subLinks + "</div>" +
      "</div>"
    );
  }

  function renderHeader() {
    var html =
      '<div class="nav-row">' +
        '<a class="wordmark" href="' + base + 'index.html">' +
          '<span class="mark">IMT <span>&amp;</span> PEMFC</span>' +
          '<span class="full">Kongju National University</span>' +
        "</a>" +
        '<nav class="links">' + NAV.map(renderNavItem).join("") + "</nav>" +
        '<button class="nav-toggle" type="button" aria-label="Toggle menu">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>' +
        "</button>" +
      "</div>";
    var header = document.createElement("header");
    header.className = "site-nav";
    header.innerHTML = html;

    var mount = document.getElementById("site-header");
    if (mount) mount.replaceWith(header);

    header.querySelectorAll(".nav-item").forEach(function (item) {
      var trigger = item.querySelector("button.nav-link");
      if (!trigger) return;
      trigger.addEventListener("click", function () {
        var willOpen = !item.classList.contains("open");
        header.querySelectorAll(".nav-item.open").forEach(function (o) { o.classList.remove("open"); });
        if (willOpen) item.classList.add("open");
        trigger.setAttribute("aria-expanded", String(willOpen));
      });
    });
    document.addEventListener("click", function (e) {
      if (!header.contains(e.target)) {
        header.querySelectorAll(".nav-item.open").forEach(function (o) { o.classList.remove("open"); });
      }
    });

    var toggle = header.querySelector(".nav-toggle");
    toggle.addEventListener("click", function () {
      header.classList.toggle("mobile-open");
    });
  }

  function renderFooter() {
    var html =
      '<div class="footer-row">' +
        '<div class="foot-text">' +
          "<b>Intelligent Manufacturing Technology &amp; PEMFC Laboratory</b><br/>" +
          "Director: Prof. Hyun-Chul Kim &middot; Future &amp; Automotive Engineering Department<br/>" +
          "Cheonan-daero 1223-24, Seobuk-gu, Cheonan-si, Chungcheongnam-do, 31080 &middot; Tel. 041-521-9273" +
        "</div>" +
        '<div class="foot-mark">&copy; 2026 KONGJU NATIONAL UNIVERSITY</div>' +
      "</div>";
    var footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = html;
    var mount = document.getElementById("site-footer");
    if (mount) mount.replaceWith(footer);
  }

  function initCarousels() {
    document.querySelectorAll(".carousel").forEach(function (carousel) {
      var track = carousel.querySelector(".carousel-track");
      var nav = carousel.querySelector(".carousel-nav");
      if (!track || !nav) return;
      var slides = track.children.length;
      nav.innerHTML = "";
      for (var i = 0; i < slides; i++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Slide " + (i + 1));
        if (i === 0) dot.className = "active";
        (function (index) {
          dot.addEventListener("click", function () {
            track.scrollTo({ left: track.clientWidth * index, behavior: "smooth" });
          });
        })(i);
        nav.appendChild(dot);
      }
      track.addEventListener("scroll", function () {
        var index = Math.round(track.scrollLeft / track.clientWidth);
        nav.querySelectorAll("button").forEach(function (dot, i) {
          dot.classList.toggle("active", i === index);
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderHeader();
    renderFooter();
    initCarousels();
  });
})();
