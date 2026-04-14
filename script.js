let chart;
let showAll = false;
let isTyping = false;
let typingTimer;
const emiEl = document.getElementById("emi");
const toast = document.getElementById("toast");

const isTenLakhPage = window.location.pathname.includes("ten-lakh");
const isFiveLakhPage = window.location.pathname.includes("five-lakh");

const loanSlider = document.getElementById("loan");
const loanValue = document.getElementById("loanValue");
const rateSlider = document.getElementById("rate");
const yearsSlider = document.getElementById("years");

function trackCTA(name) {
  gtag('event', 'cta_click', {
    event_category: 'engagement',
    event_label: name
  });
}

function setSlidersDisabled(disabled) {
  if (rateSlider) rateSlider.disabled = disabled;
  if (yearsSlider) yearsSlider.disabled = disabled;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function formatIndianNumber(value) {
  if (!value) return "";

  let num = value.replace(/,/g, "");

  if (isNaN(num)) return "";

  return Number(num).toLocaleString("en-IN");
}

function validateLoanInput(num) {
  if (!num || num < 50000) {
    loanValue.classList.add("error");
    setSlidersDisabled(true);
    return false;
  }

  loanValue.classList.remove("error");
  setSlidersDisabled(false);
  return true;
}

loanValue.addEventListener("focus", () => {
  isTyping = true;
});

loanValue.addEventListener("blur", () => {
  isTyping = false;
});

// INPUT → SLIDER
const errorText = document.getElementById("loanError");
loanValue.addEventListener("input", (e) => {
  clearTimeout(typingTimer);

  let input = e.target;

  // remove commas
  let raw = input.value.replace(/,/g, "");

  // allow only numbers
  if (!/^\d*$/.test(raw)) return;

  // save cursor
  let cursorPos = input.selectionStart;

  // format value
  let formatted = formatIndianNumber(raw);
  input.value = formatted;

  // restore cursor
  let diff = formatted.length - raw.length;
  input.setSelectionRange(cursorPos + diff, cursorPos + diff);

  if (raw === "") {
    loanValue.classList.remove("error");
    setSlidersDisabled(true);
    return;
  }

  let num = parseInt(raw, 10);

  typingTimer = setTimeout(() => {

    if (!validateLoanInput(num)) {
      loanValue.classList.add("error");
      showToast("Minimum value must be ₹50,000");
      return;
    }

    // ✅ VALID
    loanValue.classList.remove("error");

    loanSlider.value = num;

    calculateEMI();

  }, 300);
});

loanValue.addEventListener("change", () => {
  const rawValue = loanValue.value.replace(/,/g, "");
  let val = parseInt(rawValue, 10);

  if (!val || val < 50000) {
    loanValue.classList.add("error");
    setSlidersDisabled(true);
    return;
  }

  setSlidersDisabled(false);

  if (val > loanSlider.max) {
    val = loanSlider.max;
  }

  loanValue.value = formatIndianNumber(String(val));
  loanSlider.value = val;

  calculateEMI();
});

if (isTenLakhPage) {
  if (loanSlider) loanSlider.value = 1000000;
  loanValue.innerText = "₹10,00,000";
}

if (isFiveLakhPage) {
  if (loanSlider) loanSlider.value = 500000;
  loanValue.innerText = "₹5,00,000";
}

if (loanSlider && !isTenLakhPage && !isFiveLakhPage) {
  /*loanSlider.addEventListener("input", () => {
    const val = parseInt(loanSlider.value);

    loanValue.value = val;

    // FULL RESET
    loanValue.classList.remove("error");

    calculateEMI();
  }); */

  loanSlider.addEventListener("input", () => {
    const val = parseInt(loanSlider.value);

    loanValue.value = formatIndianNumber(String(val));

    loanValue.classList.remove("error");

    calculateEMI();
  });
}


function formatCurrency(num, type = "ui") {
  const value = Math.round(num).toLocaleString("en-IN");

  if (type === "pdf") {
    return "INR " + value;
  }

  return "₹" + value;
}

function animateEMI(value) {
  emiEl.style.transform = "scale(1.05)";
  setTimeout(() => {
    emiEl.style.transform = "scale(1)";
  }, 150);
}

function downloadPDF() {
  try {
    let P = Number(document.getElementById("loan").value);
    let annualRate = Number(document.getElementById("rate").value);
    let years = Number(document.getElementById("years").value);

    let r = annualRate / 12 / 100;
    let n = years * 12;

    let emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    emi = Math.round(emi);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.text("Amortization Details (Month-wise)", pageWidth / 2, 15, { align: "center" });

    // Info
    doc.setFontSize(10);
    doc.text(
      `Loan: ${formatCurrency(P, "pdf")} | Rate: ${annualRate}% p.a. | Tenure: ${years} years | Monthly EMI: ${formatCurrency(emi, "pdf")}`,
      pageWidth / 2,
      22,
      { align: "center" }
    );

    // Table data
    let balance = P;
    const today = new Date();
    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth() + 1;

    const tableData = [];

    for (let i = 0; i < n; i++) {
      let date = new Date(currentYear, currentMonth + i);

      let interest = Math.round(balance * r);
      let principal = Math.round(emi - interest);
      balance = Math.round(balance - principal);
      if (i === n - 1) balance = 0;

      tableData.push([
        date.toLocaleString("default", { month: "short", year: "numeric" }),
        emi.toLocaleString("en-IN"),
        principal.toLocaleString("en-IN"),
        interest.toLocaleString("en-IN"),
        balance.toLocaleString("en-IN"),
      ]);
    }

    // AutoTable
    doc.autoTable({
      startY: 28,
      head: [["Month", "EMI", "Principal", "Interest", "Balance"]],
      body: tableData,

      styles: {
        fontSize: 8,
        cellPadding: { right: 6, left: 4 }

      },

      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 0,
        //halign: "center",
      },

      bodyStyles: {
        textColor: 0,
      },

      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },

      styles: {
        fontSize: 9,
        cellPadding: { top: 2, right: 4, bottom: 2, left: 4 },
      },

      columnStyles: {
        0: { halign: "left" },   // Month
        1: { halign: "right" },  // EMI
        2: { halign: "right" },  // Principal
        3: { halign: "right" },  // Interest
        4: { halign: "right" },  // Balance
      },

      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 0,
        halign: "center",
        fontStyle: "bold"
      },

      didParseCell: function (data) {
        if (data.section === "head") {
          if (data.column.index === 0) {
            data.cell.styles.halign = "left";
          } else {
            data.cell.styles.halign = "right";
          }
        }
      },

      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });


    doc.save("emi-amortization-report.pdf");
  } catch (error) {
    console.error(error);
    alert("Error generating PDF");
  }
}

function generateYearlyTable(P, r, n, emi) {
  let balance = P;
  showAll = false;

  const container = document.getElementById("yearContainer");
  const btn = document.getElementById("toggleYearsBtn");
  btn.textContent = "Show More";

  container.innerHTML = "";

  const today = new Date();
  const startYear = today.getFullYear();
  const startMonth = today.getMonth() + 1; // Start from next month

  let totalMonths = n;
  let monthCount = 0;

  // Calculate total years needed including partial first and last year
  let totalYears = Math.ceil((startMonth + n) / 12);


  for (let y = 0; y < totalYears; y++) {

    const year = startYear + y;

    const yearBlock = document.createElement("div");
    yearBlock.className = "year-block";

    const header = document.createElement("div");
    header.className = "year-header";
    header.innerHTML = `<span>📅 ${year}</span><span>▼</span>`;

    const content = document.createElement("div");
    content.className = "year-content";

    let table = `
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>EMI</th>
            <th>Principal</th>
            <th>Interest</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Calculate the correct start and end months for this year
    let startMonthForYear = (y === 0) ? startMonth : 0;
    let endMonthForYear = 12;

    // For the last year, only show months until the loan ends
    if (y === totalYears - 1) {
      endMonthForYear = ((n - 1) % 12) + 1;
    }

    for (let m = startMonthForYear; m < endMonthForYear; m++) {

      if (monthCount >= totalMonths) break;

      let interest = Math.round(balance * r);
      let principal = Math.round(emi - interest);
      balance = Math.round(balance - principal);


      if (monthCount === totalMonths - 1) balance = 0; // Last month balance should be 0

      table += `
        <tr>
          <td>${new Date(year, m).toLocaleString('default', { month: 'short' })}</td>
          <td>${formatCurrency(emi, "ui")}</td>
          <td>${formatCurrency(principal, "ui")}</td>
          <td>${formatCurrency(interest, "ui")}</td>
          <td>${formatCurrency(Math.abs(balance), "ui")}</td>
        </tr>
      `;

      monthCount++;
    }

    table += `</tbody></table>`;
    content.innerHTML = table;

    // Toggle per year
    header.onclick = () => {
      content.style.display =
        content.style.display === "block" ? "none" : "block";
    };

    //collapse all years
    content.style.display = "none";

    // Hide after 5 years
    if (y >= 5) yearBlock.style.display = "none";

    yearBlock.appendChild(header);
    yearBlock.appendChild(content);
    container.appendChild(yearBlock);
  }

  document.querySelectorAll(".year-block").forEach((block, index) => {
    if (index >= 3) {
      block.style.display = "none";
    }
  });

  // Show button only if >5 years
  if (totalYears > 5) {
    btn.style.display = "block";

    /*btn.onclick = () => {
      showAll = !showAll;

      document.querySelectorAll(".year-block").forEach((block, index) => {
        if (index >= 5) {
          block.style.display = showAll ? "block" : "none";
        }
      });

      btn.innerText = showAll ? "Show Less" : "Show More";
    };*/
    btn.onclick = () => {
      showAll = !showAll;

      const blocks = document.querySelectorAll(".year-block");

      blocks.forEach((block, index) => {
        if (index >= 3) {
          block.style.display = showAll ? "block" : "none";
        }
      });

      btn.textContent = showAll ? "Show Less" : "Show More";
    };
  } else {
    btn.style.display = "none";
  }
}

function generatePDFTable(P, r, n, emi) {
  let balance = P;
  let table = `
    <table style="width:100%; border-collapse: collapse; font-size: 9px; line-height: 1.2;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th style="border: 1px solid #ddd; padding: 4px; text-align: center;">Month</th>
          <th style="border: 1px solid #ddd; padding: 4px; text-align: center;">EMI</th>
          <th style="border: 1px solid #ddd; padding: 4px; text-align: center;">Principal</th>
          <th style="border: 1px solid #ddd; padding: 4px; text-align: center;">Interest</th>
          <th style="border: 1px solid #ddd; padding: 4px; text-align: center;">Balance</th>
        </tr>
      </thead>
      <tbody>
  `;

  const today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth() + 1;

  let monthCount = 0;

  for (let i = 0; i < n; i++) {

    let date = new Date(currentYear, currentMonth + i);

    let interest = Math.round(balance * r);
    let principal = Math.round(emi - interest);
    balance = Math.round(balance - principal);
    if (i === n - 1) balance = 0; // fix last row

    table += `
      <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
        <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${date.toLocaleString('default', { month: 'short', year: 'numeric' })}</td>
        <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(emi, "pdf")}</td>
        <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(principal, "pdf")}</td>
        <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(interest, "pdf")}</td>
        <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(balance, "pdf")}</td>
      </tr>
    `;
  }

  table += "</tbody></table>";

  document.getElementById("pdfTable").innerHTML = table;
}
function calculateEMI() {
  let raw = loanValue.value.replace(/,/g, "");
  let currentVal = parseInt(raw);

  // 🔥 re-validate on every calculation
  validateLoanInput(currentVal);

  let P = Number(document.getElementById("loan").value);
  let annualRate = Number(document.getElementById("rate").value);
  let years = Number(document.getElementById("years").value);

  let r = annualRate / 12 / 100;
  let n = years * 12;

  let emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  let totalPayment = emi * n;
  let totalInterest = totalPayment - P;

  document.getElementById("emi").innerText = formatCurrency(Math.round(emi));
  document.getElementById("rateValue").innerText = annualRate + "%";
  document.getElementById("yearsValue").innerText = years;
  /*document.getElementById("loanValue").innerText = formatCurrency(P);*/
  if (!isTyping && loanValue.value !== "") {
    loanValue.value = formatIndianNumber(String(P));
  }

  document.getElementById("principalValue").innerText = formatCurrency(P);
  document.getElementById("interestValue").innerText = formatCurrency(Math.round(totalInterest));
  document.getElementById("emiValue").innerText = formatCurrency(Math.round(emi));
  document.getElementById("totalPaymentValue").innerText = formatCurrency(Math.round(totalPayment));

  updateChart(P, totalInterest);

  animateEMI(emi);
  generateYearlyTable(P, r, n, emi);

  function updateSliderFill(slider) {
    const min = slider.min;
    const max = slider.max;
    const val = slider.value;

    const percent = ((val - min) / (max - min)) * 100;

    slider.style.background =
      `linear-gradient(to right, #22d3ee ${percent}%, #334155 ${percent}%)`;
  }
  updateSliderFill(document.getElementById("loan"));
  updateSliderFill(document.getElementById("rate"));
  updateSliderFill(document.getElementById("years"));

  const interest = Math.round(totalInterest);
  const ctaMain = document.querySelector(".cta-main p");
  if (ctaMain) {
      /*ctaMain.innerHTML = `Save up to ₹${interest.toLocaleString("en-IN")} on Interest by choosing a better loan`;*/
      ctaMain.innerHTML = `You are overpaying ₹${interest.toLocaleString("en-IN")} on Interest — Fix this now!`;
  }

}

function updateChart(principal, interest) {
  const ctx = document.getElementById('emiChart').getContext('2d');

  if (!chart) {
    // Create ONLY once
    chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Principal', 'Interest'],
        datasets: [{
          data: [Math.round(principal),
          Math.round(interest)],
          backgroundColor: [
            //"#cbd5f5",
            // "#4f6df5",
            "#22d3ee",
            "#3b82f6"
          ],
          borderWidth: 0
        }]
      },
      options: {
        cutout: '75%',

        animation: {
          animateRotate: false,
          animateScale: true,
          duration: 800,
          easing: 'easeOutBack'
        },

        plugins: {
          legend: {
            display: true, //remove legend
            position: 'top',
            labels: {
              color: '#cbd5f5',
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 10,
              boxHeight: 10,
              padding: 15
            },
          }
        }
      }
    });

  } else {
    // ✅ ONLY update values (no destroy)
    chart.data.datasets[0].data = [principal, interest];

    chart.update('active'); // 🔥 smooth transition
  }
}

document.querySelectorAll("input").forEach(input => {
  input.addEventListener("input", calculateEMI);
});

// ===== A/B TEST CTA =====

/*const tataLink = "https://mdeal.in/c_7ogbCr5N";
// Choose version randomly
const variant = Math.random() < 0.5 ? "A" : "B";
// Save variant (so same user sees same CTA)
localStorage.setItem("cta_variant", variant);

// Apply CTA text
const ctaBtn = document.getElementById("mainCTA");
if (ctaBtn) {
  if (variant === "A") {
    ctaBtn.innerText = "🔥 Reduce Your EMI Today →";
  } else {
    ctaBtn.innerText = "⚡ Check Lowest Rates →";
  }

  ctaBtn.href = tataLink;

  // Track clicks
  ctaBtn.addEventListener("click", () => {
    let clicks = JSON.parse(localStorage.getItem("cta_clicks")) || { A: 0, B: 0 };
    clicks[variant]++;
    localStorage.setItem("cta_clicks", JSON.stringify(clicks));
  });
}

const breakdownCTA = document.getElementById("breakdownCTA");
if (breakdownCTA) {
  const savedVariant = localStorage.getItem("cta_variant") || "A";

  if (savedVariant === "A") {
    breakdownCTA.innerText = "⚡ See Best Deals in 2 Minutes →";
  } else {
    breakdownCTA.innerText = "🔥 Get Lowest EMI Offers →";
  }

  breakdownCTA.href = tataLink;
}

*/

// Pulse CTA every few seconds
const ctas = document.querySelectorAll('.cta-btn');

let currentIndex = 0;

function pulseNext() {
  // Remove all
  ctas.forEach(btn => btn.classList.remove('cta-pulse'));

  // Add to current
  const btn = ctas[currentIndex];
  btn.classList.add('cta-pulse');

  // Remove after animation ends
  setTimeout(() => {
    btn.classList.remove('cta-pulse');

    // Next button
    currentIndex = (currentIndex + 1) % ctas.length;

    pulseNext(); // loop
  }, 2000);
}

// Start loop
pulseNext();

//Bottom sticky CTA on scroll + mouse move
const sticky = document.querySelector('.sticky-cta');

let hideTimer;

// Show on interaction
function showSticky() {
  sticky.classList.remove('sticky-hidden');

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    sticky.classList.add('sticky-hidden');
  }, 3000);
}

// Scroll + mouse = trigger
window.addEventListener('scroll', showSticky);
document.addEventListener('mousemove', showSticky);

window.onload = function () {
  const defaultLoan = parseInt(loanSlider.value);
  loanValue.value = formatIndianNumber(String(defaultLoan));
  calculateEMI();

};