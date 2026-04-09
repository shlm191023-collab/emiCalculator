function formatCurrency(num) {
  return "₹" + Number(num).toLocaleString("en-IN");
}

function calculateEMI() {
  let P = document.getElementById("loan").value;
  let r = document.getElementById("rate").value / 12 / 100;
  let n = document.getElementById("years").value * 12;

  let emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  document.getElementById("emi").innerText = formatCurrency(Math.round(emi));
  document.getElementById("loanValue").innerText = formatCurrency(P);
  document.getElementById("rateValue").innerText = document.getElementById("rate").value + "%";
  document.getElementById("yearsValue").innerText = document.getElementById("years").value;
}

document.querySelectorAll("input").forEach(input => {
  input.addEventListener("input", calculateEMI);
});

calculateEMI();
