let chart;
function formatCurrency(num) {
  return "₹" + Number(num).toLocaleString("en-IN");
}
const emiEl = document.getElementById("emi");

function animateEMI(value) {
  emiEl.style.transform = "scale(1.05)";
  setTimeout(() => {
    emiEl.style.transform = "scale(1)";
  }, 150);
}
function downloadPDF() {
  const element = document.querySelector(".wrapper");

  const opt = {
    margin: 0.5,
    filename: 'emi-report.pdf',
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
}

/*function calculateEMI() {
  let P = document.getElementById("loan").value;
  let annualRate = document.getElementById("rate").value;
  let years = document.getElementById("years").value;

  let r = annualRate / 12 / 100;
  let n = years * 12;

  let emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  document.getElementById("emi").innerText = formatCurrency(Math.round(emi));
  document.getElementById("loanValue").innerText = formatCurrency(P);
  document.getElementById("rateValue").innerText = annualRate + "%";
  document.getElementById("yearsValue").innerText = years;
  document.getElementById("principalValue").innerText = formatCurrency(P);
  document.getElementById("interestValue").innerText = formatCurrency(Math.round(totalInterest));

  // Chart
  updateChart(P, totalInterest);
  
  animateEMI(emi);
} */
function generateTable(P, r, n, emi) {
  let balance = P;
  let tbody = document.querySelector("#amortTable tbody");

  if (!tbody) {
    console.log("Table not found");
    return;
  }

  tbody.innerHTML = "";

  for (let i = 1; i <= Math.min(n, 120); i++) {
    let interest = balance * r;
    let principal = emi - interest;
    balance -= principal;

    let row = `
      <tr>
        <td>${i}</td>
        <td>${formatCurrency(emi)}</td>
        <td>${formatCurrency(principal)}</td>
        <td>${formatCurrency(interest)}</td>
        <td>${formatCurrency(Math.abs(balance))}</td>
      </tr>
    `;

    tbody.innerHTML += row;
  }
}
function calculateEMI() {
  let P = Number(document.getElementById("loan").value);
  let annualRate = Number(document.getElementById("rate").value);
  let years = Number(document.getElementById("years").value);

  let r = annualRate / 12 / 100;
  let n = years * 12;

  let emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  let totalPayment = emi * n;
  let totalInterest = totalPayment - P;

  document.getElementById("emi").innerText = formatCurrency(Math.round(emi));
  document.getElementById("loanValue").innerText = formatCurrency(P);
  document.getElementById("rateValue").innerText = annualRate + "%";
  document.getElementById("yearsValue").innerText = years;

  document.getElementById("principalValue").innerText = formatCurrency(P);
  document.getElementById("interestValue").innerText = formatCurrency(Math.round(totalInterest));

  updateChart(P, totalInterest);

  animateEMI(emi);
  generateTable(P, r, n, emi);
}
function updateChart(principal, interest) {
  const ctx = document.getElementById('emiChart').getContext('2d');

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Principal', 'Interest'],
      datasets: [{
        data: [principal, interest],
        backgroundColor: ['#22d3ee', '#3b82f6']
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: 'white'
          }
        }
      }
    }
  });
}

document.querySelectorAll("input").forEach(input => {
  input.addEventListener("input", calculateEMI);
});

window.onload = function () {
  calculateEMI();
};


